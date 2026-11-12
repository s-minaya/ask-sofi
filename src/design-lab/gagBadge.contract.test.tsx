import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConsultationScreen } from '../features/consultation/screens/ConsultationScreen'
import { BADGE_BACKGROUND, BADGE_CROP, BADGE_SPRITE } from './gagBadge'
import gagsStyles from './sections/GagsSpec.module.scss?raw'
import tokens from '../styles/tokens/_shape.scss?raw'

// T066, alternativa A1: «mantener la insignia actual». El prototipo repite su geometría porque
// producción no la exporta y no se toca; esta prueba la compara con la pantalla real, así que si
// alguien cambia la insignia de la consulta, el prototipo deja de ser fiel y salta aquí.

function productionBadge() {
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
  // El recuadro es el único elemento del `aside` con el alto del recorte: se localiza por su
  // medida y no por el nombre de una clase de CSS Modules.
  const crop = container.querySelector<HTMLElement>(
    `aside [style*="height: ${BADGE_CROP.height}px"]`,
  )
  return { crop, sprite: crop?.firstElementChild as HTMLElement | null }
}

// El cuerpo de la regla de primer nivel `selector { … }` del SCSS, sin comentarios. Las reglas del
// módulo no se anidan, así que basta con ir hasta la primera llave de cierre.
function ruleBody(source: string, selector: string): string {
  const withoutComments = source.replace(/\/\/.*$/gm, '')
  const start = withoutComments.indexOf(`${selector} {`)
  expect(start, `no hay regla ${selector}`).toBeGreaterThanOrEqual(0)
  const open = withoutComments.indexOf('{', start)
  return withoutComments.slice(open + 1, withoutComments.indexOf('}', open))
}

// `--stroke-structure`: el borde de la pegatina, que es el que descuenta el alto interior.
const STROKE = Number(
  /--stroke-structure:\s*([\d.]+)px/.exec(tokens)?.[1] ?? Number.NaN,
)

describe('la insignia del prototipo es la de la consulta', () => {
  it('el recuadro mide lo mismo y lleva el mismo fondo', () => {
    const { crop } = productionBadge()
    expect(crop).not.toBeNull()
    expect(crop!.style.width).toBe(`${BADGE_CROP.width}px`)
    expect(crop!.style.height).toBe(`${BADGE_CROP.height}px`)
    expect(crop!.style.background).toBe(BADGE_BACKGROUND)
  })

  it('Sofi se pinta con el mismo tamaño y el mismo desplazamiento dentro del recuadro', () => {
    const { sprite } = productionBadge()
    expect(sprite).not.toBeNull()
    expect(sprite!.style.width).toBe(`${BADGE_SPRITE}px`)
    expect(sprite!.style.height).toBe(`${BADGE_SPRITE}px`)
    expect(sprite!.style.marginTop).toBe(`${-BADGE_CROP.offsetY}px`)
    expect(sprite!.style.marginLeft).toBe(`${-BADGE_CROP.offsetX}px`)
  })

  it('el busto apoya en el borde inferior: el sprite termina donde acaba el recuadro interior', () => {
    // Con el borde de la pegatina (2,5 px por lado) el alto interior es 130 − 5 = 125. El sprite
    // empieza 3 px por encima y mide 128, así que termina justo en 125.
    expect(STROKE).toBeGreaterThan(0)
    const inner = BADGE_CROP.height - 2 * STROKE
    expect(BADGE_SPRITE - BADGE_CROP.offsetY).toBe(inner)
  })
})

// Las dos decisiones visuales del prototipo viven en el CSS, que jsdom no calcula: se comprueban
// sobre el texto del módulo (como hacen otras pruebas de contrato con los tokens) y, en
// navegador, con las medidas de 008-verification §25.
describe('lo que decide el prototipo en el CSS', () => {
  it('el recuadro de la insignia no recorta: los efectos de los gags pueden sobresalir', () => {
    expect(ruleBody(gagsStyles, '.badge')).not.toMatch(/overflow/)
  })

  it('poking se esconde tras el borde inferior de la propia insignia', () => {
    // `--poking-edge` es la altura del borde desde arriba, en % de la pieza (`_poking.scss`): el
    // recuadro interior termina, medido desde lo alto del sprite, a (125 + 3) / 128 = 100 %.
    const edge =
      ((BADGE_CROP.height - 2 * STROKE + BADGE_CROP.offsetY) / BADGE_SPRITE) *
      100
    const declared = /--poking-edge:\s*([\d.]+)%/.exec(
      ruleBody(gagsStyles, '.host'),
    )
    expect(declared, 'el anfitrión declara --poking-edge').not.toBeNull()
    expect(Number(declared![1])).toBe(edge)
  })
})
