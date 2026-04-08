const { PrismaClient } = require('@prisma/client')
const { exec } = require('child_process')
const { promisify } = require('util')
const cloudflare = require('./cloudflare.service')

const prisma = new PrismaClient()
const execAsync = promisify(exec)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const sanitizeUser = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)

const runCommand = async (command) => {
  const { stdout, stderr } = await execAsync(command)
  return { stdout: stdout?.trim(), stderr: stderr?.trim() }
}

const upsertStep = async (jobId, step, updates) => {
  const current = await prisma.provisionJobStep.findFirst({ where: { jobId, step } })
  if (!current) {
    return prisma.provisionJobStep.create({
      data: {
        jobId,
        step,
        ...updates,
      },
    })
  }
  return prisma.provisionJobStep.update({
    where: { id: current.id },
    data: updates,
  })
}

const executeStep = async (job, step, fn) => {
  await upsertStep(job.id, step, { status: 'RUNNING', startedAt: new Date(), error: null })
  try {
    const output = await fn()
    await upsertStep(job.id, step, { status: 'COMPLETED', completedAt: new Date(), output: output || {} })
    return output
  } catch (error) {
    await upsertStep(job.id, step, { status: 'FAILED', completedAt: new Date(), error: error.message })
    throw error
  }
}

const ensureLinuxUser = async (username) => {
  const safeUser = sanitizeUser(username)
  await runCommand(`id -u ${safeUser} >/dev/null 2>&1 || useradd -m -d /home/${safeUser} -s /bin/bash ${safeUser}`)
  await runCommand(`mkdir -p /home/${safeUser}/public_html`)
  await runCommand(`chown -R ${safeUser}:${safeUser} /home/${safeUser}`)
  return safeUser
}

const createNginxVhost = async (domain, docRoot) => {
  const config = [
    'server {',
    '  listen 80;',
    `  server_name ${domain} www.${domain};`,
    `  root ${docRoot};`,
    '  index index.html index.php;',
    '  location / { try_files $uri $uri/ /index.php?$args; }',
    '  location ~ \\.php$ {',
    '    include fastcgi_params;',
    '    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;',
    '    fastcgi_pass unix:/run/php/php8.3-fpm.sock;',
    '  }',
    '}',
  ].join('\n')

  const escaped = config.replace(/'/g, "'\\''")
  await runCommand(`echo '${escaped}' > /etc/nginx/sites-available/${domain}`)
  await runCommand(`ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/${domain}`)
  await runCommand('nginx -t')
  await runCommand('systemctl reload nginx')
}

const ensureDnsZone = async (domain, hostingAccountId) => {
  let zone = await prisma.dnsZone.findUnique({ where: { domain } })
  if (!zone) {
    zone = await prisma.dnsZone.create({
      data: {
        domain,
        hostingAccountId,
        syncStatus: cloudflare.isConfigured() ? 'PENDING' : 'LOCAL_ONLY',
      },
    })
  }

  if (!cloudflare.isConfigured()) return zone

  if (!zone.cloudflareZoneId) {
    const created = await cloudflare.createZone(domain)
    zone = await prisma.dnsZone.update({
      where: { id: zone.id },
      data: { cloudflareZoneId: created.id, syncStatus: 'SYNCED' },
    })
  }
  return zone
}

const createDefaultARecord = async (zone, ipAddress) => {
  if (!cloudflare.isConfigured() || !zone.cloudflareZoneId) return null
  const record = await cloudflare.createRecord(zone.cloudflareZoneId, {
    type: 'A',
    name: '@',
    content: ipAddress,
    ttl: 300,
    proxied: false,
  })
  await prisma.dnsRecord.create({
    data: {
      zoneId: zone.id,
      type: 'A',
      name: '@',
      content: ipAddress,
      ttl: 300,
      proxied: false,
      cloudflareRecordId: record.id,
      status: 'SYNCED',
    },
  })
  return record
}

const provisionAccount = async (job) => {
  const account = await prisma.hostingAccount.findUnique({ where: { id: job.hostingAccountId } })
  if (!account) throw new Error('Cuenta de hosting no encontrada para el job')

  await prisma.provisionJob.update({
    where: { id: job.id },
    data: { status: 'RUNNING', startedAt: new Date(), error: null },
  })

  try {
    const username = await executeStep(job, 'create_linux_user', async () => ensureLinuxUser(account.username))
    const docRoot = `/home/${username}/public_html/${account.primaryDomain}`
    await executeStep(job, 'prepare_public_html', async () => runCommand(`mkdir -p ${docRoot} && chown -R ${username}:${username} /home/${username}`))
    await executeStep(job, 'create_nginx_vhost', async () => createNginxVhost(account.primaryDomain, docRoot))

    const zone = await executeStep(job, 'create_dns_zone', async () => ensureDnsZone(account.primaryDomain, account.id))
    await executeStep(job, 'create_default_dns_record', async () => createDefaultARecord(zone, account.ipAddress || process.env.SERVER_PUBLIC_IP || '127.0.0.1'))

    if (job.payload?.enableSSL) {
      await executeStep(job, 'issue_ssl', async () =>
        runCommand(`certbot --nginx -d ${account.primaryDomain} -d www.${account.primaryDomain} --non-interactive --agree-tos -m ${process.env.SMTP_USER || 'admin@nexhost.pe'}`)
      )
    }

    await prisma.hostingAccount.update({
      where: { id: account.id },
      data: {
        status: 'ACTIVE',
        homeDir: `/home/${username}`,
        docRoot,
      },
    })
    await prisma.provisionJob.update({
      where: { id: job.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  } catch (error) {
    await prisma.hostingAccount.update({
      where: { id: account.id },
      data: { status: 'FAILED' },
    })
    await prisma.provisionJob.update({
      where: { id: job.id },
      data: {
        retries: { increment: 1 },
        status: 'FAILED',
        error: error.message,
        completedAt: new Date(),
      },
    })
  }
}

const MAX_RETRIES = 2

const runWorkerLoop = async () => {
  const job = await prisma.provisionJob.findFirst({
    where: { status: 'PENDING', retries: { lte: MAX_RETRIES } },
    orderBy: { createdAt: 'asc' },
  })
  if (!job) return
  await provisionAccount(job)
}

const startWhmWorker = () => {
  let running = false
  const run = async () => {
    if (running) return
    running = true
    try {
      await runWorkerLoop()
    } catch (error) {
      console.error('WHM worker error:', error.message)
    } finally {
      running = false
    }
  }

  run()
  setInterval(run, 5000)
}

module.exports = { startWhmWorker, sleep }
