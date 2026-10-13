import { expect, test, type Page } from '@playwright/test'

// Crear, editar, descartar, recargar y eliminar el expediente en un navegador
// real, y qué pasa con el almacenamiento o el audio bloqueados (004, T025).
// El borrado global no tiene interfaz: lo cubren los tests de T007–T008.
test.use({ reducedMotion: 'reduce' })

const FIRST_QUESTION = 'Cuando algo le molesta, ¿cómo suele expresarlo?'

async function enter(page: Page, { sound = false } = {}) {
  await page.goto('/')
  if (sound) await page.getByText('Con sonido', { exact: true }).click()
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

const option = (page: Page, name: string) =>
  page
    .getByRole('group', { name: /Pregunta \d de 6/ })
    .getByText(name, { exact: true })
const area = (page: Page, name: RegExp) =>
  page
    .getByRole('navigation', { name: 'Las seis áreas' })
    .getByRole('button', { name })
const notes = (page: Page) =>
  page.getByRole('textbox', { name: /Notas adicionales/ })
const save = (page: Page) =>
  page.getByRole('button', { name: 'Guardar expediente' })

// Recargar vuelve a la consulta (el borrador del expediente vive en memoria).
async function reloadAndOpen(page: Page) {
  await page.reload()
  await expect(
    page.getByRole('textbox', { name: 'Pégalo tal cual te llegó' }),
  ).toBeVisible()
  await openSheet(page)
}

test('crear, recargar y recuperar el expediente', async ({ page }) => {
  await enter(page)
  await openSheet(page)
  await option(page, 'Suele dar indirectas').click()
  await area(page, /Sarcasmo/).click()
  await option(page, 'A veces').click()
  await notes(page).fill('Contesta tarde y con monosílabos.')

  await save(page).click()
  await expect(
    page.getByText('Expediente guardado en este dispositivo.'),
  ).toBeVisible()

  await reloadAndOpen(page)
  await expect(
    page.getByRole('radio', { name: 'Suele dar indirectas' }),
  ).toBeChecked()
  await expect(area(page, /Sarcasmo/)).toContainText('A veces')
  await expect(area(page, /Conflictos/)).toContainText('Sin responder')
  await expect(notes(page)).toHaveValue('Contesta tarde y con monosílabos.')
})

test('el acceso de la consulta refleja que hay un expediente guardado', async ({
  page,
}) => {
  await enter(page)
  await page.getByRole('button', { name: 'Ahora no' }).click()
  await expect(
    page.getByRole('button', { name: 'Abrir expediente' }),
  ).toBeVisible()
  await openSheet(page)
  await option(page, 'Depende').click()
  await save(page).click()

  // Tras guardar hay dos: el de la cabecera y el del pie, junto a «Guardar».
  await page
    .getByRole('button', { name: /Volver a la consulta/ })
    .last()
    .click()

  await expect(
    page.getByRole('button', { name: 'Editar expediente' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Abrir expediente' }),
  ).toHaveCount(0)
})

test('editar, descartar y guardar de nuevo', async ({ page }) => {
  await enter(page)
  await openSheet(page)
  await option(page, 'Suele dar indirectas').click()
  await save(page).click()
  await reloadAndOpen(page)

  await option(page, 'Lo dice claramente').click()
  await page.getByRole('button', { name: 'Descartar cambios' }).click()
  await expect(
    page.getByRole('radio', { name: 'Suele dar indirectas' }),
  ).toBeChecked()

  await option(page, 'Depende').click()
  await save(page).click()
  await reloadAndOpen(page)
  await expect(page.getByRole('radio', { name: 'Depende' })).toBeChecked()
})

test('un expediente vacío no se guarda', async ({ page }) => {
  await enter(page)
  await openSheet(page)

  await save(page).click()

  await expect(
    page.getByText(
      'Responde al menos una pregunta o escribe una nota para guardar.',
    ),
  ).toBeVisible()
  await reloadAndOpen(page)
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)
})

test('eliminar pide confirmación, afecta solo al expediente y no devuelve la invitación', async ({
  page,
}) => {
  await enter(page)
  await page
    .getByRole('textbox', { name: 'Pégalo tal cual te llegó' })
    .fill('Vale.')
  await openSheet(page)
  await option(page, 'Depende').click()
  await save(page).click()
  await reloadAndOpen(page)

  await page.getByRole('button', { name: 'Eliminar expediente' }).click()
  await expect(
    page.getByRole('heading', { name: '¿Eliminar el expediente?' }),
  ).toBeFocused()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('radio', { name: 'Depende' })).toBeChecked()

  await page.getByRole('button', { name: 'Eliminar expediente' }).click()
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Expediente de tu pareja' }),
  ).toBeFocused()
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)

  await reloadAndOpen(page)
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)
  // Tras guardar hay dos: el de la cabecera y el del pie, junto a «Guardar».
  await page
    .getByRole('button', { name: /Volver a la consulta/ })
    .last()
    .click()
  // El borrador de la consulta y el estado de la invitación siguen como estaban.
  await expect(
    page.getByRole('textbox', { name: 'Pégalo tal cual te llegó' }),
  ).toHaveValue('Vale.')
  await expect(
    page.getByText('Espera, antes de empezar… ¿me das un poco de contexto?'),
  ).toHaveCount(0)
})

