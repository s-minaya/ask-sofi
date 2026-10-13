import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  chromium,
  expect,
  test,
  type BrowserContext,
  type Page,
} from '@playwright/test'

// Tamaño de texto del 200 % como lo cambia el usuario en los ajustes del navegador
// (no el zoom de página): sube el tamaño por defecto, que es el que usan rem y las
// media queries en em. Un `font-size` forzado en <html> no lo reproduciría.
const DEFAULT_FONT_PX = 32

const SCREENS = [
  { name: 'portada', scenario: 'success', step: 'landing' },
  { name: 'consulta', scenario: 'success', step: 'consultation' },
  { name: 'procesando', scenario: 'loading', step: 'processing' },
  { name: 'lectura', scenario: 'success', step: 'result' },
  { name: 'falta contexto', scenario: 'needs', step: 'result' },
  { name: 'error', scenario: 'error', step: 'result' },
] as const

// La pantalla mínima soportada, un teléfono y un portátil: donde más aprieta el texto grande.
const WIDTHS = [320, 390, 1280]

// Un solo navegador para todo el fichero: cada contexto lleva su propio perfil.
test.describe.configure({ mode: 'serial' })

let context: BrowserContext

test.beforeAll(async () => {
  const profile = mkdtempSync(join(tmpdir(), 'ask-sofi-text-size-'))
  mkdirSync(join(profile, 'Default'), { recursive: true })
  writeFileSync(
    join(profile, 'Default', 'Preferences'),
    JSON.stringify({
      webkit: { webprefs: { default_font_size: DEFAULT_FONT_PX } },
    }),
  )
  // El tamaño de fuente por defecto solo lo respeta el Chromium completo, no el «headless shell».
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    reducedMotion: 'reduce',
  })
})

test.afterAll(async () => {
  await context.close()
})

// Lo que sobresale del ancho de la pantalla sin estar recortado a propósito.
function overflowOf(page: Page) {
  return page.evaluate(() => {
    const wide: string[] = []
    for (const element of document.querySelectorAll('main *, header *')) {
      // El ticker se desplaza por diseño y el texto solo para lectores mide 1 px.
      if (element.closest('[class*=ticker]')) continue
      const box = element.getBoundingClientRect()
      if (box.width <= 1 || box.height <= 1) continue
      if (box.right > window.innerWidth + 1) {
        // Lo recortado a propósito (el retrato asoma tras un marco) no cuenta.
        let clipped = false
        for (
          let parent = element.parentElement;
          parent && parent !== document.body;
          parent = parent.parentElement
        ) {
          // La raíz de la app también recorta: no cuenta, o ocultaría los desbordes reales.
          if (parent.matches('[class*=_app_]')) continue
          if (getComputedStyle(parent).overflowX !== 'visible') clipped = true
        }
        if (clipped) continue
        wide.push(
          `${element.tagName.toLowerCase()}.${String(element.className).split(' ')[0]}`,
        )
      }
    }
    return {
      page: document.documentElement.scrollWidth - window.innerWidth,
      wide: wide.slice(0, 5),
    }
  })
}

async function showScreen(
  page: Page,
  baseURL: string,
  screen: (typeof SCREENS)[number],
) {
  await page.goto(
    `${baseURL}/design-lab?frame=preview&scenario=${screen.scenario}`,
  )
  // El primer arranque compila los módulos del servidor de desarrollo.
  await expect(page.getByText('Demo · datos simulados')).toBeVisible({
    timeout: 20_000,
  })
  if (screen.step !== 'landing') {
    await page.evaluate(
      (step) =>
        window.postMessage(
          {
            type: 'ask-sofi:preview-command',
            command: { kind: 'step', step },
          },
          window.location.origin,
        ),
      screen.step,
    )
  }
  await page.waitForTimeout(500)
}

for (const width of WIDTHS) {
  for (const screen of SCREENS) {
    test(`text at 200 %: ${screen.name} does not overflow at ${width} px`, async ({
      baseURL,
    }) => {
      if (!baseURL) throw new Error('Falta baseURL en playwright.config.ts')
      const page = await context.newPage()
      await page.setViewportSize({ width, height: 900 })
      try {
        await showScreen(page, baseURL, screen)

        // Sin esto la prueba no demostraría nada: el navegador debe estar a 32 px.
        const root = await page.evaluate(
          () => getComputedStyle(document.documentElement).fontSize,
        )
        expect(root).toBe(`${DEFAULT_FONT_PX}px`)

        const overflow = await overflowOf(page)
        expect(overflow).toEqual({ page: 0, wide: [] })
      } finally {
        await page.close()
      }
    })
  }
}

