import { tewahedoDailyLinks } from '../site/tewahedoDaily'
import { Card } from './ui/Card'

/** Low-key external references used only when a mezmur needs extra support. */
export function TewahedoDailyPanel() {
  return (
    <Card className="border-brand-100 bg-brand-50/40 shadow-none">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Optional mezmur support
      </p>
      <h2 className="mt-2 text-base font-semibold text-brand-900">Extra references</h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-700">
        If a weekly mezmur needs more practice or lyrics help, these links can help.
        They are only a quiet supplement to the mezmur section here.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {tewahedoDailyLinks.map((item) => (
          <a
            key={item.id}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 flex-col justify-center rounded-xl border border-brand-200 bg-white/80 p-3 text-left hover:border-brand-300"
          >
            <span className="text-sm font-semibold text-brand-900">{item.label}</span>
            <span className="mt-2 text-xs leading-relaxed text-brand-700">{item.description}</span>
          </a>
        ))}
      </div>
    </Card>
  )
}
