import type {
  AreaAnswer,
  ProfileArea,
} from '../../domain/partner-profile/partnerProfile'
import type {
  AffectedPersonType,
  SignalId,
} from '../../domain/analysis/signalCatalog'

// Cualquier cambio de texto de este fichero sube la versión: viaja en la
// procedencia de cada resultado y en los informes de los experimentos
// (006-plan §3.5). Las instrucciones son provisionales hasta E2–E6.
export const INSTRUCTION_VERSION = '1'

// `reading` recibe el expediente cuando lo hay; `assessment` (seguridad,
// personas afectadas y suficiencia) nunca (005-spec §3, §5).
export type JevQuestion = {
  key: string
  kind: 'reading' | 'assessment'
  instructions: string
  criteria: { true: string; false: string }
}

// Instrucciones directas que nombran los campos del estado (jev.md §6.2, §10.8).
// Cada «Not for:» es la frontera del riesgo de interpretación del registro §3.
const STATE = '`partnerMessage` and `currentSituation` (when present)'

const reading = (
  key: string,
  instructions: string,
  criteria: JevQuestion['criteria'],
): JevQuestion => ({ key, kind: 'reading', instructions, criteria })

const assessment = (
  key: string,
  instructions: string,
  criteria: JevQuestion['criteria'],
): JevQuestion => ({ key, kind: 'assessment', instructions, criteria })

export const SIGNAL_QUESTIONS: Record<SignalId, JevQuestion> = {
  literal_meaning: reading(
    'signal_literal_meaning',
    `Using ${STATE}, does the partner most likely mean exactly what \`partnerMessage\` says on its surface? A plain refusal, request or benign statement counts as literal. Not for: being literal is not permission, a literal "no" stays a "no"; do not assume nothing is left unsaid just because the message is short.`,
    {
      true: 'The words can be taken at face value, including a plain "no", a prohibition or a benign statement.',
      false:
        'The words probably carry a different or additional meaning than their surface.',
    },
  ),
  seeking_reassurance: reading(
    'signal_seeking_reassurance',
    `Using ${STATE}, does \`partnerMessage\` possibly seek reassurance, confirmation or affection from the other person? Not for: do not invent a psychological need the text does not show; asking a plain question is not seeking reassurance.`,
    {
      true: 'The text shows a wish to be reassured, confirmed or shown affection.',
      false: 'The text shows no such wish.',
    },
  ),
  inviting_initiative: reading(
    'signal_inviting_initiative',
    `Using ${STATE}, does \`partnerMessage\` possibly invite the other person to take the initiative or make a proposal, such as a plan or a gesture? Not for: an explicit refusal or boundary is never an invitation; this reading never overrides a clear "no".`,
    {
      true: 'The text suggests the partner would welcome a proposal or a move from the other person.',
      false:
        'The text does not suggest that, or it contains an explicit refusal.',
    },
  ),
  requesting_space: reading(
    'signal_requesting_space',
    `Using ${STATE}, does \`partnerMessage\` express distance, a pause, or a need for time or space? Not for: needing space is not the same as ending the relationship or no longer loving the other person.`,
    {
      true: 'The text expresses distance, a pause or a need for time or space.',
      false: 'The text expresses none of these.',
    },
  ),
  expressing_disappointment: reading(
    'signal_expressing_disappointment',
    `Using ${STATE}, does \`partnerMessage\` communicate disappointment or frustrated expectations? Not for: disappointment is not always annoyance or reproach.`,
    {
      true: 'The text communicates disappointment or an unmet expectation.',
      false: 'The text does not communicate disappointment.',
    },
  ),
  expressing_annoyance: reading(
    'signal_expressing_annoyance',
    `Using ${STATE}, does \`partnerMessage\` communicate irritation, annoyance or anger? Not for: do not infer an intensity of anger the text does not express; sadness or disappointment alone are not annoyance.`,
    {
      true: 'The text communicates irritation, annoyance or anger.',
      false: 'The text does not communicate irritation, annoyance or anger.',
    },
  ),
  setting_boundary: reading(
    'signal_setting_boundary',
    `Using ${STATE}, does \`partnerMessage\` communicate a refusal or a limit that deserves to be respected? Not for: a boundary is not a romantic challenge or a game; do not weaken it because other readings are also possible.`,
    {
      true: 'The text refuses something or sets a limit, explicitly or clearly.',
      false: 'The text does not refuse anything or set a limit.',
    },
  ),
  playful_teasing: reading(
    'signal_playful_teasing',
    `Using ${STATE}, is \`partnerMessage\` a joke or a playful provocation? Not for: a single laughing expression or emoji does not prove teasing.`,
    {
      true: 'The text is playful or jokingly provocative.',
      false: 'The text is not playful.',
    },
  ),
  sarcastic_tone: reading(
    'signal_sarcastic_tone',
    `Using ${STATE}, is \`partnerMessage\` ironic or sarcastic in the way it is said, meaning something different from its literal words? Not for: an emoji such as 🙃 does not by itself prove sarcasm; polite or formal wording is not sarcasm.`,
    {
      true: 'The way it is said points to irony or sarcasm.',
      false: 'The text is not ironic or sarcastic.',
    },
  ),
  indirect_hint: reading(
    'signal_indirect_hint',
    `Using ${STATE}, does \`partnerMessage\` communicate something indirectly, hinting at it instead of saying it? Not for: do not invent what is being hinted at; answer true only if the text itself shows that something is being implied.`,
    {
      true: 'The text implies something it does not say directly.',
      false: 'The text says what it means directly.',
    },
  ),
}

