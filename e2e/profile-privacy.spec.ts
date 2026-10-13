import { expect, test, type Page } from '@playwright/test'

// Crear, editar y eliminar el expediente no sale del dispositivo ni deja
// contenido privado en logs, URL ni almacenamiento ajeno (004-spec §6, T029).
test.use({ reducedMotion: 'reduce' })

const PRIVATE_NOTE = 'NOTA-PRIVADA-8431 contesta tarde y con monosílabos'
const PRIVATE_MESSAGE = 'MENSAJE-PRIVADO-2290 vale.'

async function useProfile(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Empezar/ }).click()
  await page
    .getByRole('textbox', { name: 'Pégalo tal cual te llegó' })
    .fill(PRIVATE_MESSAGE)
  await page.getByRole('button', { name: 'Responder preguntas' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Expediente de tu pareja' }),
  ).toBeFocused()
  const group = page.getByRole('group', { name: /Pregunta \d de 6/ })
  await group.getByText('Suele dar indirectas', { exact: true }).click()
  await page
    .getByRole('textbox', { name: /Notas adicionales/ })
    .fill(PRIVATE_NOTE)
  await page.getByRole('button', { name: 'Guardar expediente' }).click()
  await expect(
    page.getByText('Expediente guardado en este dispositivo.'),
  ).toBeVisible()
  // Editar, descartar y eliminar también.
  await group.getByText('Depende', { exact: true }).click()
  await page.getByRole('button', { name: 'Descartar cambios' }).click()
  await page.getByRole('button', { name: 'Eliminar expediente' }).click()
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)
}

test('no hace peticiones fuera del origen ni envía el contenido del expediente', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw new Error('Falta baseURL en playwright.config.ts')
  const origin = new URL(baseURL).origin
  const outside: string[] = []
  const writes: string[] = []
  const leaks: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin !== origin) outside.push(request.url())
    if (request.method() !== 'GET')
      writes.push(`${request.method()} ${url.pathname}`)
    const haystack = `${request.url()} ${request.postData() ?? ''}`
    for (const secret of [PRIVATE_NOTE, PRIVATE_MESSAGE, 'drops-hints'])
      if (
        haystack.includes(secret) ||
        haystack.includes(encodeURIComponent(secret))
      )
        leaks.push(`${request.method()} ${url.pathname}`)
  })

  await useProfile(page)

  expect(outside).toEqual([])
  expect(writes).toEqual([])
  expect(leaks).toEqual([])
})

test('no deja contenido del expediente en la consola ni en la URL', async ({
  page,
}) => {
  const logged: string[] = []
  page.on('console', (message) => logged.push(message.text()))
  page.on('pageerror', (error) => logged.push(error.message))

  await useProfile(page)

  const leaked = logged.filter((line) =>
    [PRIVATE_NOTE, PRIVATE_MESSAGE, 'drops-hints', 'depends'].some((secret) =>
      line.includes(secret),
    ),
  )
  expect(leaked).toEqual([])
  expect(new URL(page.url()).search).toBe('')
  expect(new URL(page.url()).hash).toBe('')
})

test('el contenido solo vive en las claves previstas de este dominio', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Empezar/ }).click()
  await page.getByRole('button', { name: 'Responder preguntas' }).click()
  await page
    .getByRole('group', { name: /Pregunta \d de 6/ })
    .getByText('Suele dar indirectas', { exact: true })
    .click()
  await page
    .getByRole('textbox', { name: /Notas adicionales/ })
    .fill(PRIVATE_NOTE)
  await page.getByRole('button', { name: 'Guardar expediente' }).click()
  await expect(
    page.getByText('Expediente guardado en este dispositivo.'),
  ).toBeVisible()

  const storage = await page.evaluate(() => ({
    local: Object.keys(window.localStorage),
    session: Object.keys(window.sessionStorage),
    cookies: document.cookie,
    withNote: Object.entries(window.localStorage)
      .filter(([, value]) => value.includes('NOTA-PRIVADA-8431'))
      .map(([key]) => key),
    noteInSession: Object.entries(window.sessionStorage)
      .filter(([, value]) => value.includes('NOTA-PRIVADA-8431'))
      .map(([key]) => key),
  }))

  // Solo claves de Ask Sofi, y la nota únicamente en el expediente.
  for (const key of [...storage.local, ...storage.session])
    expect(key.startsWith('ask-sofi:')).toBe(true)
  expect(storage.withNote).toEqual(['ask-sofi:partner-profile'])
  expect(storage.noteInSession).toEqual([])
  expect(storage.cookies).toBe('')
})
