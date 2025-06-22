import { ReactNode } from "react"

interface PanelProps {
  title: string
  icon?: ReactNode
  count?: number
  loading?: boolean
  isOnline?: boolean
  error?: string | null
  children: ReactNode
  className?: string
  headerAction?: ReactNode
}

export function Panel({
  title,
  icon,
  count,
  loading = false,
  isOnline = true,
  error = null,
  children,
  className = "",
  headerAction,
}: PanelProps) {
  return (
    <div className={`p-4 h-full flex flex-col ${className}`}>
      <div className="flex items-center gap-2 mb-4 group">
        {icon && <span className="h-4 w-4 transition-transform duration-200 group-hover:scale-110">{icon}</span>}
        <div className="text-sm font-medium">{title}</div>
        <div className="flex items-center gap-1 ml-auto">
          {loading ? (
            <span className="h-3 w-3 animate-spin text-blue-400" />
          ) : isOnline ? (
            <span className="h-3 w-3 text-green-400" />
          ) : (
            <span className="h-3 w-3 text-orange-400" />
          )}
          {count !== undefined && <span className="text-xs text-gray-400">{count}</span>}
        </div>
        {headerAction}
      </div>

      {error && (
        <div className="mb-4 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <div className="text-xs text-orange-400">{error}</div>
        </div>
      )}

      {children}
    </div>
  )
}
