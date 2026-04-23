import { expect, test, type Page, type Route } from '@playwright/test'

type Row = Record<string, unknown>

function pickSingle(rows: Row[], route: Route) {
  const accept = route.request().headers()['accept'] ?? ''
  if (accept.includes('vnd.pgrst.object+json')) return rows[0] ?? {}
  return rows
}

async function respond(route: Route, data: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
}

async function installSupabaseMock(page: Page) {
  const state = {
    weekly_classes: [] as Row[],
    questions: [] as Row[],
    mezmurs: [] as Row[],
    multiple_choice_options: [] as Row[],
    attendance_options: [] as Row[],
    upcoming_timirit: [
      { id: 'upcoming-1', scheduled_date: '2026-05-05', topic_preview: '', note: '', is_active: false, status: 'draft' },
    ] as Row[],
    upcoming_mezmurs: [] as Row[],
    weekly_knowledge: [] as Row[],
  }

  await page.route('**/auth/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()

    if (url.pathname.endsWith('/token') && method === 'POST') {
      await respond(route, {
        access_token: 'mock-access',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'organizer-user-1', email: 'organizer@example.com' },
      })
      return
    }

    if (url.pathname.endsWith('/logout')) {
      await respond(route, {})
      return
    }

    await respond(route, {})
  })

  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const path = url.pathname.split('/rest/v1/')[1] ?? ''
    const table = path.split('/')[0]

    if (table === 'user_profiles' && method === 'GET') {
      await respond(route, pickSingle([{
        id: 'organizer-user-1',
        full_name: 'Organizer',
        role: 'organizer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }], route))
      return
    }

    if (!(table in state)) {
      await respond(route, [])
      return
    }

    const rows = state[table as keyof typeof state]
    const bodyText = request.postData() ?? '{}'
    const body = bodyText ? (JSON.parse(bodyText) as Row | Row[]) : {}

    if (method === 'GET') {
      const idEq = url.searchParams.get('id')?.replace('eq.', '')
      const isActiveEq = url.searchParams.get('is_active')?.replace('eq.', '')
      if (table === 'questions') {
        const weeklyClassId = url.searchParams.get('weekly_class_id')?.replace('eq.', '')
        const filtered = weeklyClassId ? rows.filter((r) => r.weekly_class_id === weeklyClassId) : rows
        await respond(route, pickSingle(filtered, route))
        return
      }
      if (table === 'upcoming_mezmurs') {
        const upcomingId = url.searchParams.get('upcoming_timirit_id')?.replace('eq.', '')
        const filtered = upcomingId ? rows.filter((r) => r.upcoming_timirit_id === upcomingId) : rows
        await respond(route, pickSingle(filtered, route))
        return
      }
      let filtered = rows
      if (idEq) filtered = filtered.filter((r) => r.id === idEq)
      if (isActiveEq) filtered = filtered.filter((r) => String(r.is_active) === isActiveEq)
      await respond(route, pickSingle(filtered, route))
      return
    }

    if (method === 'POST') {
      const incoming = Array.isArray(body) ? body : [body]
      const withIds = incoming.map((item, index) => ({ ...item, id: typeof item.id === 'string' && item.id.length > 0 ? item.id : `${table}-${Date.now()}-${index}` }))
      const next = rows.filter((row) => !withIds.some((w) => w.id === row.id)).concat(withIds)
      ;(state[table as keyof typeof state] as Row[]) = next

      const select = url.searchParams.get('select')
      if (select === 'id') await respond(route, pickSingle(withIds.map((item) => ({ id: item.id })), route))
      else await respond(route, pickSingle(withIds, route))
      return
    }

    if (method === 'PATCH') {
      const idEq = url.searchParams.get('id')?.replace('eq.', '')
      const merged = rows.map((row) => (idEq && row.id === idEq ? { ...row, ...(body as Row) } : row))
      ;(state[table as keyof typeof state] as Row[]) = merged
      await respond(route, pickSingle(merged, route))
      return
    }

    if (method === 'DELETE') {
      const idEq = url.searchParams.get('id')?.replace('eq.', '')
      const weeklyClassIdEq = url.searchParams.get('weekly_class_id')?.replace('eq.', '')
      const questionIdEq = url.searchParams.get('question_id')?.replace('eq.', '')
      const upcomingIdEq = url.searchParams.get('upcoming_timirit_id')?.replace('eq.', '')
      const questionIds = url.searchParams.get('question_id')?.replace('in.(', '').replace(')', '').split(',').filter(Boolean) ?? []
      const filtered = rows.filter((row) => {
        if (idEq && row.id === idEq) return false
        if (weeklyClassIdEq && row.weekly_class_id === weeklyClassIdEq) return false
        if (questionIdEq && row.question_id === questionIdEq) return false
        if (upcomingIdEq && row.upcoming_timirit_id === upcomingIdEq) return false
        if (questionIds.length > 0 && typeof row.question_id === 'string' && questionIds.includes(row.question_id)) return false
        return true
      })
      ;(state[table as keyof typeof state] as Row[]) = filtered
      await respond(route, [])
      return
    }

    await respond(route, [])
  })
}

async function loginOrganizer(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Email Address').fill('organizer@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/admin$/)
}

