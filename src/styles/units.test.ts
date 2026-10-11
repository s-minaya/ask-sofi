import { describe, expect, it } from 'vitest'

// Convenciones de unidades de tech-stack.md: tipografía, espaciado y dimensiones
// en rem para que crezcan con el texto del usuario; px solo para bordes, detalles
// gráficos y lo medido sobre el spritesheet. Esta prueba impide reintroducir px
// en lo primero y obliga a justificar cada excepción.
const sources = import.meta.glob<string>('/src/**/*.scss', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const SIZED_PROPERTY =
  /^(gap|row-gap|column-gap|margin(-\w+)*|padding(-\w+)*|font-size|font|line-height|width|height|min-width|min-height|max-width|max-height|top|right|bottom|left|inset|flex|scroll-margin(-\w+)*|grid-template-columns|grid-template-rows|vertical-align|text-underline-offset)$/

// Medidas que viven en px por estar acopladas al spritesheet o ser un detalle gráfico.
const EXCEPTIONS: Record<string, { reason: string; declarations: string[] }> = {
  '/src/styles/utilities/_a11y.scss': {
    reason: 'Ocultación visual: 1 px es precisión, no una medida de diseño',
    declarations: ['width: 1px', 'height: 1px', 'margin: -1px'],
  },
  '/src/components/ui/OptionGroup/OptionGroup.module.scss': {
    reason: 'Control nativo oculto: 1 px es precisión',
    declarations: ['width: 1px', 'height: 1px'],
  },
  '/src/components/ui/Loader/Loader.module.scss': {
    reason: 'Barra de celdas: la altura es la de la celda de px',
    declarations: ['height: 14px'],
  },
  '/src/components/sofi/ConfidenceMeter/ConfidenceMeter.module.scss': {
    reason: 'Barra de celdas: la altura es la de la celda de px',
    declarations: ['height: 14px'],
  },
  '/src/components/ui/Spinner/Spinner.module.scss': {
    reason: 'Cuadrados pixel del indicador de carga',
    declarations: ['width: 6px', 'height: 6px'],
  },
  '/src/components/ui/Indicators/Indicators.module.scss': {
    reason: 'Punto pixel del indicador «en directo»',
    declarations: ['width: 8px', 'height: 8px'],
  },
  '/src/components/ui/Ticker/Ticker.module.scss': {
    reason: 'Icono pixel de chispa, dibujado sobre una rejilla de 8',
    declarations: ['width: 12px', 'height: 12px'],
  },
  '/src/components/ui/TextLink/TextLink.module.scss': {
    reason: 'Icono pixel de flecha, dibujado sobre una rejilla de 10 × 6',
    declarations: ['width: 14px', 'height: 9px'],
  },
  '/src/components/sofi/SofiDialog/SofiDialog.module.scss': {
    reason: 'Icono pixel de flecha, dibujado sobre una rejilla de 10 × 6',
    declarations: ['width: 14px', 'height: 9px'],
  },
  '/src/components/sofi/SofiSpeech/SofiSpeech.module.scss': {
    reason: 'Cursor de escritura: barra pixel',
    declarations: ['width: 10px'],
  },
  '/src/components/sofi/MessageBubble/MessageBubble.module.scss': {
    reason: 'Geometría de la cola de la burbuja, un recorte gráfico',
    declarations: [
      'left: var(--tail-left, 26px)',
      'width: var(--tail-width, 30px)',
      'height: var(--tail-height, 25px)',
      '--tail-left: 20px',
      '--tail-width: 24px',
      '--tail-height: 20px',
      '--tail-left: 14px',
      '--tail-width: 20px',
      '--tail-height: 17px',
    ],
  },
  '/src/components/sofi/PhotoBooth/PhotoBooth.module.scss': {
    reason:
      'Marco de la tira y recortes del spritesheet: se miden en px entre sí',
    declarations: [
      'gap: 10px',
      'padding: 10px',
      'gap: 7px',
      'padding: 7px',
      'width: 78px !important',
      'height: 78px !important',
      'width: 156px !important',
      'height: 156px !important',
      'margin: -34px 0 0 -39px !important',
    ],
  },
  '/src/components/sofi/SofiStage/SofiStage.module.scss': {
    reason:
      'El retrato (384 px) y su recorte son del spritesheet; el solape va con ellos',
    declarations: [
      'grid-template-columns: 384px minmax(0, 1fr)',
      'height: 236px',
      'margin-top: 4px',
      'margin: -30px 0 0',
    ],
  },
  '/src/features/consultation/screens/ConsultationScreen.module.scss': {
    reason: 'Alturas y solapes medidos contra el retrato de 384 px',
    declarations: [
      'min-height: 600px',
      'inset: 20px 6% 120px 0',
      'margin-top: -96px',
    ],
  },
  '/src/design-lab/sections/UiSection.module.scss': {
    reason:
      'Ancho de dispositivo emulado: la pantalla más pequeña que se soporta',
    declarations: ['min-width: 320px'],
  },
  '/src/features/landing/Landing.module.scss': {
    reason:
      'Solape sobre la tira del fotomatón, cuyos recortes son del spritesheet',
    declarations: ['margin: -150px 0 0'],
  },
}

type Violation = { file: string; declaration: string }

// Objetivos táctiles: el mínimo de 44 CSS px no escala con el texto (tech-stack.md,
// «CSS units»); el alto real lo fija el contenido. Se admiten mínimos de 44 a 64 px.
function isTouchTargetMinimum(property: string, value: string): boolean {
  const isMinimum =
    property === 'min-height' ||
    property === 'min-width' ||
    property === '--option-height'
  if (!isMinimum) return false
  // También vale el valor por defecto de una variable: var(--option-height, 48px).
  const match = /^(?:var\(--[\w-]+,\s*)?(\d+)px\)?$/.exec(value)
  return match !== null && Number(match[1]) >= 44 && Number(match[1]) <= 64
}

function violations(): Violation[] {
  const found: Violation[] = []
  for (const [file, source] of Object.entries(sources)) {
    const text = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    const pattern =
      /(?:^|[;{}\s])(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]*?\d(?:\.\d+)?px[^;{}]*?)(?=;|\s*})/g
    for (const match of text.matchAll(pattern)) {
      const [, property, value] = match
      const sized = property.startsWith('--')
        ? !/^--(stroke|sticker|sofi-outline)/.test(property)
        : SIZED_PROPERTY.test(property)
      if (!sized) continue
      const normalized = value.replace(/\s+/g, ' ').trim()
      if (isTouchTargetMinimum(property, normalized)) continue
      found.push({ file, declaration: `${property}: ${normalized}` })
    }
  }
  return found
}

describe('CSS units', () => {
  it('keeps typography, spacing and dimensions out of px', () => {
    const unexpected = violations().filter(
      ({ file, declaration }) =>
        !EXCEPTIONS[file]?.declarations.includes(declaration),
    )
    expect(unexpected).toEqual([])
  })

  it('does not keep exceptions that no longer apply', () => {
    const present = violations()
    const stale = Object.entries(EXCEPTIONS).flatMap(
      ([file, { declarations }]) =>
        declarations
          .filter(
            (declaration) =>
              !present.some(
                (item) =>
                  item.file === file && item.declaration === declaration,
              ),
          )
          .map((declaration) => `${file} · ${declaration}`),
    )
    expect(stale).toEqual([])
  })
})
