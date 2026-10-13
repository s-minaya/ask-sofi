import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// El objetivo de tech-stack.md: WCAG 2.2 AA.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    // Contraejemplos de contraste de Foundations («No apto para texto»): muestras
    // decorativas, sin texto que leer (excepción de texto incidental de WCAG 1.4.3).
    .exclude('[data-contrast="insuficiente"]')
    .analyze()
  const summary = violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes
        .slice(0, 5)
        .map((node) => node.target.join(' '))
        .join(' | ')}`,
  )
  expect(summary).toEqual([])
}

type PreviewStep = 'landing' | 'consultation' | 'processing' | 'result'

// La app simulada de la Experience Preview, llevada a un paso concreto como lo hace la mesa de control.
async function openPreview(page: Page, scenario: string, step: PreviewStep) {
  await page.goto(`/design-lab?frame=preview&scenario=${scenario}`)
  await expect(page.getByText('Demo · datos simulados')).toBeVisible()
  if (step === 'landing') return
  await page.evaluate(
    (target) =>
      window.postMessage(
        {
          type: 'ask-sofi:preview-command',
          command: { kind: 'step', step: target },
        },
        window.location.origin,
      ),
    step,
  )
}

const PREVIEW_SCREENS = [
  { name: 'portada', scenario: 'success', step: 'landing', ready: /Empezar/ },
  {
    name: 'consulta',
    scenario: 'success',
    step: 'consultation',
    ready: /Leer entre líneas/,
  },
  {
    name: 'procesando',
    scenario: 'loading',
    step: 'processing',
    ready: /Cancelar/,
  },
  {
    name: 'lectura',
    scenario: 'success',
    step: 'result',
    ready: /Nueva consulta/,
  },
  {
    name: 'falta contexto',
    scenario: 'needs',
    step: 'result',
    ready: /Volver a leer/,
  },
  { name: 'error', scenario: 'error', step: 'result', ready: /Reintentar/ },
] as const

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`tema ${colorScheme === 'light' ? 'claro' : 'oscuro'}`, () => {
    test.use({ colorScheme, reducedMotion: 'reduce' })

    test('portada', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('button', { name: /Empezar/ })).toBeVisible()
      await expectAccessible(page)
    })

    test('consulta: vacía, con error y con el aviso provisional', async ({
      page,
    }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /Empezar/ }).click()
      await expect(
        page.getByRole('heading', { name: 'Pégalo tal cual te llegó' }),
      ).toBeFocused()
      await expectAccessible(page)

      await page.getByRole('button', { name: /Leer entre líneas/ }).click()
      await expect(page.getByRole('alert')).toContainText('Pega el mensaje')
      await expectAccessible(page)

      await page
        .getByRole('textbox', { name: 'Pégalo tal cual te llegó' })
        .fill('Vale.')
      await page.getByRole('button', { name: /Leer entre líneas/ }).click()
      await expect(page.getByRole('status')).toContainText(
        'Sofi todavía está calentando motores',
      )
      await expectAccessible(page)
    })

    for (const section of [
      'foundations',
      'ui',
      'sofi',
      'motion',
      'preview',
      'profile',
    ]) {
      test(`Design Lab · ${section}`, async ({ page }) => {
        await page.goto(`/design-lab?s=${section}`)
        await expect(
          page.getByRole('navigation', { name: 'Secciones del Design Lab' }),
        ).toBeVisible()
        await expectAccessible(page)
      })
    }

    for (const screen of PREVIEW_SCREENS) {
      for (const viewport of VIEWPORTS) {
        test(`Experience Preview · ${screen.name} · ${viewport.width} px`, async ({
          page,
        }) => {
          await page.setViewportSize(viewport)
          await openPreview(page, screen.scenario, screen.step)
          await expect(
            page.getByRole('button', { name: screen.ready }).first(),
          ).toBeVisible()
          await expectAccessible(page)
        })
      }
    }

    test('Experience Preview · espera larga', async ({ page }) => {
      await openPreview(page, 'loading', 'processing')
      await expect(
        page.getByText(
          'Está tardando más de lo normal. Tu mensaje no se pierde.',
        ),
      ).toBeVisible({
        timeout: 10_000,
      })
      await expectAccessible(page)
    })
  })
}
