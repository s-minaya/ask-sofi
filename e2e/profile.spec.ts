import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Invitación, acceso y ficha del expediente (004, T013–T017). La creación, el
// guardado y la eliminación de extremo a extremo llegan en T025.
test.use({ reducedMotion: 'reduce' })

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function enter(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Empezar/ }).click()
  await expect(
    page.getByRole('textbox', { name: 'Pégalo tal cual te llegó' }),
  ).toBeVisible()
}

async function openSheet(page: Page) {
  await page
    .getByRole('button', {
      name: /^(Responder preguntas|Abrir expediente|Editar expediente)$/,
    })
    .click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Expediente de tu pareja' }),
  ).toBeFocused()
}

async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze()
  expect(
    violations.map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
    ),
  ).toEqual([])
}

test('la invitación se ofrece una vez y el acceso permanece', async ({
  page,
}) => {
  await enter(page)
  await expect(
    page.getByText('Espera, antes de empezar… ¿me das un poco de contexto?'),
  ).toBeVisible()

  await page.reload()
  await expect(
    page.getByRole('textbox', { name: 'Pégalo tal cual te llegó' }),
  ).toBeVisible()

  await expect(
    page.getByText('Espera, antes de empezar… ¿me das un poco de contexto?'),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Abrir expediente' }),
  ).toBeVisible()
})

// La invitación es lo primero que se ve y sus dos acciones no dependen del
// desplazamiento: ni en el teléfono más pequeño ni en un portátil bajo. Sofi se
// adapta al alto de la ventana con tamaños limpios del sprite de 384 px: entera
// con alto de sobra, 3/4 o la mitad cuando no cabe (1366×650 es el área útil de
// un portátil de 768 px con la barra del navegador).
for (const viewport of [
  { width: 320, height: 568, peek: 192 },
  { width: 375, height: 667, peek: 192 },
  { width: 1280, height: 720, peek: 288 },
  { width: 1366, height: 650, peek: 192 },
  { width: 1366, height: 768, peek: 288 },
  { width: 1920, height: 1080, peek: 384 },
]) {
  test(`la invitación deja a la vista sus acciones a ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await enter(page)

    for (const name of ['Responder preguntas', 'Ahora no']) {
      const box = await page.getByRole('button', { name }).boundingBox()
      expect(box, name).not.toBeNull()
      expect(box?.y).toBeGreaterThanOrEqual(0)
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
        viewport.height,
      )
    }
    // Una sola Sofi: la que se asoma sustituye al retrato.
    const sofi = page
      .getByRole('complementary', { name: 'Sofi te pide contexto' })
      .getByRole('img')
    await expect(sofi).toHaveCount(1)
    expect((await sofi.boundingBox())?.width).toBeCloseTo(viewport.peek, 0)
  })
}

test('«Ahora no» vuelve a la consulta de siempre y el acceso queda en el diálogo', async ({
  page,
}) => {
  await enter(page)

  await page.getByRole('button', { name: 'Ahora no' }).click()

  await expect(page.getByText(/A ver, cuéntamelo todo/)).toBeFocused()
  await expect(
    page
      .getByRole('complementary', { name: 'Sofi está escuchando' })
      .getByRole('button', {
        name: 'Abrir expediente',
      }),
  ).toBeVisible()
  await expect(page.getByText('Espera, antes de empezar')).toHaveCount(0)
})

test('responder no avanza y las áreas se contestan en cualquier orden', async ({
  page,
}) => {
  await enter(page)
  await openSheet(page)
  const question = page.locator('figure p:not([aria-hidden="true"])')
  const areas = page.getByRole('navigation', { name: 'Las seis áreas' })
  await expect(question).toHaveText(
    'Cuando algo le molesta, ¿cómo suele expresarlo?',
  )

  await page.getByText('Suele dar indirectas', { exact: true }).first().click()
  await expect(question).toHaveText(
    'Cuando algo le molesta, ¿cómo suele expresarlo?',
  )
  await expect(
    page.getByRole('radio', { name: 'Suele dar indirectas' }),
  ).toBeChecked()

  await areas
    .getByRole('button', { name: /Estilo habitual de mensajes/ })
    .click()
  await expect(question).toHaveText('¿Cómo suele escribirte normalmente?')
  await areas.getByRole('button', { name: /Comunicación directa/ }).click()
  await expect(
    page.getByRole('radio', { name: 'Suele dar indirectas' }),
  ).toBeChecked()
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`accesibilidad · tema ${colorScheme}`, () => {
    test.use({ colorScheme })

    for (const viewport of [
      { width: 375, height: 667 },
      { width: 1280, height: 800 },
    ]) {
      test(`consulta con invitación y ficha a ${viewport.width} px`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport)
        await enter(page)
        await expect(
          page.getByText(
            'Espera, antes de empezar… ¿me das un poco de contexto?',
          ),
        ).toBeVisible()
        await expectAccessible(page)

        await openSheet(page)
        await page.getByText('Depende', { exact: true }).first().click()
        await expectAccessible(page)
      })
    }
  })
}

// T028: todos los estados de la ficha, en los dos temas y en las pantallas que
// cambian la composición (mínima, tablet y horizontal).
for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`estados del expediente · tema ${colorScheme}`, () => {
    test.use({ colorScheme })

    test('vacío, guardado, confirmación y recuperación', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await enter(page)
      await openSheet(page)

      await page.getByRole('button', { name: 'Guardar expediente' }).click()
      await expect(
        page.getByText(
          'Responde al menos una pregunta o escribe una nota para guardar.',
        ),
      ).toBeVisible()
      await expectAccessible(page)

      await page.getByText('Depende', { exact: true }).first().click()
      await page.getByRole('button', { name: 'Guardar expediente' }).click()
      await expect(
        page.getByText('Expediente guardado en este dispositivo.'),
      ).toBeVisible()
      await expectAccessible(page)

      await page.getByRole('button', { name: 'Eliminar expediente' }).click()
      await expect(
        page.getByRole('heading', { name: '¿Eliminar el expediente?' }),
      ).toBeVisible()
      await expectAccessible(page)
    })

    test('guardado solo en memoria', async ({ page }) => {
      await page.addInitScript(() => {
        const original = Storage.prototype.setItem
        Storage.prototype.setItem = function (key: string, value: string) {
          if (this === window.localStorage)
            throw new DOMException('bloqueado', 'SecurityError')
          return original.call(this, key, value)
        }
      })
      await page.setViewportSize({ width: 375, height: 667 })
      await enter(page)
      await openSheet(page)
      await page.getByText('Depende', { exact: true }).first().click()

      await page.getByRole('button', { name: 'Guardar expediente' }).click()

      await expect(
        page.getByText(/No he podido guardarlo en este dispositivo/),
      ).toBeVisible()
      await expectAccessible(page)
    })

    test('sonido bloqueado por el navegador', async ({ page }) => {
      await page.addInitScript(() => {
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
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await page.getByText('Con sonido', { exact: true }).click()
      await page.getByRole('button', { name: /Empezar/ }).click()
      await openSheet(page)

      await expect(
        page.getByText('Tu navegador ha bloqueado el sonido.'),
      ).toBeVisible()
      await expectAccessible(page)
    })

    for (const viewport of [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
    ]) {
      test(`ficha a ${viewport.width}×${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await enter(page)
        await openSheet(page)
        await page.getByText('No lo sé', { exact: true }).first().click()

        await expectAccessible(page)
      })
    }
  })
}

