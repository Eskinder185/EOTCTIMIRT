import type { ReactNode } from 'react'

/**
 * Native <details> keeps bundle small and works well on mobile Safari.
 * Open state is user-controlled — avoids long scroll while still allowing depth.
 */
export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-brand-200 bg-white shadow-sm"
    >
      <summary className="cursor-pointer list-none px-4 py-3 sm:px-5 sm:py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-brand-900">{title}</p>
            {subtitle ? (
              <p className="mt-1 text-sm text-brand-700">{subtitle}</p>
            ) : null}
          </div>
          <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-800 group-open:rotate-180 motion-safe:transition-transform">
            ⌄
          </span>
        </div>
      </summary>
      <div className="border-t border-brand-100 px-4 py-3 text-[0.95rem] leading-relaxed text-brand-900 sm:px-5 sm:py-4">
        {children}
      </div>
    </details>
  )
}
