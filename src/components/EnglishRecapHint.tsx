import { CURRENT_TOPIC } from '../site/constants'

export function EnglishRecapHint() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 sm:px-5">
      <p className="text-sm font-semibold sm:text-base">English notes beside አማርኛ teaching</p>
      <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
        The Timirit itself stays in the language of the classroom, but we add a humble
        English summary so children, spouses, and newer learners can follow {CURRENT_TOPIC.english}
        {' '}({CURRENT_TOPIC.amharic}). Mark anything unclear in the follow-up — priests and
        teachers use it only to plan a merciful recap.
      </p>
    </div>
  )
}
