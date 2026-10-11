import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const MESSAGE_LABEL = 'Pégalo tal cual te llegó'
const CONTEXT_LABEL = 'Y ahora, el salseo'
const DRAFT_KEY = 'ask-sofi:session:consultation'
const MOBILE = { width: 390, height: 844 }
const DESKTOP = { width: 1280, height: 800 }

type Probe = {
  audio: string[]
  scrolls: number
  contextState: () => string
}

declare global {
  interface Window {
    __probe: Probe
  }
}

// Observa lo que la aplicación hace de verdad con Web Audio y con el desplazamiento,
// sin sustituir nada: el audio, el contexto y el MP3 son los reales.
async function installProbes(page: Page) {
  await page.addInitScript(() => {
    const audio: string[] = []
    const contexts: AudioContext[] = []
    window.__probe = {
      audio,
      scrolls: 0,
      contextState: () => contexts.at(-1)?.state ?? 'none',
    }
    const Original = window.AudioContext
    class Spy extends Original {
      constructor() {
        super()
        contexts.push(this)
        audio.push('context:created')
      }
      decodeAudioData(data: ArrayBuffer) {
        audio.push('mp3:decoding')
        return super.decodeAudioData(data)
      }
    }
    window.AudioContext = Spy as unknown as typeof AudioContext

    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      audio.push('source:started')
      return start.apply(this, args as never)
    }

    const scrollIntoView = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (...args) {
      window.__probe.scrolls += 1
      return scrollIntoView.apply(this, args as never)
    }
  })
}

// El radio está oculto visualmente: se pulsa su etiqueta, como hace una persona.
async function chooseSound(page: Page, sound: 'Con sonido' | 'Sin sonido') {
  await page.getByText(sound, { exact: true }).click()
  await expect(page.getByRole('radio', { name: sound })).toBeChecked()
}

async function enterConsultation(
  page: Page,
  sound: 'Con sonido' | 'Sin sonido',
) {
  await page.goto('/')
  await chooseSound(page, sound)
  await page.getByRole('button', { name: /Empezar/ }).click()
  await expect(page.getByRole('textbox', { name: MESSAGE_LABEL })).toBeVisible()
}

const audioLog = (page: Page) => page.evaluate(() => window.__probe.audio)
const scrollCount = (page: Page) => page.evaluate(() => window.__probe.scrolls)

async function waitForDraft(page: Page) {
  await page.waitForFunction(
    (key) => window.sessionStorage.getItem(key) !== null,
    DRAFT_KEY,
  )
}

test.describe('sonido real', () => {
  test('en la aplicación, «Con sonido» se activa pero no descarga ni prepara el audio', async ({
    page,
  }) => {
    const mp3Requests: string[] = []
    page.on('request', (request) => {
      // En desarrollo Vite sirve el import del MP3 como módulo («?import»): no es el audio.
      const isAudio =
        request.url().includes('.mp3') && request.resourceType() !== 'script'
      if (isAudio) mp3Requests.push(request.url())
    })
    await installProbes(page)
    await enterConsultation(page, 'Con sonido')
    await expect(
      page.getByRole('button', { name: 'Sonido de Sofi' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
    await page.getByRole('button', { name: /Leer entre líneas/ }).click()
    await expect(page.getByRole('status')).toBeVisible()
    await page.waitForTimeout(1500)

    // Ningún componente de la aplicación reproduce aún la voz de Sofi.
    expect(mp3Requests).toEqual([])
    expect(await audioLog(page)).toEqual([])
  })

  test('en la aplicación, «Sin sonido» no crea contexto de audio ni reproduce nada', async ({
    page,
  }) => {
    await installProbes(page)
    await enterConsultation(page, 'Sin sonido')
    await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
    await page.getByRole('button', { name: /Leer entre líneas/ }).click()
    await expect(page.getByRole('status')).toBeVisible()
    await page.waitForTimeout(1500)

    expect(await audioLog(page)).toEqual([])
  })

  // La voz y el typewriter de Sofi se verifican en el Design Lab: la experiencia
  // de resultados de la aplicación llegará con su feature.
  test('en el Design Lab, la voz de Sofi arranca con el audio real al escribir', async ({
    page,
  }) => {
    await installProbes(page)
    await page.goto('/design-lab?frame=preview&scenario=success')
    await chooseSound(page, 'Con sonido')
    await page.getByRole('button', { name: /Empezar/ }).click()
    // El Design Lab conserva su comportamiento: prepara el audio con el gesto.
    await expect.poll(() => audioLog(page)).toContain('mp3:decoding')
    await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
    expect(await audioLog(page)).not.toContain('source:started')

    await page.getByRole('button', { name: /Leer entre líneas/ }).click()

    await expect
      .poll(() => audioLog(page), { timeout: 15_000 })
      .toContain('source:started')
  })
})

test.describe('consulta activa', () => {
  test('recargar vuelve directamente a la consulta con sus textos', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Empezar/ }).click()
    await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
    await page
      .getByRole('textbox', { name: CONTEXT_LABEL })
      .fill('Ayer discutimos')
    await waitForDraft(page)

    await page.reload()

    await expect(
      page.getByRole('textbox', { name: MESSAGE_LABEL }),
    ).toHaveValue('Vale.')
    await expect(
      page.getByRole('textbox', { name: CONTEXT_LABEL }),
    ).toHaveValue('Ayer discutimos')
    await expect(page.getByRole('button', { name: /Empezar/ })).toHaveCount(0)
  })

  test('«Borrar todo» sigue en la consulta, vacía, tras recargar', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Empezar/ }).click()
    await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
    await waitForDraft(page)

    await page.getByRole('button', { name: 'Borrar todo' }).click()
    await page.reload()

    await expect(
      page.getByRole('textbox', { name: MESSAGE_LABEL }),
    ).toHaveValue('')
  })

  test('volver a la portada y recargar muestra la portada', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Empezar/ }).click()
    await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
    await page
      .getByRole('button', { name: 'Ask Sofi, volver a portada' })
      .click()

    await page.reload()

    await expect(page.getByRole('button', { name: /Empezar/ })).toBeVisible()
  })

  test('eliminar todos los datos devuelve la portada', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Empezar/ }).click()
    await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
    await waitForDraft(page)

    await page.evaluate(async (moduleUrl) => {
      const { clearUserData } = await import(/* @vite-ignore */ moduleUrl)
      clearUserData()
    }, '/src/infrastructure/storage/userData.ts')

    await expect(page.getByRole('button', { name: /Empezar/ })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: /Empezar/ })).toBeVisible()
  })
})