export const SAFETY_QUESTION: JevQuestion = assessment(
  'safety',
  `Using ${STATE}, do they indicate a risk to someone's safety: a threat of violence or harm, coercion or control that makes someone afraid, or a risk of self-harm? Not for: colloquial exaggeration or hyperbole about harm, such as a joke like "I'll kill you if you eat my fries", is not by itself a risk; judge the meaning in context, not isolated words. Do not dismiss a risk only because it is phrased casually.`,
  {
    true: 'The text, in context, indicates a threat, violence, coercion, control that causes fear, or a risk of self-harm.',
    false:
      'The text is ordinary conversation, hyperbole or a joke with no real risk in context.',
  },
)

export const AFFECTED_QUESTIONS: Record<
  Exclude<AffectedPersonType, 'undetermined'>,
  JevQuestion
> = {
  user_at_risk_from_other: assessment(
    'affected_user_at_risk_from_other',
    `Using ${STATE}, is the person who received the message at risk from the partner or from someone else: threats, violence, coercion or control directed at them? Not for: ordinary arguments or colloquial exaggeration.`,
    {
      true: 'The text indicates threats, violence, coercion or control directed at the person who received the message.',
      false: 'It does not.',
    },
  ),
  other_at_risk_of_self_harm: assessment(
    'affected_other_at_risk_of_self_harm',
    `Using ${STATE}, does \`partnerMessage\` indicate that the partner may harm themselves, for example a statement or threat of self-harm or suicide by the partner? Not for: a threat directed at the other person is not self-harm.`,
    {
      true: 'The partner states or threatens self-harm or suicide.',
      false: 'The partner does not.',
    },
  ),
  user_at_risk_of_self_harm: assessment(
    'affected_user_at_risk_of_self_harm',
    `Using ${STATE}, does the text indicate that the person who received the message may harm themselves? Not for: the partner's own statements about the partner.`,
    {
      true: 'The text shows that the person who received the message may harm themselves.',
      false: 'It does not.',
    },
  ),
}

export const SUFFICIENCY_QUESTION: JevQuestion = assessment(
  'sufficiency',
  `Using ${STATE}, is there enough information to judge what the partner most likely meant? Judge the information available, not how clear the intent feels. Not for: a message that is explicit does not become insufficient because it gives no reasons; "I don't want you to come today" is explicit even without a reason.`,
  {
    true: 'The message is explicit by itself, or the situation shows what it responds to and how it was meant.',
    false:
      'The message is short or ambiguous and nothing shows what it responds to or how it was meant.',
  },
)

export function allQuestions(): JevQuestion[] {
  return [
    SAFETY_QUESTION,
    ...Object.values(AFFECTED_QUESTIONS),
    SUFFICIENCY_QUESTION,
    ...Object.values(SIGNAL_QUESTIONS),
  ]
}

// Lo que se añade a cada lectura cuando se envía el expediente (jev.md §8.4).
const PROFILE_PRECEDENCE =
  'Judge mainly from `partnerMessage` and `currentSituation`. `reportedTendencies` are general impressions the user has of the partner, not facts about this message: use them only as background, and if they point elsewhere than the current evidence, follow the current evidence.'

// /v1/decisions solo documenta `instructions` en un `predicate`: los criterios
// van dentro del texto (006-plan §3.3).
export function instructionsText(
  question: JevQuestion,
  { withProfile }: { withProfile: boolean },
): string {
  const parts = [
    ...(withProfile && question.kind === 'reading' ? [PROFILE_PRECEDENCE] : []),
    question.instructions,
    `Answer true when: ${question.criteria.true}`,
    `Answer false when: ${question.criteria.false}`,
  ]
  return parts.join('\n')
}

// Qué es el expediente para quien lo lee (jev.md §8.2). No es el copy de 004.
export const PROFILE_ABOUT =
  'General habits of the partner as reported by the user. They are impressions, not facts, and may not apply to this message.'

type Concrete<A extends ProfileArea> = Exclude<
  AreaAnswer<A>,
  'depends' | 'unknown'
>

// Una frase estable por respuesta concreta (jev.md §8.2). «Depende» y «No lo sé»
// no tienen frase porque nunca se envían (jev.md §8.3).
export const PROFILE_PHRASES: {
  [A in ProfileArea]: Record<Concrete<A>, string>
} = {
  directness: {
    'says-it-clearly':
      'When something bothers them, they usually say it clearly.',
    'drops-hints':
      'When something bothers them, they tend to drop hints rather than say it directly.',
  },
  sarcasm: {
    often: 'Often uses irony or sarcasm when writing.',
    sometimes: 'Sometimes uses irony or sarcasm when writing.',
    rarely: 'Rarely uses irony or sarcasm when writing.',
  },
  conflict: {
    'talk-now':
      'In a disagreement, usually prefers to talk about it in the moment.',
    'talk-later':
      'In a disagreement, usually prefers to come back to it later.',
  },
  personalSpace: {
    'usually-yes':
      'When going through something difficult, usually needs space.',
    'usually-no':
      'When going through something difficult, usually does not need space.',
  },
  initiative: {
    'proposes-alternatives':
      'When a plan changes, usually proposes alternatives.',
    'waits-for-me':
      'When a plan changes, usually waits for the user to propose them.',
  },
  messageStyle: {
    'short-direct':
      'Usually writes short, direct messages, even when everything is fine.',
    'long-expressive':
      'Usually writes long, expressive messages with many details.',
    varies: 'How they write changes a lot depending on the moment.',
  },
}