// Revisión visual de 004: nada va fijo. Al cambiar de pregunta el foco no se
// pierde, y desde el índice pasa a las respuestas con la pregunta a la vista.
test('en móvil, «Siguiente pregunta» conserva el foco y lo deja a la vista', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await enter(page)
  await openSheet(page)
  const next = page.getByRole('button', { name: 'Siguiente pregunta' })
  await next.evaluate((element) => element.scrollIntoView({ block: 'end' }))

  await page.keyboard.press('Shift')
  await next.focus()
  await page.keyboard.press('Enter')

  await expect(page.locator('figure p:not([aria-hidden="true"])')).toHaveText(
    '¿Utiliza la ironía o el sarcasmo al escribir?',
  )
  // El bocadillo se rehace: el enlace es otro nodo y el foco sigue en él, sin
  // quedar fuera de la pantalla ni centrarse de un salto.
  const link = page.getByRole('button', { name: 'Siguiente pregunta' })
  await expect(link).toBeFocused()
  const box = await link.boundingBox()
  expect(box?.y).toBeGreaterThanOrEqual(0)
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(668) // medio píxel de redondeo del desplazamiento
})

for (const viewport of [
  { width: 375, height: 667 },
  { width: 320, height: 568 },
  { width: 1280, height: 800 },
]) {
  test(`desde el índice, el foco pasa a las respuestas y la pregunta se ve a ${viewport.width} px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await enter(page)
    await openSheet(page)
    const index = page
      .getByRole('navigation', { name: 'Las seis áreas' })
      .getByRole('button', { name: /Estilo habitual de mensajes/ })
    await index.scrollIntoViewIfNeeded()

    await page.keyboard.press('Shift')
    await index.focus()
    await page.keyboard.press('Enter')

    const group = page.getByRole('group', { name: /Pregunta 6 de 6/ })
    await expect(group.getByRole('radio').first()).toBeFocused()
    // El grupo dice la pregunta, y la región de anuncios no la repite.
    await expect(group).toHaveAccessibleName(
      /¿Cómo suele escribirte normalmente\?/,
    )
    await expect(page.locator('figure p[aria-live]')).toHaveCount(0)
    // La pregunta y el primer control quedan a la vista, sin nada encima.
    const geometry = await page.evaluate(() => {
      const radio = document.activeElement as HTMLElement
      const label = radio.closest('label') as HTMLElement
      const box = label.getBoundingClientRect()
      const text = document.querySelector('figure p[aria-hidden="true"]')
      const top = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      )
      return {
        controlTop: box.top,
        controlBottom: box.bottom,
        questionTop: text?.getBoundingClientRect().top ?? -1,
        viewport: window.innerHeight,
        covered: top !== null && !label.contains(top),
      }
    })
    expect(geometry.questionTop).toBeGreaterThanOrEqual(0)
    expect(geometry.controlTop).toBeGreaterThanOrEqual(0)
    expect(geometry.controlBottom).toBeLessThanOrEqual(geometry.viewport)
    expect(geometry.covered).toBe(false)
  })
}

// T020 y T022: la reacción es breve, se anuncia una vez y no toca la pregunta.
test('responder muestra una reacción anunciada en la región de estado, sin mover la ficha', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await enter(page)
  await openSheet(page)
  const question = page.locator('figure p:not([aria-hidden="true"])')
  const status = page.getByRole('status')
  // Lo que hay de la pregunta al formulario no se mueve (al final de la ficha
  // aparece «Descartar cambios», fuera del flujo de lo que se está leyendo).
  const positions = () =>
    page.evaluate(() =>
      ['fieldset', 'nav[aria-labelledby]', 'textarea'].map((selector) =>
        Math.round(
          (document.querySelector(selector)?.getBoundingClientRect().top ?? 0) +
            window.scrollY,
        ),
      ),
    )
  const before = await positions()
  await expect(status).toBeEmpty()

  await page.getByText('Depende', { exact: true }).first().click()

  await expect(status).toHaveText('Sin certezas. Me gusta tu prudencia.')
  await expect(question).toHaveText(
    'Cuando algo le molesta, ¿cómo suele expresarlo?',
  )
  expect(await positions()).toEqual(before)
  await expect(
    page.getByRole('img', { name: 'Sofi se lo piensa' }),
  ).toBeVisible()
  // La reacción termina sola y Sofi vuelve a esperar.
  await expect(status).toBeEmpty({ timeout: 4000 })
  await expect(
    page.getByRole('img', { name: 'Sofi espera tu respuesta' }),
  ).toBeVisible()
  expect(await positions()).toEqual(before)
})

test('con movimiento normal la pregunta se escribe y se puede omitir', async ({
  browser,
}) => {
  const context = await browser.newContext({
    reducedMotion: 'no-preference',
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()
  await enter(page)
  await openSheet(page)
  const question = page.locator('figure p:not([aria-hidden="true"])')
  await expect(question).toHaveText(
    'Cuando algo le molesta, ¿cómo suele expresarlo?',
  )

  await page.getByRole('button', { name: 'Ver todo' }).click()

  await expect(page.getByRole('button', { name: 'Ver todo' })).toHaveCount(0)
  await context.close()
})

// La indicación «Ir a guardar» y el salto de «Guardar» al completar son
// accesibles en claro y oscuro, con «Guardar» fuera de la pantalla y ya a la vista.
for (const scheme of ['light', 'dark'] as const) {
  test(`axe: indicación «Ir a guardar» y salto de «Guardar» (${scheme})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 650 },
      colorScheme: scheme,
      reducedMotion: 'no-preference',
    })
    const page = await context.newPage()
    await enter(page)
    await openSheet(page)
    for (const label of [
      'Comunicación directa',
      'Sarcasmo',
      'Conflictos',
      'Espacio personal',
      'Iniciativa',
      'Estilo habitual',
    ]) {
      await page
        .getByRole('navigation', { name: 'Las seis áreas' })
        .getByRole('button', { name: new RegExp(label) })
        .click()
      await page
        .getByRole('group', { name: /Pregunta \d de 6/ })
        .getByRole('radio')
        .first()
        .check({ force: true })
    }
    const goSave = page.getByRole('button', { name: 'Ir a guardar' })
    await expect(goSave).toBeVisible({ timeout: 4000 })
    await expectAccessible(page)

    await goSave.click()
    await expect(page.locator('[data-celebrating]')).toHaveCount(1)
    await expectAccessible(page)
    await context.close()
  })
}
