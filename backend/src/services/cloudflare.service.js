const API_BASE = 'https://api.cloudflare.com/client/v4'

const isConfigured = () => Boolean(process.env.CF_API_TOKEN)

const headers = () => ({
  Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
  'Content-Type': 'application/json',
})

const parseResponse = async (res) => {
  const data = await res.json()
  if (!res.ok || data.success === false) {
    const message = data?.errors?.[0]?.message || `Cloudflare error (${res.status})`
    throw new Error(message)
  }
  return data.result
}

const listZones = async () => {
  const url = process.env.CF_ACCOUNT_ID
    ? `${API_BASE}/zones?account.id=${encodeURIComponent(process.env.CF_ACCOUNT_ID)}`
    : `${API_BASE}/zones`
  const res = await fetch(url, { headers: headers() })
  return parseResponse(res)
}

const createZone = async (domain) => {
  const payload = {
    name: domain,
    jump_start: false,
  }
  if (process.env.CF_ACCOUNT_ID) {
    payload.account = { id: process.env.CF_ACCOUNT_ID }
  }
  const res = await fetch(`${API_BASE}/zones`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  })
  return parseResponse(res)
}

const createRecord = async (zoneId, record) => {
  const res = await fetch(`${API_BASE}/zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(record),
  })
  return parseResponse(res)
}

module.exports = {
  isConfigured,
  listZones,
  createZone,
  createRecord,
}
