import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../app/providers/ThemeProvider'
import { DesignLab } from './DesignLab'

function renderSection(section: 'ui' | 'sofi') {
  window.history.replaceState(null, '', `/design-lab?s=${section}`)
  render(
    <ThemeProvider>
      <DesignLab />
    </ThemeProvider>,
  )
}

// Un playground es un subtítulo seguido de su panel de props y su escenario.
function playground(title: string) {
  const heading = screen.getByRole('heading', { level: 3, name: title })
  const split = heading.nextElementSibling
  if (!(split instanceof HTMLElement)) throw new Error('Playground sin panel')
  return within(split)
}

describe('Props playgrounds', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('feeds the panel controls into the real production component', () => {
    renderSection('sofi')
    const lead = playground('InterpretationLead · props')

    fireEvent.change(lead.getByLabelText('Porcentaje de la versión'), {
      target: { value: '70' },
    })

    // La cifra que pinta InterpretationLead es la de la prop, no una copia.
    expect(lead.getByText('70', { selector: 'p' })).toBeInTheDocument()
    expect(lead.getByText(/percentage: 70/)).toBeInTheDocument()
  })

  it('shows the variant chosen for a UI component', () => {
    renderSection('ui')
    const notice = playground('Notice · props')

    fireEvent.click(notice.getByRole('button', { name: 'danger' }))

    expect(notice.getByRole('button', { name: 'danger' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(notice.getByText(/tone="danger"/)).toBeInTheDocument()
  })

  it('exposes SofiStage, the one stage component that had no example', () => {
    renderSection('sofi')
    const stage = playground('SofiStage · props')

    fireEvent.click(stage.getByRole('button', { name: 'Ups' }))

    expect(stage.getByText(/expression="oops"/)).toBeInTheDocument()
    expect(
      stage.getByRole('img', { name: 'Sofi cierra los ojos: algo ha fallado' }),
    ).toBeInTheDocument()
  })
})
