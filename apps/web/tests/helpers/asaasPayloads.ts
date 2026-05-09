export const ASAAS_PAYMENT_ID_MONTHLY = 'pay_monthly_001'
export const ASAAS_PAYMENT_ID_YEARLY = 'pay_yearly_001'
export const ASAAS_SUB_ID_MONTHLY = 'sub_monthly_001'
export const ASAAS_SUB_ID_YEARLY = 'sub_yearly_001'

export const paymentConfirmedMonthly = {
  id: 'evt_monthly_001',
  event: 'PAYMENT_CONFIRMED',
  payment: {
    id: ASAAS_PAYMENT_ID_MONTHLY,
    subscription: ASAAS_SUB_ID_MONTHLY,
    status: 'CONFIRMED',
    value: 39.90,
  },
}

export const paymentConfirmedYearly = {
  id: 'evt_yearly_001',
  event: 'PAYMENT_CONFIRMED',
  payment: {
    id: ASAAS_PAYMENT_ID_YEARLY,
    subscription: ASAAS_SUB_ID_YEARLY,
    status: 'CONFIRMED',
    value: 359.90,
  },
}

export const subscriptionCancelled = {
  id: 'evt_cancel_001',
  event: 'SUBSCRIPTION_CANCELLED',
  subscription: {
    id: ASAAS_SUB_ID_MONTHLY,
    status: 'CANCELLED',
    customer: 'cus_001',
  },
}
