interface Props {
  icon?: string
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function AuthCard({ icon, title, subtitle, children }: Props) {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/70 px-8 py-10 w-full max-w-md mx-auto lg:mx-0">
      <div className="text-center mb-7">
        {icon && (
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm">
            {icon}
          </div>
        )}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
