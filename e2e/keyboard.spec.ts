import { expect, test, type Page } from '@playwright/test'

// Qué tiene el foco y si se ve: el anillo puede estar en el propio control o en la
// etiqueta que envuelve un radio oculto.
function focusInfo(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null
    if (!element || element === document.body) return null
    const ring = element.matches('input[type="radio"], input[type="checkbox"]')
      ? (element.closest('label') ?? element)
      : element
    const style = getComputedStyle(ring)
    const visible =
      style.outlineStyle !== 'none' &&
      Number.parseFloat(style.outlineWidth) >= 2
    // Nombre visible: la etiqueta del radio o el texto sin las partes decorativas (aria-hidden).
    const labelled =
      element instanceof HTMLInputElement ? element.labels?.[0] : null
    const source = (labelled ?? element).cloneNode(true) as HTMLElement
    source
      .querySelectorAll('[aria-hidden="true"]')
      .forEach((node) => node.remove())
    const name =
      element.getAttribute('aria-label') ??
      source.textContent?.trim().replace(/\s+/g, ' ') ??
      ''
    return { name: name || element.tagName.toLowerCase(), visible }
  })
}

test.use({ reducedMotion: 'reduce' })

test('every stop on the landing shows a visible focus ring', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Empezar/ })).toBeVisible()

  const stops: Array<{ name: string; visible: boolean }> = []
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press('Tab')
    const info = await focusInfo(page)
    if (!info) break
    stops.push(info)
  }

  expect(stops.map((stop) => stop.name)).toEqual([
    'Saltar al contenido',
    'Pausar titulares',
    'Claro',
    'Oscuro',
    'Sistema',
    'Sin sonido',
    'Empezar',
  ])
  expect(stops.filter((stop) => !stop.visible)).toEqual([])
})

test('the whole entry can be done with the keyboard alone', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Empezar/ })).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Saltar al contenido' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#contenido')).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('radio', { name: 'Sin sonido' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Con sonido' })).toBeChecked()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /Empezar/ })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Pégalo tal cual te llegó' }),
  ).toBeFocused()
  await expect(
    page.getByRole('button', { name: 'Sonido de Sofi' }),
  ).toHaveAttribute('aria-pressed', 'true')

  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('textbox', { name: 'Pégalo tal cual te llegó' }),
  ).toBeFocused()
  await page.keyboard.type('Vale.')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('textbox', { name: 'Y ahora, el salseo' }),
  ).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: /Leer entre líneas/ }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText(
    'Sofi todavía está calentando motores',
  )

  // El logo de la cabecera vuelve a la portada y lleva el foco a su titular.
  await page.getByRole('button', { name: 'Ask Sofi, volver a portada' }).focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { level: 2, name: /Qué ha querido decir con/ }),
  ).toBeFocused()
})

test('the ticker can be paused from the keyboard', async ({ page }) => {
  await page.goto('/')
  const pause = page.getByRole('button', { name: 'Pausar titulares' })
  await pause.focus()
  await page.keyboard.press('Enter')
  await expect(pause).toHaveAttribute('aria-pressed', 'true')
})

// El expediente completo con el teclado (004, T028): abrir, responder, recorrer
// las áreas, guardar y eliminar, con el foco siempre visible.
test('the profile can be filled in, saved and deleted with the keyboard alone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await page.getByRole('button', { name: /Empezar/ }).click()
  await expect(
    page.getByText('Espera, antes de empezar… ¿me das un poco de contexto?'),
  ).toBeVisible()

  const stops: Array<{ name: string; visible: boolean }> = []
  const record = async () => {
    const info = await focusInfo(page)
    if (info) stops.push(info)
  }

  // Una pulsación de teclado antes de enfocar: sin ella el foco programático
  // tras un clic no cuenta como «de teclado» y no muestra el anillo.
  await page.keyboard.press('Shift')
  await page.getByRole('button', { name: 'Responder preguntas' }).focus()
  await record()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Expediente de tu pareja' }),
  ).toBeFocused()

  // De la ficha al primer control: volver, y después las opciones.
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: /Volver a la consulta/ }),
  ).toBeFocused()
  await record()
  await page.keyboard.press('Tab')
  const firstOption = page.getByRole('radio').first()
  await expect(firstOption).toBeFocused()
  await record()

  // Una opción con las flechas y «Siguiente pregunta» solo a petición.
  await page.keyboard.press('ArrowDown')
  await expect(
    page.getByRole('radio', { name: 'Suele dar indirectas' }),
  ).toBeChecked()
  await expect(page.locator('figure p:not([aria-hidden="true"])')).toHaveText(
    'Cuando algo le molesta, ¿cómo suele expresarlo?',
  )
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Quitar respuesta' }),
  ).toBeFocused()
  await record()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Siguiente pregunta' }),
  ).toBeFocused()
  await record()
  await page.keyboard.press('Enter')
  await expect(page.locator('figure p:not([aria-hidden="true"])')).toHaveText(
    '¿Utiliza la ironía o el sarcasmo al escribir?',
  )

  // El índice de áreas, con el teclado.
  await page
    .getByRole('navigation', { name: 'Las seis áreas' })
    .getByRole('button', { name: /Estilo habitual/ })
    .focus()
  await record()
  await page.keyboard.press('Enter')
  // El foco pasa a las respuestas de la pregunta elegida, sin tener que
  // volver atrás por el índice.
  await expect(
    page
      .getByRole('group', { name: /Pregunta 6 de 6/ })
      .getByRole('radio')
      .first(),
  ).toBeFocused()
  await record()

  // Notas, guardar y eliminar.
  const notes = page.getByRole('textbox', { name: /Notas adicionales/ })
  await notes.focus()
  await record()
  await page.keyboard.type('Contesta tarde.')
  const save = page.getByRole('button', { name: 'Guardar expediente' })
  await save.focus()
  await record()
  await page.keyboard.press('Enter')
  await expect(
    page.getByText('Expediente guardado en este dispositivo.'),
  ).toBeVisible()

  const remove = page.getByRole('button', { name: 'Eliminar expediente' })
  await remove.focus()
  await record()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { name: '¿Eliminar el expediente?' }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Eliminar', exact: true }),
  ).toBeFocused()
  await record()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Expediente de tu pareja' }),
  ).toBeFocused()

  expect(stops.length).toBeGreaterThanOrEqual(9)
  expect(stops.filter((stop) => !stop.visible)).toEqual([])
})
