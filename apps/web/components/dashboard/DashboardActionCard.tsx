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
      className="group flex flex-col gap-3 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center text-xl transition-colors duration-200">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200">
            {title}
          </span>
          {comingSoon && (
            <span className="text-xs text-slate-400 font-normal">em breve</span>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{description}</p>
      </div>
    </Link>
  )
}
