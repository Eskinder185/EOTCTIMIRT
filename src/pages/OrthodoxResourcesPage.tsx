import { Card } from '../components/ui/Card'

const PDF_PATH = '/resources/The%20Faith%20And%20Order%20Of%20The%20Church.pdf'

export function OrthodoxResourcesPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Orthodox Resources
        </p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Study Resources</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          Supporting study materials for parish learning and personal preparation.
        </p>
      </div>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Featured PDF</p>
        <h2 className="mt-1 text-lg font-semibold text-brand-900">The Faith and Order of the Church</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-700">
          A supporting Orthodox study document for parish reading and deeper understanding.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href={PDF_PATH}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Open PDF
          </a>
          <a
            href={PDF_PATH}
            download="the-faith-and-order-of-the-church.pdf"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            Download PDF
          </a>
        </div>
      </Card>
    </div>
  )
}
