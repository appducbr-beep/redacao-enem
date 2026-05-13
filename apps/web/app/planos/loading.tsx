export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="px-4 pt-6 max-w-4xl mx-auto">
        <div className="h-4 w-14 rounded bg-slate-200 animate-pulse" />
      </div>
      <section className="px-4 mt-6 mb-10">
        <div className="max-w-4xl mx-auto">
          <div className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
        </div>
      </section>
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </section>
    </main>
  )
}
