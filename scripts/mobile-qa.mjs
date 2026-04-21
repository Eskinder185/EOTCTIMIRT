import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = 'http://127.0.0.1:4173'
const outputDir = path.resolve('qa-output')

const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
]

const routes = [
  { name: 'home', path: '/' },
  { name: 'this-week', path: '/this-week' },
  { name: 'missed', path: '/missed' },
  { name: 'mezmurs', path: '/mezmurs' },
  { name: 'past-classes', path: '/classes' },
  { name: 'contact', path: '/contact' },
  { name: 'class-sample', path: '/class/week-01' },
  { name: 'admin-login', path: '/admin/login' },
]

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function run() {
  await ensureDir(outputDir)
  const browser = await chromium.launch({ headless: true })
  const report = []

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    })

    for (const route of routes) {
      const page = await context.newPage()
      const url = `${baseUrl}${route.path}`
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.addStyleTag({
        content: `html { scroll-behavior: auto !important; }`,
      })

      const metrics = await page.evaluate(() => {
        const body = document.body
        const doc = document.documentElement
        const interactiveSelectors = [
          'a',
          'button',
          'summary',
          'input',
          'textarea',
          'select',
          '[role="button"]',
        ].join(',')

        const textNodes = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, li, a, button, label, summary'))
        const tapTargets = Array.from(document.querySelectorAll(interactiveSelectors)).map((el) => {
          const rect = el.getBoundingClientRect()
          const style = window.getComputedStyle(el)
          const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)
          return {
            text,
            width: rect.width,
            height: rect.height,
            display: style.display,
            visible: rect.width > 0 && rect.height > 0,
            top: rect.top,
          }
        })

        const smallTapTargets = tapTargets.filter((item) => item.visible && (item.width < 44 || item.height < 44))
        const wideElements = Array.from(document.querySelectorAll('body *')).map((el) => {
          const rect = el.getBoundingClientRect()
          const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)
          return {
            tag: el.tagName.toLowerCase(),
            width: rect.width,
            left: rect.left,
            right: rect.right,
            text,
          }
        }).filter((item) => item.right - item.left > window.innerWidth + 1)

        const clippedText = textNodes.map((el) => {
          const rect = el.getBoundingClientRect()
          return {
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
            clientHeight: el.clientHeight,
            scrollHeight: el.scrollHeight,
            lineHeight: window.getComputedStyle(el).lineHeight,
            width: rect.width,
          }
        }).filter((item) => item.scrollHeight > item.clientHeight + 2)

        const cards = Array.from(document.querySelectorAll('[class*="rounded-2xl"], [class*="rounded-3xl"]')).map((el) => {
          const rect = el.getBoundingClientRect()
          return {
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
            height: rect.height,
            width: rect.width,
          }
        })

        const tallCards = cards.filter((card) => card.height > window.innerHeight * 0.9)
        const embeds = Array.from(document.querySelectorAll('iframe, video')).map((el) => {
          const rect = el.getBoundingClientRect()
          return {
            width: rect.width,
            height: rect.height,
          }
        })

        return {
          title: document.title,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          scrollHeight: doc.scrollHeight,
          bodyScrollWidth: body.scrollWidth,
          hasHorizontalScroll: doc.scrollWidth > doc.clientWidth + 1,
          smallTapTargets: smallTapTargets.slice(0, 15),
          smallTapTargetCount: smallTapTargets.length,
          wideElements: wideElements.slice(0, 10),
          clippedText: clippedText.slice(0, 10),
          tallCards: tallCards.slice(0, 10),
          embedMetrics: embeds,
          firstActionOffset: (() => {
            const firstAction = document.querySelector('a, button, summary')
            if (!firstAction) return null
            return firstAction.getBoundingClientRect().top
          })(),
        }
      })

      const screenshotPath = path.join(outputDir, `${route.name}-${viewport.name}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: true })
      report.push({ route: route.name, path: route.path, viewport, screenshotPath, metrics })
      await page.close()
    }

    await context.close()
  }

  await fs.writeFile(path.join(outputDir, 'mobile-report.json'), JSON.stringify(report, null, 2))
  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
