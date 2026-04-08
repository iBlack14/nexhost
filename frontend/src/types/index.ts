// src/types/index.ts

export type UserRole   = 'admin' | 'reseller' | 'client'
export type UserStatus = 'active' | 'suspended' | 'pending' | 'cancelled'
export type DomainType = 'wordpress' | 'node' | 'static' | 'php' | 'python'
export type AppStatus  = 'running' | 'stopped' | 'error'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Plan {
  id:               string
  name:             string
  slug:             string
  price:            number
  disk_gb:          number
  ram_mb:           number
  domains_limit:    number
  databases_limit:  number
  emails_limit:     number
  node_apps_limit:  number
  features:         string[]
}

export interface User {
  id:             string
  name:           string
  email:          string
  image?:         string
  role:           UserRole
  status:         UserStatus
  plan_id?:       string
  plan_name?:     string
  plan_slug?:     string
  disk_used_mb:   number
  disk_gb?:       number
  domains_limit?: number
  node_apps_limit?: number
  plan_expires_at?: string
  created_at:     string
  domain_count?:  number
  node_app_count?: number
}

export interface Domain {
  id:           string
  user_id:      string
  domain:       string
  type:         DomainType
  php_version:  string
  document_root?: string
  ssl_enabled:  boolean
  ssl_expires_at?: string
  status:       'active' | 'suspended' | 'pending' | 'error'
  created_at:   string
  node_app_count?: number
  email_count?: number
}

export interface NodeApp {
  id:            string
  user_id:       string
  domain_id?:    string
  domain?:       string
  name:          string
  port:          number
  start_command: string
  node_version:  string
  status:        AppStatus
  env_vars:      Record<string, string>
  created_at:    string
}

export interface Database {
  id:         string
  user_id:    string
  db_name:    string
  db_user:    string
  db_type:    'mysql' | 'postgresql'
  size_mb:    number
  created_at: string
}

export interface EmailAccount {
  id:         string
  user_id:    string
  domain_id?: string
  address:    string
  quota_mb:   number
  used_mb:    number
  created_at: string
}

export interface Ticket {
  id:            string
  user_id:       string
  subject:       string
  status:        TicketStatus
  priority:      TicketPriority
  message_count?: number
  user_name?:    string
  user_email?:   string
  created_at:    string
  updated_at:    string
  messages?:     TicketMessage[]
}

export interface TicketMessage {
  id:         string
  ticket_id:  string
  user_id:    string
  name:       string
  image?:     string
  role:       UserRole
  message:    string
  is_staff:   boolean
  created_at: string
}

export interface AdminStats {
  users:    { total: number; active: number; suspended: number; new_this_month: number }
  domains:  { total: number; active: number }
  nodeApps: { total: number; running: number }
  revenue:  { this_month: number; last_month: number }
  tickets:  { open: number }
  recentActivity: ActivityLog[]
}

export interface ActivityLog {
  id:            string
  user_id?:      string
  user_name?:    string
  action:        string
  resource_type?: string
  resource_id?:  string
  meta:          Record<string, any>
  created_at:    string
}

export interface ServerStats {
  cpu:        { cores: number; usage: number }
  ram:        { total_gb: number; used_gb: number; usage_pct: number }
  disk:       { total_gb: number; used_gb: number; usage_pct: number }
  bandwidth:  { total_gb: number; used_gb: number; usage_pct: number }
  connections: number
  uptime_days: number
  load_avg:   number[]
}

export type WhmAccountStatus = 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'FAILED'
export type WhmJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface WhmAccount {
  id: string
  username: string
  primaryDomain: string
  ownerUserId: string
  resellerUserId?: string | null
  planName?: string | null
  status: WhmAccountStatus
  homeDir?: string | null
  docRoot?: string | null
  ipAddress?: string | null
  port?: number | null
  sslEnabled: boolean
  createdAt: string
  updatedAt: string
  owner?: { id: string; name: string; email: string }
  reseller?: { id: string; name: string; email: string }
}

export interface ProvisionJobStep {
  id: string
  jobId: string
  step: string
  status: WhmJobStatus
  error?: string | null
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
}

export interface ProvisionJob {
  id: string
  hostingAccountId?: string | null
  requestedById?: string | null
  status: WhmJobStatus
  type: 'CREATE_HOSTING_ACCOUNT'
  error?: string | null
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
  steps: ProvisionJobStep[]
}

export interface DnsZoneData {
  id: string
  domain: string
  cloudflareZoneId?: string | null
  syncStatus: string
  records: Array<{
    id: string
    type: 'A' | 'CNAME' | 'TXT'
    name: string
    content: string
    ttl: number
    proxied: boolean
    status: string
  }>
}

export interface ServiceStatus {
  id: string
  nginx: string
  mysql: string
  postgresql: string
  pm2: string
  diskUsage: number
  ramUsage: number
  cpuUsage: number
  capturedAt: string
}
