const os = require('os')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

const getServiceState = async (name) => {
  try {
    const { stdout } = await execAsync(`systemctl is-active ${name}`)
    return stdout.trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

const getPm2State = async () => {
  try {
    const { stdout } = await execAsync('pm2 jlist')
    const apps = JSON.parse(stdout || '[]')
    if (!Array.isArray(apps) || apps.length === 0) return 'idle'
    const online = apps.filter((app) => app.pm2_env?.status === 'online').length
    return `${online}/${apps.length} online`
  } catch {
    return 'unknown'
  }
}

const getDiskUsagePercent = async () => {
  try {
    const { stdout } = await execAsync("df -h / | awk 'NR==2 {print $5}'")
    return parseFloat(String(stdout).replace('%', '').trim()) || 0
  } catch {
    return 0
  }
}

const getCpuUsagePercent = () => {
  const loads = os.loadavg()
  const cores = os.cpus().length || 1
  return Math.min(100, Number(((loads[0] / cores) * 100).toFixed(2)))
}

const getRamUsagePercent = () => {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  return Number(((used / total) * 100).toFixed(2))
}

const collectServiceStatus = async () => {
  const [nginx, mysql, postgresql, pm2, diskUsage] = await Promise.all([
    getServiceState('nginx'),
    getServiceState('mysql'),
    getServiceState('postgresql'),
    getPm2State(),
    getDiskUsagePercent(),
  ])

  return {
    nginx,
    mysql,
    postgresql,
    pm2,
    diskUsage,
    ramUsage: getRamUsagePercent(),
    cpuUsage: getCpuUsagePercent(),
  }
}

module.exports = { collectServiceStatus }
