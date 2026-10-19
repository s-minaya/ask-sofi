import { composeInterpret } from '../src/server/composeInterpret'
import { createInterpretHandler } from '../src/server/interpretHandler'

// Entrada de la plataforma (Vercel, firma Web Standard): sin lógica propia. Lee
// el entorno, compone y delega. Sin credencial, traductor o política, el
// manejador responde processing_unavailable sin llamar a ningún proveedor.
export default {
  fetch(request: Request): Promise<Response> {
    return createInterpretHandler(composeInterpret(process.env))(request)
  },
}
