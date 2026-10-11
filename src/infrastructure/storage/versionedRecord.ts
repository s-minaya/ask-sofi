import * as z from 'zod/mini'
import type { StorageArea, WriteResult } from './storageArea'

export type RecordSpec<T> = {
  version: number
  schema: z.ZodMiniType<T>
}

export type ReadOutcome<T> =
  | { status: 'missing' }
  | { status: 'ok'; value: T }
  // Corrupto o con otra forma: nunca se utiliza.
  | { status: 'invalid' }
  // Escrito por una versión posterior de la aplicación: no se interpreta ni se pisa.
  | { status: 'newer-version'; version: number }

const envelopeSchema = z.object({ version: z.int(), data: z.unknown() })

function parseEnvelope(raw: string) {
  try {
    const parsed = envelopeSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

// Lectura: parseo → versión → validación de los datos → valor o fallback seguro.
export function readRecord<T>(
  area: StorageArea,
  key: string,
  spec: RecordSpec<T>,
): ReadOutcome<T> {
  const raw = area.read(key)
  if (raw === null) return { status: 'missing' }

  const envelope = parseEnvelope(raw)
  if (!envelope) return { status: 'invalid' }
  if (envelope.version > spec.version)
    return { status: 'newer-version', version: envelope.version }
  // Todavía no existe ninguna versión anterior con migración conocida.
  if (envelope.version !== spec.version) return { status: 'invalid' }

  const data = spec.schema.safeParse(envelope.data)
  return data.success
    ? { status: 'ok', value: data.data }
    : { status: 'invalid' }
}

export function writeRecord<T>(
  area: StorageArea,
  key: string,
  spec: RecordSpec<T>,
  value: T,
): WriteResult {
  const serialized = JSON.stringify({ version: spec.version, data: value })

  const current = area.read(key)
  const envelope = current === null ? null : parseEnvelope(current)
  if (envelope && envelope.version > spec.version) {
    // Los datos de una versión futura se conservan; esta sesión sigue con su copia.
    area.hold(key, serialized)
    return { persisted: false, reason: 'newer-version' }
  }

  return area.write(key, serialized)
}