test.describe('desplazamiento a la intervención de Sofi', () => {
  async function askForReading(page: Page) {
    await page.goto('/')
    await page.getByRole('button', { name: /Empezar/ }).click()
    await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
    await page
      .getByRole('textbox', { name: CONTEXT_LABEL })
      .fill('Ayer discutimos por un plan y desde entonces contesta seco.')
    await page.getByRole('button', { name: /Leer entre líneas/ }).click()
  }

  const interventionTop = (page: Page) =>
    page.evaluate(() => {
      const status = document.querySelector('[role="status"]')
      const box = status?.parentElement?.getBoundingClientRect()
      return box ? { top: box.top, height: window.innerHeight } : null
    })

  test('en móvil lleva a la intervención una sola vez, también mientras Sofi escribe', async ({
    page,
  }) => {
    await installProbes(page)
    await page.setViewportSize(MOBILE)
    await askForReading(page)

    await expect.poll(() => scrollCount(page)).toBe(1)
    // Espera a que termine la animación suave antes de medir.
    let previous = -1
    await expect
      .poll(async () => {
        const current = await page.evaluate(() => window.scrollY)
        const settled = current === previous
        previous = current
        return settled
      })
      .toBe(true)
    const visible = await interventionTop(page)
    expect(visible?.top).toBeGreaterThanOrEqual(0)
    expect(visible?.top).toBeLessThan(visible?.height ?? 0)
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

    // Sofi sigue escribiendo: la aplicación no vuelve a desplazar. Solo el propio
    // navegador acota el scroll si el documento se encoge (desaparece «Ver todo»).
    const measure = () =>
      page.evaluate(() => ({
        y: window.scrollY,
        maxY: document.documentElement.scrollHeight - window.innerHeight,
      }))
    const before = await measure()
    await page.waitForTimeout(2500)
    const after = await measure()

    expect(await scrollCount(page)).toBe(1)
    expect(after.y).toBe(Math.min(before.y, after.maxY))
  })

  test('con movimiento reducido llega sin animación', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await installProbes(page)
    await page.setViewportSize(MOBILE)
    await askForReading(page)

    // Sin desplazamiento suave, en el siguiente fotograma ya está colocado.
    await expect.poll(() => scrollCount(page)).toBe(1)
    const first = await page.evaluate(() => window.scrollY)
    await page.waitForTimeout(100)
    expect(await page.evaluate(() => window.scrollY)).toBe(first)
    expect(first).toBeGreaterThan(0)
  })

  test('en escritorio no fuerza el desplazamiento', async ({ page }) => {
    await installProbes(page)
    await page.setViewportSize(DESKTOP)
    await askForReading(page)
    await expect(page.getByRole('status')).toBeVisible()
    await page.waitForTimeout(800)

    expect(await scrollCount(page)).toBe(0)
  })

  test('el estado resultante es accesible y conserva el foco en el botón', async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE)
    await askForReading(page)
    await expect(page.getByRole('status')).toBeVisible()

    await expect(
      page.getByRole('button', { name: /Leer entre líneas/ }),
    ).toBeFocused()
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(violations.map((violation) => violation.id)).toEqual([])
  })
})
