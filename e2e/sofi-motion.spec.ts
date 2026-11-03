import { expect, test, type Page } from '@playwright/test'

// Plan 008 §4 y E11: el retrato de Sofi obedece a los seis modos de movimiento (sistema
// normal o reducido × sin atributo, `reduce` o `full`), también con `full` cuando el
// sistema pide reducir. Es el control de E11: antes de que `SofiPortrait` usara el módulo
// dueño de `sofi-blink`, su parpadeo ignoraba `data-motion='full'`.
// Solo Chromium; Firefox y WebKit se añaden con T045/T046.
const MODES = [
  { system: 'no-preference', attribute: undefined, animated: true },
  { system: 'reduce', attribute: undefined, animated: false },
  { system: 'no-preference', attribute: 'reduce', animated: false },
  { system: 'reduce', attribute: 'reduce', animated: false },
  { system: 'no-preference', attribute: 'full', animated: true },
  { system: 'reduce', attribute: 'full', animated: true },
] as const

// El mismo mecanismo que `main.tsx`: un único `data-motion` en <html>.
async function setMotionAttribute(page: Page, attribute: string | undefined) {
  await page.evaluate((value) => {
    if (value) document.documentElement.dataset.motion = value
    else delete document.documentElement.dataset.motion
  }, attribute)
}

// Animaciones vivas del retrato de la sección «Sofi Components» (pieza y pseudoelementos).
const runningAnimations = (page: Page) =>
  page
    .locator('[class*="sofi-blink"]')
    .first()
    .evaluate(
      (sprite) =>
        sprite
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running').length,
    )

test.describe('SofiPortrait · movimiento', () => {
  for (const { system, attribute, animated } of MODES) {
    const name = `sistema ${system} · data-motion ${attribute ?? 'sin atributo'}`

    test(`parpadeo: ${name} → ${animated ? 'animado' : 'reducido'}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: system })
      await page.goto('/design-lab?s=sofi')
      await expect(page.locator('[class*="sofi-blink"]').first()).toBeVisible()
      await setMotionAttribute(page, attribute)

      await expect.poll(() => runningAnimations(page)).toBe(animated ? 1 : 0)
    })

    // Un fotograma fijo no se anima en ningún modo, tampoco con `full`.
    test(`fotograma fijo: ${name} → quieto`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: system })
      await page.goto('/design-lab?s=sofi')
      await page.getByText('F1', { exact: true }).click()
      await setMotionAttribute(page, attribute)

      await expect.poll(() => runningAnimations(page)).toBe(0)
    })
  }
})
