import { expect, test } from '@playwright/test'

// El diálogo de la portada se ajusta a su texto: antes se estiraba con la altura
// de la columna de texto y, a ciertos anchos, tapaba el pie de la foto.
for (const width of [1100, 1280, 1440, 1920]) {
  test(`the landing quote hugs its text at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')

    const quote = page.getByRole('figure').filter({ hasText: 'Con un «vale»' })
    const height = (await quote.boundingBox())?.height ?? 0
    const text = await quote.locator('blockquote').boundingBox()

    // Solo el relleno del diálogo y la etiqueta «Sofi»: nunca un hueco vacío debajo.
    expect(height).toBeLessThan((text?.height ?? 0) + 90)
  })
}
