import { render } from '@testing-library/react'
import postcss, { type AtRule, type Declaration, type Rule } from 'postcss'
import * as sass from 'sass'
import { describe, expect, it } from 'vitest'
import { ConsultationScreen } from '../features/consultation/screens/ConsultationScreen'
import {
  PRODUCTION_OVERLAP,
  WIDE_EDGE_PERCENT,
  WIDE_OVERLAP,
  WIDE_SPRITE,
} from './gagWide'

// T066, consulta a dos columnas: los gags van sobre el retrato grande que ya existe, y el Lab
// repite la columna «Sofi escucha» porque producción no la exporta y no se toca. Esta prueba la
// compara con la pantalla real (el CSS compilado de `ConsultationScreen` desde 1080 px y su
// DOM), así que si alguien cambia esa columna, el prototipo deja de ser fiel y salta aquí. La
// única diferencia es la que propone el Lab (revisión del 2026-11-11): el diálogo no se solapa con
// el retrato.

const compile = (file: string) =>
  postcss.parse(sass.compile(file, { loadPaths: ['src/styles'] }).css)

// Las declaraciones de la regla con ese selector. `wide`: solo las de dentro del @media de dos
// columnas (`bp-from(u.$bp-columns)`, 1080 px = 67,5 em); si no, las de fuera de cualquier @media.
function declarations(
  root: postcss.Root,
  selector: string,
  where: 'wide' | 'base',
): Map<string, string> {
  const found = new Map<string, string>()
  root.walkRules((rule: Rule) => {
    if (!rule.selectors.includes(selector)) return
    const parent = rule.parent as postcss.Container
    const inMedia = parent.type === 'atrule'
    if (where === 'wide') {
      const params = inMedia ? (parent as AtRule).params : ''
      if (!params.includes('min-width: 67.5em')) return
    } else if (inMedia) return
    rule.walkDecls((decl: Declaration) => {
      found.set(decl.prop, decl.value)
    })
  })
  return found
}

const production = compile(
  'src/features/consultation/screens/ConsultationScreen.module.scss',
)
const lab = compile('src/design-lab/sections/GagsWideSpec.module.scss')

// Cada regla del Lab con la de producción de la que es copia, y las propiedades que se copian.
const COPIES: ReadonlyArray<{
  lab: string
  production: string
  props: readonly string[]
}> = [
  {
    lab: '.listen',
    production: '.listen',
    props: ['position', 'min-height'],
  },
  {
    lab: '.dots',
    production: '.listenDots',
    props: ['position', 'inset'],
  },
  {
    lab: '.tag',
    production: '.listenTag',
    props: ['position', 'display'],
  },
  {
    lab: '.dialog',
    production: '.listenDialog',
    props: [
      '--dialog-padding',
      '--dialog-name-top',
      '--dialog-name-left',
      '--dialog-name-padding',
      '--dialog-name-size',
      '--dialog-text-size',
      '--dialog-text-leading',
    ],
  },
]

describe('la columna «Sofi escucha» del prototipo es la de la consulta a dos columnas', () => {
  for (const copy of COPIES) {
    it(`${copy.lab} repite ${copy.production} desde 1080 px`, () => {
      const real = declarations(production, copy.production, 'wide')
      const mine = declarations(lab, copy.lab, 'base')
      for (const prop of copy.props) {
        expect(
          real.get(prop),
          `producción: ${copy.production} ${prop}`,
        ).toBeDefined()
        expect(mine.get(prop), `Lab: ${copy.lab} ${prop}`).toBe(real.get(prop))
      }
    })
  }

  it('el retrato grande centrado con su margen superior es el del anfitrión', () => {
    const real = declarations(production, '.listenBig', 'wide')
    const mine = declarations(lab, '.host', 'base')
    expect(mine.get('margin')).toBe(real.get('margin'))
    expect(mine.get('display')).toBe(real.get('display'))
    expect(mine.get('position')).toBe(real.get('position'))
  })

  it('en la pantalla real el diálogo sube sobre el retrato lo que dice PRODUCTION_OVERLAP', () => {
    const real = declarations(production, '.listenDialog', 'wide')
    expect(real.get('margin-top')).toBe(`-${PRODUCTION_OVERLAP}px`)
  })

  it('composición aprobada (decisión 11): el diálogo no se solapa con el retrato, que se ve entero', () => {
    expect(WIDE_OVERLAP).toBe(0)
    expect(declarations(lab, '.dialog', 'base').get('margin-top')).toBe('0')
  })

  it('poking se esconde tras el borde superior del diálogo: el borde está a (384 − solape) / 384', () => {
    // Sin solape, el diálogo empieza en el pie del retrato; `--poking-edge` mide desde arriba, en %
    // de la pieza (`_poking.scss`): el 100 %, como en el expediente (4.9).
    const declared = declarations(lab, '.host', 'base').get('--poking-edge')
    expect(declared).toBe(`${WIDE_EDGE_PERCENT}%`)
    expect(WIDE_EDGE_PERCENT).toBe(100)
  })

  it('decisión aprobada: la etiqueta «Sofi» queda por encima del retrato cuando se solapan', () => {
    // Durante la broma el anfitrión sube a `--poking-z` (1): la etiqueta del diálogo, por encima.
    expect(
      declarations(lab, '.dialog > figcaption', 'base').get('z-index'),
    ).toBe('2')
  })

  it('el retrato de producción es el mismo SofiPortrait: 384 px, atento y con su descripción', () => {
    const { container } = render(
      <ConsultationScreen
        message=""
        context=""
        onMessageChange={() => {}}
        onContextChange={() => {}}
        onSubmit={() => {}}
        onClear={() => {}}
      />,
    )
    const big = container.querySelector<HTMLElement>(
      'aside [role="img"][aria-label="Sofi, atenta a lo que le cuentas"]',
    )
    expect(big).not.toBeNull()
    expect(big!.style.width).toBe(`${WIDE_SPRITE}px`)
    expect(big!.style.height).toBe(`${WIDE_SPRITE}px`)
  })
})
