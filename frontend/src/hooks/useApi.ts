// src/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Domain, NodeApp, Ticket, AdminStats, ServerStats, User,
  WhmAccount, ProvisionJob, DnsZoneData, ServiceStatus,
} from '@/types'
import toast from 'react-hot-toast'

// ── Me / Profile ──────────────────────────────────────────
export const useMe = () =>
  useQuery<User>({
    queryKey: ['me'],
    queryFn:  () => api.get('/auth/me').then(r => r.data),
  })

// ── Domains ───────────────────────────────────────────────
export const useDomains = () =>
  useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn:  () => api.get('/domains').then(r => r.data),
  })

export const useCreateDomain = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Domain>) => api.post('/domains', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['domains'] })
      toast.success('Dominio creado exitosamente')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error al crear dominio'),
  })
}

export const useDeleteDomain = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/domains/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['domains'] })
      toast.success('Dominio eliminado')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error al eliminar'),
  })
}

// ── Node Apps ─────────────────────────────────────────────
export const useNodeApps = () =>
  useQuery<NodeApp[]>({
    queryKey: ['node-apps'],
    queryFn:  () => api.get('/apps').then(r => r.data),
  })

export const useCreateNodeApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<NodeApp>) => api.post('/apps', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['node-apps'] })
      toast.success('App creada')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error al crear app'),
  })
}

export const useRestartApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/apps/${id}/status`, { status: 'RUNNING' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['node-apps'] })
      toast.success('App reiniciada')
    },
    onError: () => toast.error('Error al reiniciar'),
  })
}

export const useStopApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/apps/${id}/status`, { status: 'STOPPED' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['node-apps'] })
      toast.success('App detenida')
    },
  })
}

// ── Tickets ───────────────────────────────────────────────
export const useTickets = () =>
  useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn:  () => api.get('/tickets').then(r => r.data),
  })

export const useTicket = (id: string) =>
  useQuery<Ticket>({
    queryKey: ['tickets', id],
    queryFn:  () => api.get(`/tickets/${id}`).then(r => r.data),
    enabled: !!id,
  })

export const useCreateTicket = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { subject: string; message: string; priority?: string }) =>
      api.post('/tickets', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Ticket creado')
    },
  })
}

export const useReplyTicket = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (message: string) => api.post(`/tickets/${id}/reply`, { message }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets', id] }),
  })
}

// ── Admin ─────────────────────────────────────────────────
export const useAdminStats = () =>
  useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn:  () => api.get('/admin/stats').then(r => r.data),
    refetchInterval: 30_000,
  })

export const useServerStats = () =>
  useQuery<ServerStats>({
    queryKey: ['server-stats'],
    queryFn:  () => api.get('/admin/server-stats').then(r => r.data),
    refetchInterval: 10_000,
  })

export const useAdminUsers = (params?: { search?: string; status?: string; page?: number }) =>
  useQuery({
    queryKey: ['admin-users', params],
    queryFn:  () => api.get('/admin/users', { params }).then(r => r.data),
  })

export const useUpdateUserStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/users/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Estado actualizado')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  })
}

// ── WHM ───────────────────────────────────────────────────
export const useWhmAccounts = (params?: { status?: string; resellerId?: string }) =>
  useQuery<WhmAccount[]>({
    queryKey: ['whm-accounts', params],
    queryFn: () => api.get('/admin/whm/accounts', { params }).then((r) => r.data),
  })

export const useCreateWhmAccount = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      username: string
      primaryDomain: string
      ownerEmail: string
      ownerName: string
      ownerPassword?: string
      planName?: string
      enableSSL?: boolean
      ipAddress?: string
      resellerUserId?: string
    }) => api.post('/admin/whm/accounts', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whm-accounts'] })
      toast.success('Cuenta encolada para aprovisionamiento')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error creando cuenta'),
  })
}

export const useProvisionJob = (jobId?: string) =>
  useQuery<ProvisionJob>({
    queryKey: ['whm-job', jobId],
    queryFn: () => api.get(`/admin/whm/jobs/${jobId}`).then((r) => r.data),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'COMPLETED' || status === 'FAILED' ? false : 3000
    },
  })

export const useWhmDnsZones = () =>
  useQuery<{ zones: DnsZoneData[]; cloudflareZones: any[]; cloudflareConfigured: boolean }>({
    queryKey: ['whm-dns-zones'],
    queryFn: () => api.get('/admin/whm/dns/zones').then((r) => r.data),
  })

export const useCreateWhmDnsRecord = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      zoneId: string
      type: 'A' | 'CNAME' | 'TXT'
      name: string
      content: string
      ttl?: number
      proxied?: boolean
    }) => api.post(`/admin/whm/dns/zones/${data.zoneId}/records`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whm-dns-zones'] })
      toast.success('Registro DNS creado')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error creando registro DNS'),
  })
}

export const useWhmServiceStatus = () =>
  useQuery<ServiceStatus>({
    queryKey: ['whm-service-status'],
    queryFn: () => api.get('/admin/whm/services/status').then((r) => r.data),
    refetchInterval: 10000,
  })
