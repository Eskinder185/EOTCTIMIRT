import type { ComponentProps, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  ...rest
}: {
  children: ReactNode
  className?: string
} & ComponentProps<'section'>) {
  return (
    <section
      className={`rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
      {...rest}
    >
      {children}
    </section>
  )
}
