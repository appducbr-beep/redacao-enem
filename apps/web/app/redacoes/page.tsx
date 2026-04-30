import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import EssayHistoryList from '@/components/EssayHistoryList'

export type EssayItem = {
  id: string
  status: string
  created_at: string
  topic_title: string
  total_score: number | null
}

export default async function RedacoesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('essays')
    .select('id, status, created_at, essay_topics(title), essay_corrections(total_score, c1, c2, c3, c4, c5)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const essays: EssayItem[] = (rows ?? []).map((row) => {
    const correction = Array.isArray(row.essay_corrections)
      ? row.essay_corrections[0]
      : row.essay_corrections
    const topic = Array.isArray(row.essay_topics)
      ? row.essay_topics[0]
      : row.essay_topics

    let total_score: number | null = null
    if (correction) {
      const db = (correction as { total_score?: number; c1?: number; c2?: number; c3?: number; c4?: number; c5?: number })
      total_score =
        db.total_score ||
        ((db.c1 ?? 0) + (db.c2 ?? 0) + (db.c3 ?? 0) + (db.c4 ?? 0) + (db.c5 ?? 0)) ||
        null
    }

    return {
      id: row.id as string,
      status: row.status as string,
      created_at: row.created_at as string,
      topic_title: (topic as { title?: string } | null)?.title ?? 'Tema não identificado',
      total_score,
    }
  })

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Minhas redações</h1>
          <p className="text-sm text-slate-500 mt-1">Últimas 20 redações enviadas</p>
        </div>
        <EssayHistoryList essays={essays} />
      </div>
    </main>
  )
}
