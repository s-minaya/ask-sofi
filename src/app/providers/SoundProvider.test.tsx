import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useSound } from '../../hooks/useSound'
import { STORAGE_KEYS } from '../../infrastructure/storage/storageKeys'
import { fakeAudio } from '../../test/fakeAudio'
import { SoundProvider } from './SoundProvider'

function Probe() {
  const sound = useSound()
  return (
    <div>
      <p>
        {sound.enabled ? 'activo' : 'silencio'} · recordado: {sound.preference}
      </p>
      <button type="button" onClick={sound.enable}>
        Activar
      </button>
      <button type="button" onClick={sound.unlock}>
        Desbloquear
      </button>
      <button type="button" onClick={sound.toggle}>
        Alternar
      </button>
      <button type="button" onClick={sound.disable}>
        Silenciar
      </button>
    </div>
  )
}

function setup(props: { persist?: boolean; deferAudio?: boolean } = {}) {
  const audio = fakeAudio()
  render(
    <SoundProvider createAudio={() => audio} {...props}>
      <Probe />
    </SoundProvider>,
  )
  return { audio, user: userEvent.setup() }
}

const press = (name: string) => screen.getByRole('button', { name })

describe('SoundProvider', () => {
  it('por defecto prepara el audio en el gesto que lo activa (Design Lab)', async () => {
    const { audio, user } = setup()

    await user.click(press('Activar'))

    expect(screen.getByText(/^activo/)).toBeInTheDocument()
    expect(audio.prepare).toHaveBeenCalledTimes(1)
  })

  describe('con la preparación diferida (aplicación real)', () => {
    it('activar el sonido no descarga ni prepara el audio', async () => {
      const { audio, user } = setup({ deferAudio: true })

      await user.click(press('Activar'))
      await user.click(press('Silenciar'))
      await user.click(press('Alternar'))

      expect(screen.getByText(/^activo/)).toBeInTheDocument()
      expect(audio.prepare).not.toHaveBeenCalled()
    })

    it('conserva la preferencia sin preparar el audio', async () => {
      const { audio, user } = setup({ persist: true, deferAudio: true })

      await user.click(press('Activar'))

      expect(screen.getByText(/recordado: on/)).toBeInTheDocument()
      expect(
        JSON.parse(
          window.localStorage.getItem(STORAGE_KEYS.preferences) ?? 'null',
        ).data.sound,
      ).toBe('on')
      expect(audio.prepare).not.toHaveBeenCalled()
    })

    it('prepara el audio cuando una acción del usuario lo pide expresamente', async () => {
      const { audio, user } = setup({ deferAudio: true })

      await user.click(press('Desbloquear'))

      expect(screen.getByText(/^activo/)).toBeInTheDocument()
      expect(audio.prepare).toHaveBeenCalledTimes(1)
    })
  })
})
