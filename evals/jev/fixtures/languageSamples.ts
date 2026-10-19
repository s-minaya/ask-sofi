// Muestra de L1 (006-plan §5.3): catalán, gallego y euskera. Solo informativa, no
// forma parte de E1 ni se etiqueta: sirve para ver cómo se comporta cada
// candidato de traducción antes de prometer compatibilidad (006-spec §2).
export const LANGUAGE_SAMPLES = [
  { id: 'l1-ca', language: 'ca', message: "D'acord, ja en parlem demà." },
  { id: 'l1-gl', language: 'gl', message: 'Vale, xa falamos mañá.' },
  { id: 'l1-eu', language: 'eu', message: 'Ados, bihar hitz egingo dugu.' },
] as const
