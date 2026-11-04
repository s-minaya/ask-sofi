import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Activity } from 'react'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { useSound } from '../../hooks/useSound'
import {
  createSpeechAudio,
  type AudioContextLike,
} from '../../infrastructure/audio/speechAudio'
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

  // El proveedor es el dueño del AudioContext compartido (D-11): lo crea y lo cierra él,
  // y la voz solo lo usa. Aquí la voz es el controlador real; solo el contexto es un doble.
  describe('con el contexto de audio compartido', () => {
    // Nace suspendido, como un AudioContext real: la voz lo reanuda al prepararse.
    function fakeSharedContext() {
      const context = {
        state: 'suspended',
        currentTime: 0,
        destination: {},
        resume: vi.fn(() => {
          context.state = 'running'
          return Promise.resolve()
        }),
        close: vi.fn(() => Promise.resolve()),
        createBufferSource: vi.fn(),
        createGain: vi.fn(),
        decodeAudioData: vi.fn(() => Promise.resolve({ duration: 21 })),
      }
      return context
    }

    function setupShared(
      props: { persist?: boolean; deferAudio?: boolean } = {},
    ) {
      // «Dentro del gesto» se comprueba así: el clic está en curso mientras el proveedor
      // crea el contexto (la captura lo marca antes de React y la burbuja lo desmarca después).
      let inGesture = false
      const enter = () => (inGesture = true)
      const leave = () => (inGesture = false)
      document.addEventListener('click', enter, true)
      document.addEventListener('click', leave)
      onTestFinished(() => {
        document.removeEventListener('click', enter, true)
        document.removeEventListener('click', leave)
      })

      const contexts: ReturnType<typeof fakeSharedContext>[] = []
      const createdInGesture: boolean[] = []
      const createContext = vi.fn(() => {
        const context = fakeSharedContext()
        contexts.push(context)
        createdInGesture.push(inGesture)
        return context as unknown as AudioContextLike
      })
      const speeches: ReturnType<typeof createSpeechAudio>[] = []
      const createAudio = (context: () => AudioContextLike) => {
        const speech = createSpeechAudio({
          src: '/talking-sound.mp3',
          context,
          fetchData: () => Promise.resolve(new ArrayBuffer(8)),
        })
        vi.spyOn(speech, 'dispose')
        speeches.push(speech)
        return speech
      }
      // Con `visible`, Activity no cambia nada; ocultarlo ejecuta la limpieza de los efectos
      // sin desmontar el proveedor, que conserva su estado.
      const tree = (mode: 'visible' | 'hidden') => (
        <Activity mode={mode}>
          <SoundProvider
            createAudio={createAudio}
            createContext={createContext}
            {...props}
          >
            <Probe />
          </SoundProvider>
        </Activity>
      )
      const view = render(tree('visible'))
      return {
        contexts,
        createContext,
        createdInGesture,
        speeches,
        unmount: view.unmount,
        hide: () => view.rerender(tree('hidden')),
        show: () => view.rerender(tree('visible')),
        user: userEvent.setup(),
      }
    }

    it('no lo crea al montar ni mientras el sonido está desactivado o sin desbloquear', async () => {
      const { createContext, unmount, user } = setupShared({
        deferAudio: true,
      })

      await user.click(press('Activar'))
      await user.click(press('Silenciar'))
      await user.click(press('Alternar'))

      expect(screen.getByText(/^activo/)).toBeInTheDocument()
      expect(createContext).not.toHaveBeenCalled()

      unmount()
      expect(createContext).not.toHaveBeenCalled()
    })

    it('lo crea una sola vez, dentro del primer gesto que desbloquea el sonido', async () => {
      const { contexts, createContext, createdInGesture, user } = setupShared({
        deferAudio: true,
      })

      await user.click(press('Desbloquear'))
      await user.click(press('Desbloquear'))

      expect(createContext).toHaveBeenCalledTimes(1)
      expect(createdInGesture).toEqual([true])
      expect(contexts[0].resume).toHaveBeenCalled()
    })

    it('lo crea al activar el sonido cuando no se aplaza la preparación (Design Lab)', async () => {
      const { createContext, createdInGesture, user } = setupShared()

      await user.click(press('Activar'))

      expect(createContext).toHaveBeenCalledTimes(1)
      expect(createdInGesture).toEqual([true])
    })

    it('al desmontarse libera la voz, después cierra el contexto, y la voz no lo cierra por su cuenta', async () => {
      const { contexts, speeches, unmount, user } = setupShared({
        deferAudio: true,
      })
      await user.click(press('Desbloquear'))
      const [context] = contexts
      expect(context.close).not.toHaveBeenCalled()

      unmount()

      expect(speeches[0].dispose).toHaveBeenCalledTimes(1)
      expect(context.close).toHaveBeenCalledTimes(1)
      expect(
        vi.mocked(speeches[0].dispose).mock.invocationCallOrder[0],
      ).toBeLessThan(context.close.mock.invocationCallOrder[0])
    })

    it('si el proveedor se oculta y se muestra de nuevo, no reutiliza el contexto cerrado', async () => {
      const { contexts, createContext, hide, show, user } = setupShared({
        deferAudio: true,
      })
      await user.click(press('Desbloquear'))

      hide()
      expect(contexts[0].close).toHaveBeenCalledTimes(1)

      show()
      await user.click(press('Desbloquear'))

      expect(createContext).toHaveBeenCalledTimes(2)
      expect(contexts[1].resume).toHaveBeenCalled()
      expect(contexts[1].close).not.toHaveBeenCalled()
    })
  })
})
