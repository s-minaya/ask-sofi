import type { Page } from '@playwright/test'

// Los seis modos de movimiento de plan 008 §4.1: el sistema (normal o reducido) por el
// atributo de <html> (sin atributo, `reduce` o `full`). `animated` es el estado efectivo.
export const MODES = [
  { system: 'no-preference', attribute: undefined, animated: true },
  { system: 'reduce', attribute: undefined, animated: false },
  { system: 'no-preference', attribute: 'reduce', animated: false },
  { system: 'reduce', attribute: 'reduce', animated: false },
  { system: 'no-preference', attribute: 'full', animated: true },
  { system: 'reduce', attribute: 'full', animated: true },
] as const

export type Mode = (typeof MODES)[number]

export const modeName = ({ system, attribute }: Mode) =>
  `sistema ${system} · data-motion ${attribute ?? 'sin atributo'}`

// El mismo mecanismo que `main.tsx`: un único `data-motion` en <html>.
export async function setMotionAttribute(
  page: Page,
  attribute: string | undefined,
) {
  await page.evaluate((value) => {
    if (value) document.documentElement.dataset.motion = value
    else delete document.documentElement.dataset.motion
  }, attribute)
}

// Cambia de modo en vivo, como lo haría el usuario o el sistema operativo.
export async function applyMode(page: Page, mode: Mode) {
  await page.emulateMedia({ reducedMotion: mode.system })
  await setMotionAttribute(page, mode.attribute)
}
