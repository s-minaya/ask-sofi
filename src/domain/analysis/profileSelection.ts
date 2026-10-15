import {
  answerKind,
  PROFILE_AREAS,
  type PartnerProfile,
  type ProfileAnswers,
} from '../partner-profile/partnerProfile'

// Minimización del expediente (005-spec §5): solo las respuestas que answerKind()
// clasifica como concretas, y solo con autorización. Las notas nunca salen.
// El servidor vuelve a aplicarla en su frontera; esta es la única implementación.
export function selectAuthorizedProfile(
  profile: PartnerProfile | undefined,
  authorized: boolean,
): ProfileAnswers {
  if (!authorized || profile === undefined) return {}

  const selected: Record<string, string> = {}
  for (const area of PROFILE_AREAS) {
    const answer = profile.answers[area]
    if (answer !== undefined && answerKind(answer) === 'concrete')
      selected[area] = answer
  }
  return selected as ProfileAnswers
}

// profileUsed es verdadero solo si se envía al menos una respuesta concreta.
export function hasAnswers(profile: ProfileAnswers | undefined): boolean {
  if (profile === undefined) return false
  return PROFILE_AREAS.some((area) => profile[area] !== undefined)
}
