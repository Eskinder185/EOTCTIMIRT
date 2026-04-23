import type { Database } from './database.types'

export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type WeeklyClassRow = TableRow<'weekly_classes'>
export type MezmurRow = TableRow<'mezmurs'>
export type QuestionRow = TableRow<'questions'>
export type MultipleChoiceOptionRow = TableRow<'multiple_choice_options'>
export type AttendanceOptionRow = TableRow<'attendance_options'>
export type WeeklyKnowledgeRow = TableRow<'weekly_knowledge'>
export type UpcomingTimiritRow = TableRow<'upcoming_timirit'>
export type UpcomingMezmurRow = TableRow<'upcoming_mezmurs'>

export type QuestionWithOptionsRow = QuestionRow & {
  multiple_choice_options?: MultipleChoiceOptionRow[]
  attendance_options?: AttendanceOptionRow[]
}

export type WeeklyClassHydratedRow = WeeklyClassRow & {
  mezmurs?: MezmurRow[]
  questions?: QuestionWithOptionsRow[]
}

export type UpcomingTimiritWithMezmursRow = UpcomingTimiritRow & {
  upcoming_mezmurs?: Array<
    Pick<UpcomingMezmurRow, 'title' | 'order_index'> &
    Partial<Omit<UpcomingMezmurRow, 'title' | 'order_index'>>
  >
}

export function toOptionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function toRequiredText(value: string | null | undefined, fallback = ''): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}
