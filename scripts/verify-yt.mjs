import { chromium } from 'playwright'

const BASE = 'http://localhost:5184'
const out = (s) => process.stdout.write(s + '\n')

const browser = await chromium.launch({
  channel: 'msedge',
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const consoleErrors = []
const requests = []
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))
page.on('request', (r) => requests.push(r.url()))

out('STEP goto')
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: 'scripts/_home.png' })
out('  title=' + JSON.stringify(await page.title()))

// 1) play a generative track → generative player bar (volume slider) should appear
out('STEP click generative track')
await page.locator('section:has-text("Generated Soundscapes") button').first().click()
await page.waitForTimeout(600)
const volBefore = await page.locator('input[aria-label="Volume"]').count()
out('  volume slider count (generative bar): ' + volBefore)

// 2) click a curated card → YouTube bar; generative bar should disappear
out('STEP click curated card')
await page.locator('section:has-text("Curated from the SoundHub") button').first().click()
let iframeOk = false
try {
  await page.waitForSelector('.yt-slot iframe', { timeout: 15000 })
  iframeOk = true
} catch {
  iframeOk = false
}
await page.waitForTimeout(2500)
const iframeSrc = await page.locator('.yt-slot iframe').first().getAttribute('src').catch(() => null)
const volAfter = await page.locator('input[aria-label="Volume"]').count()
const apiLoaded = requests.some((u) => u.includes('iframe_api'))
out('  .yt-slot iframe present: ' + iframeOk)
out('  iframe src: ' + iframeSrc)
out('  iframe_api requested: ' + apiLoaded)
out('  volume slider count after (should be 0): ' + volAfter)
await page.screenshot({ path: 'scripts/_curated.png' })

// 3) play/pause toggle
out('STEP toggle play/pause')
const toggle = page.locator('.glass button[aria-label="Play"], .glass button[aria-label="Pause"]').last()
const labelBefore = await toggle.getAttribute('aria-label').catch(() => null)
await toggle.click()
await page.waitForTimeout(1500)
const labelAfter = await toggle.getAttribute('aria-label').catch(() => null)
out('  toggle aria-label before -> after: ' + labelBefore + ' -> ' + labelAfter)

// 4) close
out('STEP close bar')
await page.locator('button[aria-label="Close"]').last().click()
await page.waitForTimeout(500)
const barGone = (await page.locator('.yt-slot iframe').count()) === 0
out('  yt bar removed on close: ' + barGone)

out('CONSOLE_ERRORS ' + consoleErrors.length)
consoleErrors.slice(0, 10).forEach((e) => out('  ! ' + e))

await browser.close()
