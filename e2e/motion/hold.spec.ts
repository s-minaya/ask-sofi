import { expect, test, type Page } from '@playwright/test'
import { setMotionAttribute } from './support.ts'

// Plan 008 §5.2 y D-23, con la implementación (T033, VT4): durante `memory-wipe` el borrado
// restablece la preferencia a `system`, pero la reacción sigue en el modo con el que empezó. Se
// sostiene con el único `data-motion` de <html>, que es lo que lee el CSS, así que lo que se
// comprueba en cada motor es que el anfitrión no cambia de estado mientras dura. Corre en
// Chromium, Firefox y WebKit (D-10).
type Preference = 'system' | 'reduce' | 'full'
type Release = (current: Preference) => void
// Lo que se usa del módulo: no se importa su tipo porque el proyecto de e2e no compila `src/`.
type MotionModule = {
  holdMotion: () => Release
  applyMotionPreference: (preference: Preference) => void
}

// El mismo módulo que usa la aplicación: el servidor de desarrollo lo sirve en una sola URL.
const MOTION_MODULE = '/src/app/providers/motion.ts'

async function startHold(page: Page) {
  await page.evaluate(async (url) => {
    const motion = (await import(/* @vite-ignore */ url)) as MotionModule
    Object.assign(window, { releaseMotionHold: motion.holdMotion() })
  }, MOTION_MODULE)
}

// Lo que haría la aplicación al borrar: la preferencia vuelve a `system`.
const applyPreference = (page: Page, preference: Preference) =>
  page.evaluate(
    async ({ url, value }) => {
      const motion = (await import(/* @vite-ignore */ url)) as MotionModule
      motion.applyMotionPreference(value)
    },
    { url: MOTION_MODULE, value: preference },
  )

const release = (page: Page, preference: Preference) =>
  page.evaluate((value) => {
    const { releaseMotionHold } = window as unknown as {
      releaseMotionHold: Release
    }
    releaseMotionHold(value)
  }, preference)

const attribute = (page: Page) =>
  page.evaluate(() => document.documentElement.dataset.motion)

// Animaciones vivas del retrato del Lab: es el anfitrión del parpadeo.
const blinking = (page: Page) =>
  page
    .locator('[class*="sofi-blink"]')
    .first()
    .evaluate(
      (sprite) =>
        sprite
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running').length,
    )

const CASES = [
  {
    // Modo inicial → lo que decide el sistema una vez restablecida la preferencia.
    name: 'full con el sistema reduciendo',
    system: 'reduce',
    initial: 'full',
    held: { attribute: 'full', blinking: 1 },
    // El sistema deja de pedir reducir a mitad de la reacción: no la altera.
    systemChange: 'no-preference',
    afterRelease: {
      system: 'no-preference',
      attribute: undefined,
      blinking: 1,
    },
  },
  {
    name: 'reduce con el sistema sin pedir reducir',
    system: 'no-preference',
    initial: 'reduce',
    held: { attribute: 'reduce', blinking: 0 },
    systemChange: 'reduce',
    afterRelease: { system: 'reduce', attribute: undefined, blinking: 0 },
  },
  {
    name: 'sistema sin pedir reducir (queda animado)',
    system: 'no-preference',
    initial: undefined,
    held: { attribute: 'full', blinking: 1 },
    systemChange: 'reduce',
    afterRelease: { system: 'reduce', attribute: undefined, blinking: 0 },
  },
  {
    name: 'sistema reduciendo (queda reducido)',
    system: 'reduce',
    initial: undefined,
    held: { attribute: 'reduce', blinking: 0 },
    systemChange: 'no-preference',
    afterRelease: {
      system: 'no-preference',
      attribute: undefined,
      blinking: 1,
    },
  },
] as const

test.describe('holdMotion · modo efectivo durante memory-wipe', () => {
  for (const spec of CASES) {
    test(spec.name, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: spec.system })
      await page.goto('/design-lab?s=sofi')
      await expect(page.locator('[class*="sofi-blink"]').first()).toBeVisible()
      await setMotionAttribute(page, spec.initial)
      await expect.poll(() => blinking(page)).toBe(spec.held.blinking)

      // Antes: sin retención, restablecer a `system` cambiaría el estado del anfitrión.
      await startHold(page)
      expect(await attribute(page)).toBe(spec.held.attribute)

      // El borrado restablece la preferencia y el sistema cambia a mitad: nada se mueve.
      await applyPreference(page, 'system')
      await page.emulateMedia({ reducedMotion: spec.systemChange })
      await expect.poll(() => attribute(page)).toBe(spec.held.attribute)
      await expect.poll(() => blinking(page)).toBe(spec.held.blinking)
      // Lo comprueba también tras dejar pasar fotogramas, no solo al primer sondeo.
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      )
      expect(await blinking(page)).toBe(spec.held.blinking)

      // Al terminar manda la preferencia vigente y el anfitrión sigue al sistema.
      await release(page, 'system')
      await expect.poll(() => attribute(page)).toBe(spec.afterRelease.attribute)
      await expect.poll(() => blinking(page)).toBe(spec.afterRelease.blinking)
    })
  }

  // Manda lo último pedido durante la reacción, y repetir el fin no vuelve a escribir.
  test('lo último pedido se aplica al terminar', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/design-lab?s=sofi')
    await expect(page.locator('[class*="sofi-blink"]').first()).toBeVisible()
    await startHold(page)
    // La preferencia la aplica el proveedor de la aplicación, no el módulo importado aquí: si
    // la página tuviera otra copia del módulo, esta petición escribiría el atributo.
    await page
      .locator('[aria-labelledby="lab-motion"]')
      .getByText('Reducido', { exact: true })
      .click()
    expect(await attribute(page)).toBe('full')
    expect(await blinking(page)).toBe(1)

    await release(page, 'system')
    await expect.poll(() => attribute(page)).toBe('reduce')
    await expect.poll(() => blinking(page)).toBe(0)

    await setMotionAttribute(page, 'full')
    await release(page, 'system')
    expect(await attribute(page)).toBe('full')
    await expect.poll(() => blinking(page)).toBe(1)
  })
})