// La aplicación real: consulta con la invitación y las vistas del expediente.
// Cada una es un paso nuevo sobre la anterior, con el mismo texto al 200 %.
const APP_STEPS = [
  {
    name: 'consulta con invitación',
    run: async (page: Page) => {
      await page.getByRole('button', { name: /Empezar/ }).click()
      await expect(
        page.getByText(
          'Espera, antes de empezar… ¿me das un poco de contexto?',
        ),
      ).toBeVisible()
    },
  },
  {
    name: 'expediente',
    run: async (page: Page) => {
      await page.getByRole('button', { name: 'Responder preguntas' }).click()
      await expect(
        page.getByRole('navigation', { name: 'Las seis áreas' }),
      ).toBeVisible()
    },
  },
  {
    name: 'expediente guardado',
    run: async (page: Page) => {
      await page.locator('fieldset label').first().click()
      await page.getByRole('button', { name: 'Guardar expediente' }).click()
      await expect(
        page.getByText('Expediente guardado en este dispositivo.'),
      ).toBeVisible()
    },
  },
  {
    name: 'confirmar eliminación',
    run: async (page: Page) => {
      await page.getByRole('button', { name: 'Eliminar expediente' }).click()
      await expect(
        page.getByRole('heading', { name: '¿Eliminar el expediente?' }),
      ).toBeVisible()
    },
  },
] as const

for (const width of WIDTHS) {
  test(`text at 200 %: the profile flow does not overflow at ${width} px`, async ({
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Falta baseURL en playwright.config.ts')
    const page = await context.newPage()
    await page.setViewportSize({ width, height: 900 })
    try {
      // El contexto se comparte entre pruebas: cada recorrido empieza de cero
      // (la invitación solo se ofrece una vez y el expediente se recuerda).
      await page.goto(baseURL)
      await page.evaluate(() => {
        window.localStorage.clear()
        window.sessionStorage.clear()
      })
      await page.reload()
      const root = await page.evaluate(
        () => getComputedStyle(document.documentElement).fontSize,
      )
      expect(root).toBe(`${DEFAULT_FONT_PX}px`)

      for (const step of APP_STEPS) {
        await step.run(page)
        await page.waitForTimeout(300)
        const overflow = await overflowOf(page)
        expect(overflow, step.name).toEqual({ page: 0, wide: [] })
      }
    } finally {
      await page.close()
    }
  })
}

// El aviso de sonido bloqueado, con el texto al 200 %: es cuando más crece (más de
// 300 px a 320). No debe tapar ningún control ni invadir lo que va debajo.
for (const width of WIDTHS) {
  test(`text at 200 %: the blocked-sound notice covers nothing at ${width} px`, async ({
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Falta baseURL en playwright.config.ts')
    const page = await context.newPage()
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      // Un AudioContext que nunca llega a «running»: el navegador bloquea el sonido.
      class BlockedContext {
        state = 'suspended'
        currentTime = 0
        destination = {}
        resume() {
          return new Promise<void>(() => {})
        }
        close() {
          return Promise.resolve()
        }
        decodeAudioData() {
          return Promise.resolve({ duration: 1 })
        }
      }
      ;(window as unknown as { AudioContext: unknown }).AudioContext =
        BlockedContext
    })
    try {
      await page.goto(baseURL)
      await page.evaluate(() => {
        window.localStorage.clear()
        window.sessionStorage.clear()
      })
      await page.reload()
      await page.getByText('Con sonido', { exact: true }).click()
      await page.getByRole('button', { name: /Empezar/ }).click()
      await page.getByRole('button', { name: 'Ahora no' }).click()
      await page.getByRole('button', { name: 'Abrir expediente' }).click()
      await expect(
        page.getByText('Tu navegador ha bloqueado el sonido.'),
      ).toBeVisible()
      await page.waitForTimeout(300)

      const found = await page.evaluate(() => {
        const notice = [...document.querySelectorAll('div')].find(
          (element) =>
            element.textContent?.startsWith('Tu navegador ha bloqueado') &&
            getComputedStyle(element).display === 'flex',
        )
        if (!notice) return null
        const box = notice.getBoundingClientRect()
        const covered = [
          ...document.querySelectorAll('button, a, input, textarea, h2'),
        ]
          .filter((element) => !notice.contains(element))
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              rect.top < box.bottom - 1 &&
              rect.bottom > box.top + 1 &&
              rect.left < box.right - 1 &&
              rect.right > box.left + 1
            )
          })
          .map((element) => element.textContent?.trim() || element.tagName)
        return { covered }
      })
      expect(found).not.toBeNull()
      expect(found?.covered).toEqual([])
      expect(await overflowOf(page)).toEqual({ page: 0, wide: [] })
    } finally {
      await page.close()
    }
  })
}
