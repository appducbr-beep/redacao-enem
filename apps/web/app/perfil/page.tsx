import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import LogoutButton from '@/components/LogoutButton'
import ProfileForm from './ProfileForm'

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  school: 'School',
}

export default async function PerfilPage() {
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

        {/* Plan status */}
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between">
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

        <ProfileForm email={user.email!} initialName={fullName} />

      </div>
    </main>
  )
}