test.describe('almacenamiento bloqueado', () => {
  test.beforeEach(async ({ page }) => {
    // Escribir en localStorage falla, como con el almacenamiento desactivado.
    await page.addInitScript(() => {
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = function (key: string, value: string) {
        if (this === window.localStorage)
          throw new DOMException('bloqueado', 'SecurityError')
        return original.call(this, key, value)
      }
    })
  })

  test('no se presenta como guardado y se pierde al recargar', async ({
    page,
  }) => {
    await enter(page)
    await openSheet(page)
    await option(page, 'Suele dar indirectas').click()

    await save(page).click()

    await expect(
      page.getByText(/No he podido guardarlo en este dispositivo/),
    ).toBeVisible()
    await expect(
      page.getByText('Expediente guardado en este dispositivo.'),
    ).toHaveCount(0)
    // Sigue en pantalla mientras no se recargue.
    await expect(
      page.getByRole('radio', { name: 'Suele dar indirectas' }),
    ).toBeChecked()

    await reloadAndOpen(page)
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)
  })

  test('la consulta sigue siendo utilizable', async ({ page }) => {
    await enter(page)
    await page
      .getByRole('textbox', { name: 'Pégalo tal cual te llegó' })
      .fill('Vale.')

    await page.getByRole('button', { name: 'Leer entre líneas' }).click()

    await expect(
      page.getByText('Sofi todavía está calentando motores'),
    ).toBeVisible()
  })
})

