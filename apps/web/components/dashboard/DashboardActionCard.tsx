import Link from 'next/link'

interface Props {
  icon: string
  title: string
  description: string
  href: string
  comingSoon?: boolean
}

export default function DashboardActionCard({ icon, title, description, href, comingSoon }: Props) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
          {title}
        </span>
        {comingSoon && (
          <span className="text-xs text-slate-400 font-normal">em breve</span>
        )}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </Link>
  )
}
