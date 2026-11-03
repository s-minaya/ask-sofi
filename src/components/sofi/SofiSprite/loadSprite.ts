import { className as blinkClass } from '../sprites/sofi-blink'
import { SOFI_REGISTRY } from '../visual/registry'
import type { SofiAnimationId } from '../visual/types'

// Carga de un recurso (plan 008 §5.4): su módulo dueño y, antes de aplicar su clase, la
// decodificación de todas sus tiras. Sin esa espera la animación arranca sin imagen entre
// 0,7 y 1,6 s en una conexión lenta (E13); el hueco con la decodificación previa es de 0 ms.

// `sofi-blink` es estática (plan §7): su módulo está en la entrada y es el respaldo de los
// demás, así que no pasa por el registro ni por la decodificación.
const loaded = new Map<SofiAnimationId, string>([['sofi-blink', blinkClass]])
// Una carga en curso la comparten todos los que piden el mismo recurso (StrictMode incluido).
const pending = new Map<SofiAnimationId, Promise<string>>()

// La clase de un recurso ya cargado, para pintarlo de entrada sin pasar por la estática.
export function loadedClassOf(id: SofiAnimationId): string | undefined {
  return loaded.get(id)
}

export function loadSprite(id: SofiAnimationId): Promise<string> {
  const known = loaded.get(id)
  if (known) return Promise.resolve(known)

  let promise = pending.get(id)
  if (!promise) {
    // Un fallo no se recuerda: el siguiente montaje lo vuelve a intentar.
    promise = fetchSprite(id)
      .then((className) => {
        loaded.set(id, className)
        return className
      })
      .finally(() => pending.delete(id))
    pending.set(id, promise)
  }
  return promise
}

async function fetchSprite(id: SofiAnimationId): Promise<string> {
  const entry = SOFI_REGISTRY[id]
  // `eureka` y `suspicious` no tienen cargador: solo los pinta el Lab (plan §5.2).
  if (!entry.load) throw new Error(`${id} no tiene cargador de producción`)

  const owner = await entry.load()
  await Promise.all(
    Object.entries(owner.strips).map(([path, url]) => {
      const image = new Image()
      // Antes de `src`, o la tira se pide dos veces: una sin CORS y otra con él (E13).
      if (entry.maskStrips.some((mask) => path.endsWith(`/${mask}`)))
        image.crossOrigin = 'anonymous'
      image.src = url
      return image.decode()
    }),
  )
  return owner.className
}

// Solo para pruebas: la caché es estado del módulo y no debe pasar de una prueba a otra.
export function resetSpriteLoader(): void {
  loaded.clear()
  loaded.set('sofi-blink', blinkClass)
  pending.clear()
}
