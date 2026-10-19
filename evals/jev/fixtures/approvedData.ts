import approvedFile from '../review/e1-casos-aprobados-65.json' with { type: 'json' }
import sidecarFile from '../review/e1-perfiles-e4-aislados.json' with { type: 'json' }
import { mapApprovedDataset, parseE4Profiles } from './approved.ts'

// Única fuente de verdad de E1: los ficheros que aprobó la autora en
// `evals/jev/review/`. Se validan al cargar; `cases.ts` solo añade la intención
// de diseño, el origen, los pares y el canario.
export const APPROVED_CASES = mapApprovedDataset(approvedFile)
export const E4_PROFILES = parseE4Profiles(sidecarFile)
