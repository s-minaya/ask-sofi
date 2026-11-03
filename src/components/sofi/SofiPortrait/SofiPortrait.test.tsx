import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { className as blinkClass } from '../sprites/sofi-blink'
import { SOFI_REGISTRY } from '../visual/registry'
import styles from '../SofiSprite/SofiSprite.module.scss'
import { SofiPortrait } from './SofiPortrait'
import portraitStyles from './SofiPortrait.module.scss'

// Plan 008 §5.4 (T038): `SofiPortrait` pinta el parpadeo con el módulo dueño de `sofi-blink`
// y gana `animation`, que pone en su sitio a otro recurso con `SofiSprite`. El recorte, el
// contorno y el tamaño aprobados no cambian. Las pruebas de los demás comportamientos del
// retrato (alternativa, imagen estática) siguen en `sofiComponents.test.tsx`.

const originalLoad = SOFI_REGISTRY.sofing.load
afterEach(() => {
  SOFI_REGISTRY.sofing.load = originalLoad
})
// El recurso no llega nunca: se ve lo que el retrato muestra mientras carga.
const neverLoads = () => {
  SOFI_REGISTRY.sofing.load = () => new Promise(() => {})
}

describe('SofiPortrait · parpadeo', () => {
  it('lo pinta con la clase del módulo dueño de sofi-blink, no con una copia propia', () => {
    const { container } = render(<SofiPortrait size={192} />)

    expect(container.firstElementChild).toHaveClass(blinkClass)
  })

  it('indicar sofi-blink es lo mismo que no indicar nada', () => {
    const { container } = render(
      <>
        <SofiPortrait size={192} />
        <SofiPortrait size={192} animation="sofi-blink" />
      </>,
    )

    const [byDefault, explicit] = Array.from(container.children)
    expect(explicit.className).toBe(byDefault.className)
  })

  it('un fotograma fijo sigue quieto', () => {
    const { container } = render(<SofiPortrait size={192} frame={1} />)

    expect(container.firstElementChild).toHaveClass(
      blinkClass,
      portraitStyles.frame1,
    )
  })
})

describe('SofiPortrait · animation', () => {
  it('pinta otro recurso en lugar del parpadeo, decorativo y con el tamaño indicado', () => {
    neverLoads()
    const { container } = render(
      <SofiPortrait size={192} animation="sofing" frame={1} outline />,
    )

    // Sin alternativa ni recorte, el retrato es el propio recurso.
    const portrait = container.firstElementChild as HTMLElement
    expect(portrait).toHaveClass(portraitStyles.portrait)
    expect(portrait).toHaveAttribute('aria-hidden', 'true')
    expect(portrait).toHaveStyle({ width: '192px', height: '192px' })

    const sprite = portrait.firstElementChild as HTMLElement
    // Mientras carga se ve el fotograma de reposo: ni el parpadeo en marcha ni el fotograma pedido.
    expect(sprite).toHaveClass(blinkClass, styles.fallback)
    expect(sprite).not.toHaveClass(portraitStyles.frame1)
    expect(sprite).toHaveClass(portraitStyles.outline)
    expect(sprite).toHaveStyle({ width: '192px', height: '192px' })
    expect(sprite).toHaveAttribute('aria-hidden', 'true')
    expect(sprite).not.toHaveAttribute('role')
  })

  it('conserva el recorte aprobado y la alternativa en el contenedor', () => {
    neverLoads()
    render(
      <SofiPortrait
        size={192}
        animation="sofing"
        alt="Sofi, procesando"
        crop={{
          width: 96,
          height: 96,
          offsetX: 50,
          offsetY: 36,
          background: 'var(--tone-pink-soft)',
          frame: 'sticker',
        }}
      />,
    )

    const crop = screen.getByRole('img', { name: 'Sofi, procesando' })
    expect(crop).toHaveClass(portraitStyles.crop, portraitStyles.cropSticker)
    expect(crop).toHaveStyle({ width: '96px', height: '96px' })

    const sprite = crop.firstElementChild as HTMLElement
    expect(sprite).toHaveStyle({
      width: '192px',
      height: '192px',
      margin: '-36px 0 0 -50px',
    })
    // Un solo nodo con significado: el recurso no se anuncia dos veces.
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })
})
