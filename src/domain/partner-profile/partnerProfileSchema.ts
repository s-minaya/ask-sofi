import * as z from 'zod/mini'
import {
  AREA_ANSWERS,
  NOTES_MAX_LENGTH,
  type PartnerProfile,
  type ProfileAnswers,
  type ProfileArea,
} from './partnerProfile'

// Un valor desconocido deja el área sin responder en lugar de invalidar el expediente.
const answer = <A extends ProfileArea>(area: A) =>
  z.catch(z.optional(z.enum(AREA_ANSWERS[area])), undefined)

const answersSchema = z.pipe(
  z.object({
    directness: answer('directness'),
    sarcasm: answer('sarcasm'),
    conflict: answer('conflict'),
    personalSpace: answer('personalSpace'),
    initiative: answer('initiative'),
    messageStyle: answer('messageStyle'),
  }),
  // Un valor descartado deja la clave con undefined; sin responder es no tener clave.
  z.transform((answers): ProfileAnswers =>
    Object.fromEntries(
      Object.entries(answers).filter(([, value]) => value !== undefined),
    ),
  ),
)

// Valida un expediente que llega de fuera (almacenamiento): cada campo se
// recupera por separado, como las preferencias, para no perder el resto.
export const partnerProfileSchema: z.ZodMiniType<PartnerProfile> = z.object({
  answers: answersSchema,
  notes: z.catch(z.string().check(z.maxLength(NOTES_MAX_LENGTH)), ''),
})
