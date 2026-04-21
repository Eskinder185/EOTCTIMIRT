export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

// Enhanced mobile-first button base with larger touch targets
export const buttonBase =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 active:scale-98 disabled:pointer-events-none disabled:opacity-50'

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-600 text-white shadow-sm hover:bg-accent-500 hover:shadow-md active:bg-accent-700 active:translate-y-[0.5px]',
  secondary:
    'border border-brand-200 bg-white text-brand-900 shadow-sm hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100',
  ghost: 'text-brand-800 hover:bg-brand-100 active:bg-brand-200',
}

export function buttonClass(variant: ButtonVariant = 'primary', extra = '') {
  return `${buttonBase} ${buttonVariants[variant]} ${extra}`.trim()
}
