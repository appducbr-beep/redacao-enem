// Asaas payment gateway client — server-side only, never import in 'use client' files.

const API_KEY = process.env.ASAAS_API_KEY
const BASE_URL = process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3'

async function asaasFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_KEY) throw new Error('ASAAS_API_KEY não configurada.')

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      access_token: API_KEY,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Asaas ${res.status} em ${path}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ---- Types ----

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj?: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  value: number
  nextDueDate: string
  cycle: string
  status: string
  paymentLink: string | null
}

export interface AsaasPayment {
  id: string
  subscription: string
  customer: string
  value: number
  dueDate: string
  status: string
  invoiceUrl: string
  billingType: string
}

export interface AsaasListResponse<T> {
  totalCount: number
  data: T[]
}

// ---- Customer ----

export async function findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
  const result = await asaasFetch<AsaasListResponse<AsaasCustomer>>(
    `/customers?email=${encodeURIComponent(email)}&limit=1`
  )
  return result.data[0] ?? null
}

export async function createCustomer(data: {
  name: string
  email: string
  cpfCnpj: string
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCustomer(
  customerId: string,
  data: { cpfCnpj: string }
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/customers/${customerId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ---- Subscription ----

export async function createSubscription(data: {
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
  nextDueDate: string
  value: number
  cycle: 'MONTHLY' | 'YEARLY'
  description?: string
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getFirstPendingPayment(subscriptionId: string): Promise<AsaasPayment | null> {
  const result = await asaasFetch<AsaasListResponse<AsaasPayment>>(
    `/subscriptions/${subscriptionId}/payments?status=PENDING&limit=1`
  )
  return result.data[0] ?? null
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await asaasFetch<{ deleted?: boolean }>(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  })
}
