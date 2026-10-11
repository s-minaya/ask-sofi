import type { MotionPreference } from '../../app/providers/MotionPreference'
import type { Scenario, Step, UiState } from './scenarios'

// Mensajes entre la mesa de control (documento del Lab) y la app simulada (iframe).
export type PreviewCommand =
  | { kind: 'scenario'; scenario: Scenario }
  | { kind: 'step'; step: Step }
  | { kind: 'simulate-block'; value: boolean }
  | { kind: 'motion'; value: MotionPreference }

export type PreviewState = {
  scenario: Scenario
  step: Step
  ui: UiState
}

type CommandMessage = {
  type: 'ask-sofi:preview-command'
  command: PreviewCommand
}
type StateMessage = { type: 'ask-sofi:preview-state'; state: PreviewState }
type ReadyMessage = { type: 'ask-sofi:preview-ready' }

export type PreviewMessage = CommandMessage | StateMessage | ReadyMessage

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Solo se aceptan mensajes del mismo origen y con la forma esperada.
export function readPreviewMessage(event: MessageEvent): PreviewMessage | null {
  if (event.origin !== window.location.origin || !isRecord(event.data))
    return null
  const { type } = event.data
  if (type === 'ask-sofi:preview-command' && isRecord(event.data.command))
    return event.data as CommandMessage
  if (type === 'ask-sofi:preview-state' && isRecord(event.data.state))
    return event.data as StateMessage
  if (type === 'ask-sofi:preview-ready') return { type }
  return null
}

export function sendPreviewMessage(
  target: Window | null | undefined,
  message: PreviewMessage,
) {
  target?.postMessage(message, window.location.origin)
}
