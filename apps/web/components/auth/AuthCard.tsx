interface Props {
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 px-8 py-10 w-full max-w-md mx-auto lg:mx-0">
      <div className="text-center mb-7">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
