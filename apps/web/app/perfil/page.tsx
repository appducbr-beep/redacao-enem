import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import LogoutButton from '@/components/LogoutButton'
import ProfileForm from './ProfileForm'
import CancelSubscriptionButton from './CancelSubscriptionButton'

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  school: 'School',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

type Props = { searchParams: Promise<{ cancelled?: string }> }

export default async function PerfilPage({ searchParams }: Props) {
  const { cancelled } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan')
    .eq('id', user.id)
    .single()

  const plan = (profile as { full_name?: string; plan?: string } | null)?.plan ?? 'free'
  const fullName = (profile as { full_name?: string; plan?: string } | null)?.full_name ?? ''
  const isPro = plan === 'pro' || plan === 'school'

  // Fetch active subscription details for Pro users
  type SubRow = { cancel_at_period_end: boolean; current_period_end: string | null }
  let subData: SubRow | null = null
  if (isPro) {
    const { data } = await supabase
      .from('subscriptions')
      .select('cancel_at_period_end, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    subData = data as SubRow | null
  }

  const cancelAtPeriodEnd = subData?.cancel_at_period_end ?? false
  const periodEndIso = subData?.current_period_end ?? null

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">

        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">
            ← Início
          </Link>
          <LogoutButton />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meu perfil</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie suas informações pessoais</p>
        </div>

        {/* Cancellation confirmation banners */}
        {cancelled === 'immediate' && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Plano cancelado</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Seu plano foi cancelado dentro do prazo de garantia. O reembolso será processado
              conforme as regras da plataforma de pagamento.
            </p>
          </div>
        )}
        {cancelled === 'scheduled' && periodEndIso && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm font-semibold text-blue-900">Renovação cancelada</p>
            <p className="text-xs text-blue-800 mt-0.5">
              Sua renovação foi cancelada. Seu plano Pro continuará ativo até{' '}
              <span className="font-semibold">{formatDate(periodEndIso)}</span>.
            </p>
          </div>
        )}

        {/* Plan status */}
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Plano atual</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {PLAN_LABELS[plan] ?? plan}
              </p>
            </div>
            {!isPro && (
              <Link
                href="/planos"
                className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors"
              >
                Ver planos Pro
              </Link>
            )}
          </div>

          {isPro && cancelAtPeriodEnd && periodEndIso && (
            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Acesso Pro ativo até{' '}
                <span className="font-semibold text-slate-700">{formatDate(periodEndIso)}</span>.
                Após essa data, você voltará ao plano Gratuito.
              </p>
            </div>
          )}

          {isPro && !cancelAtPeriodEnd && (
            <div className="pt-1 border-t border-slate-100 space-y-2">
              <p className="text-xs text-slate-400">
                Você pode cancelar seu plano a qualquer momento.
              </p>
              <CancelSubscriptionButton />
            </div>
          )}
        </div>

        <ProfileForm email={user.email!} initialName={fullName} />

      </div>
    </main>
  )
}