test.beforeEach(async ({ page }) => {
  await installSupabaseMock(page)
  await loginOrganizer(page)
})

test('organizer dashboard links open real tools', async ({ page }) => {
  await page.goto('/organizer')
  await page.getByRole('link', { name: 'Weekly Classes' }).click()
  await expect(page).toHaveURL(/\/admin\/weekly-classes/)

  await page.goto('/organizer')
  await page.getByRole('link', { name: 'Upcoming Timirit' }).click()
  await expect(page).toHaveURL(/\/admin\/upcoming/)

  await page.goto('/organizer')
  await page.getByRole('link', { name: 'Weekly Knowledge' }).click()
  await expect(page).toHaveURL(/\/admin\/weekly-knowledge/)
})

test('weekly class form supports draft, publish, update, optional fields, bilingual content, and delete', async ({ page }) => {
  await page.goto('/admin/weekly-classes/new')

  await page.getByRole('button', { name: 'Save as draft' }).click()
  await expect(page.getByText('Draft saved on this device.')).toBeVisible()

  await page.getByLabel(/Topic — English/).fill('Grace and discipleship')
  await page.getByLabel(/Title — English/).first().fill('Mezmur one')
  await page.getByRole('button', { name: 'Add multiple-choice' }).click()
  await page.getByLabel(/Prompt — English/).first().fill('What is grace?')
  await page.getByPlaceholder('Choice 1 (English)').fill('Gift from God')
  await page.getByPlaceholder('Choice 1 (Amharic)').fill('ከእግዚአብሔር ስጦታ')
  await page.getByPlaceholder('Choice 2 (English)').fill('A rule')

  await page.getByRole('button', { name: 'Publish weekly class' }).click()
  await expect(page).toHaveURL(/\/admin\/weekly-classes\/.+/)

  await page.getByLabel(/Topic — English/).fill('')
  await page.getByLabel(/Topic — Amharic/).fill('የጸጋ መንገድ')
  await page.getByRole('button', { name: 'Publish update' }).click()
  await expect(page).toHaveURL(/\/admin\/weekly-classes\/.+/)

  await page.goto('/admin/weekly-classes')
  await expect(page.getByText('Grace and discipleship').or(page.getByText('የጸጋ መንገድ')).first()).toBeVisible()

  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Delete' }).first().click()
  await expect(page.getByText('No weekly classes yet')).toBeVisible()
})

test('upcoming timirit supports draft, publish, edit, deactivate, delete, optional and bilingual', async ({ page }) => {
  await page.goto('/admin/upcoming')

  await page.getByLabel('Next topic').fill('Orthodox family prayer')
  await page.getByRole('button', { name: 'Save as draft' }).click()
  await expect(page.getByText('Draft saved. It is private until you publish.')).toBeVisible()

  await page.getByLabel('Next topic').fill('')
  await page.getByLabel('Preview note').fill('')
  await page.getByRole('button', { name: 'Publish update' }).click()
  await expect(page.getByText('Upcoming Timirit published')).toBeVisible()

  await page.getByLabel('Next topic').fill('Orthodox family prayer')
  await page.getByRole('button', { name: 'Publish update' }).click()
  await expect(page.getByText('Upcoming Timirit published')).toBeVisible()

  await page.getByRole('button', { name: 'Deactivate' }).click()
  await expect(page.getByText('moved back to draft')).toBeVisible()

  await page.getByRole('button', { name: 'Delete Upcoming Class' }).click()
  await page.getByRole('button', { name: 'Confirm delete' }).click()
  await expect(page.getByText('deleted permanently')).toBeVisible()
})

test('weekly knowledge supports create draft publish unpublish archive with optional blanks', async ({ page }) => {
  await page.goto('/admin/weekly-knowledge')
  await page.getByRole('button', { name: 'Create new entry' }).click()

  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Week of mercy')
  await page.getByRole('button', { name: 'Save Draft' }).click()
  await expect(page.getByText('Weekly knowledge draft saved.')).toBeVisible()

  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(page.getByText('Weekly knowledge published')).toBeVisible()

  await page.getByRole('button', { name: 'Unpublish' }).click()
  await expect(page.getByText('Entry moved back to draft.')).toBeVisible()

  await page.getByRole('button', { name: 'Archive' }).click()
  await expect(page.getByText('Entry archived/hidden successfully.')).toBeVisible()
})

