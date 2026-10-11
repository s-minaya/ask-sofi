// Controlador de la voz de Sofi, separado del typewriter: un AudioContext,
// un buffer y un único canal, así nunca se solapan dos fragmentos.
export type SpeechAudioStatus =
  'off' | 'loading' | 'ready' | 'playing' | 'blocked' | 'unavailable'

export type AudioContextLike = {
  readonly state: AudioContextState | 'interrupted'
  readonly currentTime: number
  readonly destination: AudioNode
  resume(): Promise<void>
  close(): Promise<void>
  createBufferSource(): AudioBufferSourceNode
  createGain(): GainNode
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>
}

export type SpeechAudioOptions = {
  src: string
  createContext?: () => AudioContextLike
  fetchData?: (src: string) => Promise<ArrayBuffer>
  volume?: number
}

export type SpeechAudio = {
  // Debe llamarse dentro de un gesto del usuario: crea o reanuda el contexto ahí mismo.
  prepare(): Promise<boolean>
  startVoice(): void
  stopVoice(): void
  playFragment(durationMs: number): void
  setVolume(volume: number): void
  disable(): void
  dispose(): void
  getStatus(): SpeechAudioStatus
  subscribe(listener: () => void): () => void
}

// Margen para que el navegador reanude el contexto; si no lo hace, está bloqueado.
const RESUME_GRACE_MS = 300

function defaultCreateContext(): AudioContextLike {
  const Context =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Context) throw new Error('Web Audio no disponible')
  return new Context()
}

async function defaultFetchData(src: string): Promise<ArrayBuffer> {
  const response = await fetch(src)
  if (!response.ok) throw new Error(`Audio no disponible (${response.status})`)
  return response.arrayBuffer()
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function createSpeechAudio({
  src,
  createContext = defaultCreateContext,
  fetchData = defaultFetchData,
  volume: initialVolume = 0.6,
}: SpeechAudioOptions): SpeechAudio {
  let status: SpeechAudioStatus = 'off'
  let context: AudioContextLike | null = null
  let buffer: AudioBuffer | null = null
  let loading: Promise<AudioBuffer> | null = null
  let source: AudioBufferSourceNode | null = null
  let gain: GainNode | null = null
  let volume = initialVolume
  // Posición dentro del audio: cada fragmento continúa donde se quedó el anterior.
  let offset = 0
  let startedAt = 0
  let fragmentTimer: ReturnType<typeof setTimeout> | null = null
  const listeners = new Set<() => void>()

  function setStatus(next: SpeechAudioStatus) {
    if (status === next) return
    status = next
    for (const listener of listeners) listener()
  }

  function loadBuffer(ctx: AudioContextLike): Promise<AudioBuffer> {
    if (buffer) return Promise.resolve(buffer)
    if (!loading) {
      loading = fetchData(src)
        .then((data) => ctx.decodeAudioData(data))
        .then((decoded) => {
          buffer = decoded
          return decoded
        })
      // Si falla, el siguiente intento vuelve a descargar.
      loading.catch(() => {
        loading = null
      })
    }
    return loading
  }

  async function prepare(): Promise<boolean> {
    if (
      context?.state === 'running' &&
      buffer &&
      (status === 'ready' || status === 'playing')
    ) {
      return true
    }
    if (!context) {
      try {
        context = createContext()
      } catch {
        setStatus('unavailable')
        return false
      }
    }
    const ctx = context
    setStatus('loading')
    // resume() se pide ya, todavía dentro del gesto; puede quedarse pendiente si el navegador no deja sonar.
    const resumed =
      ctx.state === 'running'
        ? Promise.resolve()
        : ctx.resume().catch(() => undefined)
    try {
      await loadBuffer(ctx)
    } catch {
      setStatus('unavailable')
      return false
    }
    await Promise.race([resumed, wait(RESUME_GRACE_MS)])
    if (ctx.state !== 'running') {
      setStatus('blocked')
      return false
    }
    setStatus('ready')
    return true
  }

  function startVoice() {
    if (!context || !buffer || source) return
    if (status !== 'ready') return
    // Un permiso anterior no garantiza que el contexto siga activo.
    if (context.state !== 'running') {
      setStatus('blocked')
      return
    }
    const node = context.createBufferSource()
    node.buffer = buffer
    node.loop = true
    if (!gain) {
      gain = context.createGain()
      gain.connect(context.destination)
    }
    gain.gain.value = volume
    node.connect(gain)
    offset %= buffer.duration
    node.start(0, offset)
    startedAt = context.currentTime
    source = node
    setStatus('playing')
  }

  function stopVoice() {
    if (fragmentTimer) {
      clearTimeout(fragmentTimer)
      fragmentTimer = null
    }
    if (!source || !context || !buffer) return
    try {
      source.stop()
    } catch {
      // Ya estaba parado.
    }
    source.disconnect()
    offset = (offset + (context.currentTime - startedAt)) % buffer.duration
    source = null
    if (status === 'playing') setStatus('ready')
  }

  function playFragment(durationMs: number) {
    stopVoice()
    startVoice()
    if (source) fragmentTimer = setTimeout(stopVoice, durationMs)
  }

  function setVolume(next: number) {
    volume = next
    if (gain) gain.gain.value = next
  }

  function disable() {
    stopVoice()
    setStatus('off')
  }

  function dispose() {
    stopVoice()
    const ctx = context
    context = null
    gain = null
    if (ctx) void ctx.close().catch(() => undefined)
    setStatus('off')
  }

  return {
    prepare,
    startVoice,
    stopVoice,
    playFragment,
    setVolume,
    disable,
    dispose,
    getStatus: () => status,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
