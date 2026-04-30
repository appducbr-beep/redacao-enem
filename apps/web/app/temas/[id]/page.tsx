import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'

type MotivationalText = {
  type: 'text' | 'image' | 'chart'
  source: string
  content?: string
  url?: string
}

type Topic = {
  id: string
  title: string
  year: number | null
  is_free: boolean
  description: string | null
  motivational_texts: MotivationalText[]
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function TopicDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, topicResult] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
    supabase
      .from('essay_topics')
      .select('id, title, year, is_free, description, motivational_texts')
      .eq('id', id)
      .eq('active', true)
      .single(),
  ])

  if (!topicResult.data || topicResult.error) notFound()

  const topic = topicResult.data as Topic
  const plan = profileResult.data?.plan ?? 'free'
  const isUserPro = plan === 'pro' || plan === 'school'
  const accessible = topic.is_free || isUserPro

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">

        <div className="mb-8">
          <Link href="/temas" className="text-sm text-gray-400 hover:text-gray-600">
            ← Temas
          </Link>
        </div>

        <div className="mb-2 flex items-center gap-2">
          {topic.year && (
            <span className="text-xs text-gray-400 font-medium">ENEM {topic.year}</span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              topic.is_free ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
            }`}
          >
            {topic.is_free ? 'Gratuito' : 'Pro'}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-3">
          {topic.title}
        </h1>

        {topic.description && (
          <p className="text-base text-gray-600 mb-6">{topic.description}</p>
        )}

        {!accessible ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-6 py-8 text-center space-y-4">
            <p className="text-sm font-medium text-blue-900">
              Este tema é exclusivo do plano Pro
            </p>
            <p className="text-sm text-blue-700">
              Faça upgrade para acessar todos os temas e recursos da plataforma.
            </p>
            <Link
              href="/planos"
              className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Ver planos
            </Link>
          </div>
        ) : (
          <>
            {topic.motivational_texts && topic.motivational_texts.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  Textos motivadores
                </h2>
                <div className="space-y-5">
                  {topic.motivational_texts.map((item, i) => (
                    <div key={i} className="rounded-lg border border-gray-100 px-5 py-4">
                      {item.content && (
                        <p className="text-sm text-gray-700 leading-relaxed mb-2">
                          {item.content}
                        </p>
                      )}
                      {item.url && (item.type === 'image' || item.type === 'chart') && (
                        <p className="text-xs text-blue-600 mb-2">
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            Ver imagem
                          </a>
                        </p>
                      )}
                      <p className="text-xs text-gray-400">{item.source}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="pt-2">
              <Link
                href={`/redacao/nova?tema_id=${topic.id}`}
                className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white text-center hover:bg-blue-700"
              >
                Começar redação
              </Link>
            </div>
          </>
        )}

      </div>
    </main>
  )
}
