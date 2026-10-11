import { expect, test, type Page } from '@playwright/test'

const MESSAGE_LABEL = 'Pégalo tal cual te llegó'
const CONTEXT_LABEL = 'Y ahora, el salseo'
const DRAFT_KEY = 'ask-sofi:session:consultation'
const PREFERENCES_KEY = 'ask-sofi:preferences'

test.use({ reducedMotion: 'reduce' })

async function enterConsultation(page: Page) {
  await page.getByRole('button', { name: /Empezar/ }).click()
  await expect(page.getByRole('textbox', { name: MESSAGE_LABEL })).toBeVisible()
}

// El borrador se guarda con una pequeña pausa tras escribir.
async function waitForDraft(page: Page) {
  await page.waitForFunction(
    (key) => window.sessionStorage.getItem(key) !== null,
    DRAFT_KEY,
  )
}

test('the theme choice survives a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Oscuro' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Oscuro' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('the sound choice is remembered but never starts audio by itself', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByText('Con sonido', { exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Con sonido' })).toBeChecked()
  await page.getByRole('button', { name: /Empezar/ }).click()
  await expect(
    page.getByRole('button', { name: 'Sonido de Sofi' }),
  ).toBeVisible()

  // Una visita nueva: otra pestaña no hereda la sesión de la anterior.
  await page.evaluate(() => window.sessionStorage.clear())
  await page.reload()

  await expect(page.getByRole('radio', { name: 'Con sonido' })).toBeChecked()
})

test('the draft and its context survive a reload, and only in sessionStorage', async ({
  page,
}) => {
  await page.goto('/')
  await enterConsultation(page)
  await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
  await page
    .getByRole('textbox', { name: CONTEXT_LABEL })
    .fill('Ayer discutimos')
  await waitForDraft(page)

  await page.reload()
  // La consulta activa se restaura directamente, sin pasar por la portada.
  await expect(page.getByRole('textbox', { name: MESSAGE_LABEL })).toBeVisible()

  await expect(page.getByRole('textbox', { name: MESSAGE_LABEL })).toHaveValue(
    'Vale.',
  )
  await expect(page.getByRole('textbox', { name: CONTEXT_LABEL })).toHaveValue(
    'Ayer discutimos',
  )
  const persistent = await page.evaluate(() =>
    JSON.stringify({ ...window.localStorage }),
  )
  expect(persistent).not.toContain('Vale.')
  expect(persistent).not.toContain('Ayer discutimos')
})

test('«Borrar todo» leaves nothing to recover after a reload', async ({
  page,
}) => {
  await page.goto('/')
  await enterConsultation(page)
  await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
  await waitForDraft(page)

  await page.getByRole('button', { name: 'Borrar todo' }).click()
  await page.reload()
  // La consulta activa se restaura directamente, sin pasar por la portada.
  await expect(page.getByRole('textbox', { name: MESSAGE_LABEL })).toBeVisible()

  await expect(page.getByRole('textbox', { name: MESSAGE_LABEL })).toHaveValue(
    '',
  )
})

test('clearing all user data resets what is on screen and the storage', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Oscuro' }).click()
  await enterConsultation(page)
  await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
  await waitForDraft(page)
  // Otra aplicación del mismo origen: no debe tocarse.
  await page.evaluate(() => window.localStorage.setItem('otra-app:tema', 'x'))

  // Todavía no hay interfaz de gestión de datos: se invoca la operación real.
  // El módulo es el mismo que usa la app, servido por el servidor de desarrollo.
  await page.evaluate(async (moduleUrl) => {
    const { clearUserData } = await import(/* @vite-ignore */ moduleUrl)
    clearUserData()
  }, '/src/infrastructure/storage/userData.ts')

  // El estado inicial es la portada, con el tema del sistema.
  await expect(page.getByRole('button', { name: /Empezar/ })).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/)
  const keys = await page.evaluate(() => [
    ...Object.keys(window.localStorage),
    ...Object.keys(window.sessionStorage),
  ])
  expect(keys.filter((key) => key.startsWith('ask-sofi:'))).toEqual([])
  expect(keys).toContain('otra-app:tema')
  expect(keys).not.toContain(PREFERENCES_KEY)
})

test.describe('with Web Storage blocked', () => {
  test.beforeEach(async ({ page }) => {
    // Simula el modo restringido de algunos navegadores: acceder a la
    // propiedad lanza, como ocurre con las cookies de terceros bloqueadas.
    // El worker de MSW (solo existe en desarrollo) guarda cookies en
    // localStorage y no es lo que se prueba: solo se bloquea cuando el acceso nace en el código de la app (/src/).
    await page.addInitScript(() => {
      for (const name of ['localStorage', 'sessionStorage'] as const) {
        const real = window[name]
        Object.defineProperty(window, name, {
          configurable: true,
          get() {
            if (!(new Error().stack ?? '').includes('/src/')) return real
            throw new DOMException('Acceso denegado', 'SecurityError')
          },
        })
      }
    })
  })

  test('the app loads and the consultation stays usable', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Ask Sofi' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Oscuro' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await enterConsultation(page)
    await page.getByRole('textbox', { name: MESSAGE_LABEL }).fill('Vale.')
    await page.getByRole('button', { name: /Leer entre líneas/ }).click()
    await expect(
      page.getByText(/todavía está calentando motores/),
    ).toBeVisible()

    expect(errors).toEqual([])
  })
})
