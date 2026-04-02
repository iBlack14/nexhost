// src/services/ssh.service.js
const { NodeSSH } = require('node-ssh')
require('dotenv').config()

const ssh = new NodeSSH()

let connected = false

const connect = async () => {
  if (connected) return
  await ssh.connect({
    host:       process.env.VPS_HOST,
    username:   process.env.VPS_USER,
    privateKey: process.env.VPS_SSH_KEY_PATH,
  })
  connected = true
}

const exec = async (command) => {
  await connect()
  const result = await ssh.execCommand(command)
  if (result.stderr && result.stderr.length > 0) {
    console.warn(`SSH stderr: ${result.stderr}`)
  }
  return result.stdout
}

// Crear usuario Linux para nuevo cliente
const createLinuxUser = async (username) => {
  const commands = [
    `useradd -m -d /home/${username} -s /bin/bash ${username}`,
    `mkdir -p /home/${username}/public_html`,
    `chown -R ${username}:${username} /home/${username}`,
    `chmod 755 /home/${username}`,
  ]
  for (const cmd of commands) {
    await exec(cmd)
  }
  return `/home/${username}`
}

// Instalar WordPress en un dominio
const installWordPress = async (username, domain) => {
  const path = `/home/${username}/public_html/${domain}`
  const commands = [
    `mkdir -p ${path}`,
    `cd ${path} && wp core download --allow-root`,
    `chown -R ${username}:${username} ${path}`,
  ]
  for (const cmd of commands) {
    await exec(cmd)
  }
}

// Crear vhost Nginx
const createNginxVhost = async (domain, docRoot) => {
  const config = `server {
    listen 80;
    server_name ${domain} www.${domain};
    root ${docRoot};
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \\.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}`
  await exec(`echo '${config}' > /etc/nginx/sites-available/${domain}`)
  await exec(`ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/`)
  await exec(`nginx -t && systemctl reload nginx`)
}

// Instalar SSL con Certbot
const installSSL = async (domain) => {
  await exec(`certbot --nginx -d ${domain} -d www.${domain} --non-interactive --agree-tos -m admin@nexhost.pe`)
}

module.exports = { exec, createLinuxUser, installWordPress, createNginxVhost, installSSL }
