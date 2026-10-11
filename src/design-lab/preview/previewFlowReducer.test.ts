import { describe, expect, it } from 'vitest'
import { FIXTURE_CONTEXT, FIXTURE_MESSAGE } from '../fixtures'
import {
  initialFlowState,
  previewReducer,
  type FlowAction,
  type FlowState,
} from './previewFlowReducer'
import { SCENARIOS, screenFor, uiStateFor, type Scenario } from './scenarios'

function run(
  actions: ReadonlyArray<FlowAction>,
  scenario: Scenario = 'success',
): FlowState {
  return actions.reduce(previewReducer, initialFlowState(scenario))
}

describe('previewReducer', () => {
  it('starts every scenario on the landing with its deterministic fixture', () => {
    expect(initialFlowState('success')).toMatchObject({
      step: 'landing',
      message: FIXTURE_MESSAGE,
      context: FIXTURE_CONTEXT,
    })
    expect(initialFlowState('needs')).toMatchObject({
      step: 'landing',
      message: 'Vale.',
      context: '',
    })
    expect(initialFlowState('error')).toEqual(initialFlowState('error'))
  })

  it('validates the message on submit instead of disabling the button', () => {
    const empty = run([
      { type: 'go', step: 'consultation' },
      { type: 'clear' },
      { type: 'submit' },
    ])
    expect(empty.messageError).toBe(true)
    expect(empty.submitting).toBe(false)

    const fixed = previewReducer(empty, { type: 'message', value: 'Vale.' })
    expect(fixed.messageError).toBe(false)
    expect(previewReducer(fixed, { type: 'submit' }).submitting).toBe(true)
  })

  it('goes to processing once the simulated request has left, asking to move the focus', () => {
    const before = run([
      { type: 'go', step: 'consultation' },
      { type: 'submit' },
    ])
    const after = previewReducer(before, { type: 'submitted' })
    expect(after).toMatchObject({ step: 'processing', submitting: false })
    expect(after.focus.request).toBe(before.focus.request + 1)
    expect(after.focus.target).toBe('heading')
  })

  it('never reaches a result in «Carga»', () => {
    expect(run([{ type: 'go', step: 'result' }], 'loading').step).toBe(
      'processing',
    )
    const switched = run([
      { type: 'go', step: 'result' },
      { type: 'scenario', scenario: 'loading' },
    ])
    expect(switched.step).toBe('processing')
  })

  it('restarts the waiting time on every new step, even when the step repeats', () => {
    const first = run([{ type: 'go', step: 'processing' }], 'error')
    const retried = previewReducer(first, { type: 'go', step: 'processing' })
    expect(retried.run).toBe(first.run + 1)
  })

  it('resets the fixture and clears pending states when the scenario changes', () => {
    const state = run([
      { type: 'go', step: 'consultation' },
      { type: 'message', value: 'Otro texto' },
      { type: 'submit' },
      { type: 'scenario', scenario: 'needs' },
    ])
    expect(state).toMatchObject({
      scenario: 'needs',
      message: 'Vale.',
      context: '',
      submitting: false,
      step: 'consultation',
    })
  })

  it('cancels back to the consultation keeping the message and focusing the main action', () => {
    const state = run(
      [
        { type: 'go', step: 'processing' },
        { type: 'go', step: 'consultation', focus: 'submit' },
      ],
      'loading',
    )
    expect(state).toMatchObject({
      step: 'consultation',
      message: FIXTURE_MESSAGE,
    })
    expect(state.focus.target).toBe('submit')
  })

  it('asks for context before reading again, and then reads it as a success', () => {
    const asked = run(
      [{ type: 'go', step: 'result' }, { type: 'reread' }],
      'needs',
    )
    expect(asked).toMatchObject({ step: 'result', contextError: true })

    const reread = [
      { type: 'context', value: 'Es su tono de siempre.' },
      { type: 'reread' },
    ] as const
    const state = reread.reduce(previewReducer, asked)
    expect(state).toMatchObject({
      scenario: 'success',
      step: 'processing',
      contextError: false,
    })
  })

  it('empties the message and the context for a new query', () => {
    const state = run([{ type: 'go', step: 'result' }, { type: 'new-query' }])
    expect(state).toMatchObject({
      step: 'consultation',
      message: '',
      context: '',
    })
  })
})

describe('scenarios', () => {
  it('maps every scenario to its result screen', () => {
    expect(SCENARIOS.map((scenario) => screenFor('result', scenario))).toEqual([
      'success',
      'processing',
      'error',
      'needs',
    ])
    expect(screenFor('consultation', 'error')).toBe('consultation')
  })

  it('exposes the interface state of each screen', () => {
    expect(uiStateFor('landing', 'success', false)).toBe('idle')
    expect(uiStateFor('consultation', 'success', true)).toBe('submitting')
    expect(uiStateFor('result', 'loading', false)).toBe('processing')
    expect(uiStateFor('result', 'needs', false)).toBe('needs_context')
    expect(uiStateFor('result', 'error', false)).toBe('error')
    expect(uiStateFor('result', 'success', false)).toBe('success')
  })
})