// El aviso va en el flujo, bajo el bocadillo de Sofi, y en ningún ancho tapa un
// control. A dos columnas está en la columna de Sofi: el índice y las notas, a la
// derecha, no se mueven. En una columna lo que se lee y se pulsa no se mueve y solo
// baja el índice, que va debajo.
for (const viewport of [
  { width: 375, height: 667, columns: false },
  { width: 1280, height: 800, columns: true },
]) {
  test(`el aviso de sonido bloqueado no mueve ni tapa la ficha a ${viewport.width} px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'no-preference',
    })
    await context.addInitScript(() => {
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
    const page = await context.newPage()
    await enter(page, { sound: true })

    await page.getByRole('button', { name: 'Responder preguntas' }).click()
    await expect(page.locator('figure p:not([aria-hidden="true"])')).toHaveText(
      FIRST_QUESTION,
    )

    const layout = () =>
      page.evaluate(() => {
        const top = (selector: string) => {
          const element = document.querySelector(selector)
          return element
            ? Math.round(element.getBoundingClientRect().top + window.scrollY)
            : -1
        }
        return {
          height: document.documentElement.scrollHeight,
          options: top('fieldset'),
          index: top('nav[aria-labelledby]'),
          notes: top('textarea'),
        }
      })
    const samples = [await layout()]
    // El resultado llega unos 300 ms después del gesto: se muestrea todo el intervalo.
    for (let step = 0; step < 14; step++) {
      await page.waitForTimeout(100)
      samples.push(await layout())
    }

    await expect(
      page.getByText('Tu navegador ha bloqueado el sonido.'),
    ).toBeVisible()
    samples.push(await layout())
    // No tapa ningún control.
    const covered = await page.evaluate(() => {
      const notice = [...document.querySelectorAll('div')].find(
        (element) =>
          element.textContent?.startsWith('Tu navegador ha bloqueado') &&
          getComputedStyle(element).display === 'flex',
      )
      if (!notice) return ['sin aviso']
      const box = notice.getBoundingClientRect()
      return [...document.querySelectorAll('button, a, input, textarea')]
        .filter((control) => !notice.contains(control))
        .filter((control) => {
          const rect = control.getBoundingClientRect()
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.top < box.bottom - 1 &&
            rect.bottom > box.top + 1 &&
            rect.left < box.right - 1 &&
            rect.right > box.left + 1
          )
        })
        .map((control) => control.textContent?.trim() || control.tagName)
    })
    expect(covered).toEqual([])
    if (viewport.columns) {
      // Nada de lo que se ve se mueve (solo crece el final de la página).
      expect(
        new Set(
          samples.map((sample) =>
            JSON.stringify([sample.options, sample.index, sample.notes]),
          ),
        ).size,
      ).toBe(1)
    } else {
      // Lo que se lee y se pulsa, quieto; el índice solo baja bajo el aviso.
      expect(new Set(samples.map((sample) => sample.options)).size).toBe(1)
      const noticeBottom = await page.evaluate(() => {
        const notice = [...document.querySelectorAll('div')].find(
          (element) =>
            element.textContent?.startsWith('Tu navegador ha bloqueado') &&
            getComputedStyle(element).display === 'flex',
        )
        return notice
          ? Math.round(notice.getBoundingClientRect().bottom + window.scrollY)
          : Infinity
      })
      const settled = samples[samples.length - 1]
      expect(settled.index).toBeGreaterThanOrEqual(noticeBottom)
      expect(settled.index).toBeGreaterThan(samples[0].index)
    }
    await context.close()
  })
}

// Completar las seis áreas guía a «Guardar»; guardar deja «Volver a la consulta»
// como siguiente paso, y nada se fuerza.
const AREAS = [
  'Comunicación directa',
  'Sarcasmo',
  'Conflictos',
  'Espacio personal',
  'Iniciativa',
  'Estilo habitual',
]
async function answerAreas(page: Page, count: number) {
  for (const label of AREAS.slice(0, count)) {
    await area(page, new RegExp(label)).click()
    await page
      .getByRole('group', { name: /Pregunta \d de 6/ })
      .getByRole('radio')
      .first()
      .check({ force: true })
  }
}
const back = (page: Page) =>
  page.getByRole('button', { name: /Volver a la consulta/ })

test('«Volver a la consulta» tiene presencia de botón en la cabecera', async ({
  page,
}) => {
  await enter(page)
  await openSheet(page)

  const box = await back(page).first().boundingBox()

  expect(box?.height).toBeGreaterThanOrEqual(44)
  expect(box?.width).toBeGreaterThan(160)
})

test('completar las seis áreas guía a «Guardar» y, ya guardado, a «Volver»', async ({
  page,
}) => {
  await enter(page)
  await openSheet(page)
  await answerAreas(page, 6)

  // Se dice con palabras y no guarda nada ni cambia de pantalla.
  await expect(
    page.getByText('Seis de seis. Solo falta guardarlo.'),
  ).toHaveCount(2)
  await expect(back(page)).toHaveCount(1)

  await save(page).click()
  await expect(
    page.getByText('Expediente guardado en este dispositivo.'),
  ).toBeVisible()
  await expect(back(page)).toHaveCount(2)
  // Guardar conserva el foco: nadie salta de pantalla con una segunda pulsación.
  await expect(save(page)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(back(page).last()).toBeFocused()
})

test('un expediente parcial guardado también ofrece volver', async ({
  page,
}) => {
  await enter(page)
  await openSheet(page)
  await answerAreas(page, 2)

  await save(page).click()

  await expect(back(page)).toHaveCount(2)
})

// «Guardar» queda fuera de la pantalla en portátiles bajos, tablets y móviles (la
// barra fija solo se fija al llegar a las notas). Completar las seis áreas no
// desplaza la página: el diálogo ofrece «Ir a guardar», y «Guardar» da su salto
// cuando está en pantalla, una sola vez.
const goSave = (page: Page) =>
  page.getByRole('button', { name: 'Ir a guardar' })

const celebrating = (page: Page) => page.locator('[data-celebrating]')

// El salto es breve (0,6 s): se espera a verlo con sondeos cortos.
const hopStarted = (page: Page) =>
  expect
    .poll(() => celebrating(page).count(), { intervals: [20], timeout: 5000 })
    .toBe(1)

const hopAnimation = (page: Page) =>
  save(page).evaluate((element) => getComputedStyle(element).animationName)

const SCREENS = [
  { name: 'portátil bajo', width: 1366, height: 650 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'móvil', width: 390, height: 844 },
] as const

for (const screen of SCREENS)
  for (const scheme of ['light', 'dark'] as const)
    for (const motion of ['no-preference', 'reduce'] as const) {
      test(`${screen.name} (${scheme}, movimiento ${motion}): guía a «Guardar» y este da su salto al llegar`, async ({
        browser,
      }) => {
        const context = await browser.newContext({
          viewport: { width: screen.width, height: screen.height },
          colorScheme: scheme,
          reducedMotion: motion,
        })
        const page = await context.newPage()
        await enter(page)
        await openSheet(page)
        await answerAreas(page, 5)
        await page.waitForTimeout(2000)

        // La sexta respuesta no mueve la página (la opción ya está a la vista:
        // Playwright no tiene que desplazarla para pulsarla).
        await area(page, /Estilo habitual/).click()
        const sixth = option(
          page,
          'Mensajes cortos y directos, incluso cuando todo va bien',
        )
        await sixth.scrollIntoViewIfNeeded()
        const before = await page.evaluate(() => scrollY)
        await sixth.click()
        expect(await page.evaluate(() => scrollY)).toBe(before)

        // «Guardar» está fuera de la pantalla y el salto espera: no se da.
        const saveBox = await save(page).boundingBox()
        expect(
          (saveBox?.y ?? 0) + (saveBox?.height ?? 0) > screen.height ||
            (saveBox?.y ?? 0) < 0,
        ).toBe(true)
        await expect(celebrating(page)).toHaveCount(0)

        // Tras el comentario de Sofi, la indicación ocupa su sitio, junto al diálogo.
        await expect(goSave(page)).toBeVisible({ timeout: 4000 })
        await expect(
          goSave(page).locator('xpath=ancestor::figure'),
        ).toHaveCount(1)
        expect(await page.evaluate(() => scrollY)).toBe(before)
        await expect(save(page)).not.toBeFocused()

        // Acción explícita: lleva «Guardar» a la vista y le da el foco; no guarda.
        await goSave(page).click()
        await expect(save(page)).toBeFocused()
        await hopStarted(page)
        const animation = await hopAnimation(page)
        if (motion === 'reduce') expect(animation).toBe('none')
        else expect(animation).toContain('cta-hop')
        await expect(
          page.getByText('Expediente guardado en este dispositivo.'),
        ).toHaveCount(0)

        // Breve y sin repetirse: termina solo y no vuelve al salir y regresar.
        await expect(celebrating(page)).toHaveCount(0, { timeout: 4000 })
        await page.evaluate(() => scrollTo(0, 0))
        await expect(goSave(page)).toBeVisible()
        await goSave(page).click()
        await expect(save(page)).toBeFocused()
        await page.waitForTimeout(1000)
        await expect(celebrating(page)).toHaveCount(0)
        await expect(goSave(page)).toBeHidden()
        await context.close()
      })
    }

test('con «Guardar» ya en pantalla, da su salto al completar y no hay indicación', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  await enter(page)
  await openSheet(page)
  await answerAreas(page, 6)

  await hopStarted(page)
  expect(await hopAnimation(page)).toContain('cta-hop')
  await expect(celebrating(page)).toHaveCount(0, { timeout: 4000 })
  await expect(goSave(page)).toBeHidden()
  await context.close()
})

test('«Guardar» sigue guardando una sola vez: la indicación no lo duplica ni lo activa', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 650 })
  await enter(page)
  await openSheet(page)
  await answerAreas(page, 6)
  await expect(goSave(page)).toBeVisible({ timeout: 4000 })

  await goSave(page).click()

  await expect(save(page)).toHaveCount(1)
  await expect(
    page.getByText('Expediente guardado en este dispositivo.'),
  ).toHaveCount(0)
  await save(page).click()
  await expect(
    page.getByText('Expediente guardado en este dispositivo.'),
  ).toBeVisible()
  await expect(goSave(page)).toBeHidden()
})
