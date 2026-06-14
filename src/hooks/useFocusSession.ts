import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_PRESET, type FocusPreset } from '../data/focusPresets'
import { logFocusBlock } from '../pomodoro/store'

// The Focus Session state machine (internally a pomodoro):
//   idle ──start──▶ focusing ──(timer 0)──▶ break ──(timer 0)──▶ idle | completed
//   focusing/break ──pause──▶ paused ──resume──▶ back to where it was
//   any active phase ──end──▶ completed
// All timing + transitions live here so the UI stays declarative.
export type FocusPhase = 'idle' | 'focusing' | 'paused' | 'break' | 'completed'

interface SessionState {
  phase: FocusPhase
  /** what an active phase was before it was paused */
  pausedFrom: 'focusing' | 'break' | null
  /** current focus round (0 before the first block starts) */
  round: number
  /** is the active/just-finished break a long one */
  isLongBreak: boolean
  secondsLeft: number
  /** length of the current phase, for the progress ring */
  totalSeconds: number
}

/** A soft two-note bell — deliberately gentle, never an alarm. */
function gentleChime() {
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctor()
    const master = ctx.createGain()
    master.gain.value = 0.16
    master.connect(ctx.destination)
    const notes: [number, number][] = [
      [528, 0],
      [792, 0.18],
    ]
    notes.forEach(([freq, offset]) => {
      const t = ctx.currentTime + offset
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain).connect(master)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(1, t + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.7)
      osc.start(t)
      osc.stop(t + 1.8)
    })
    setTimeout(() => void ctx.close(), 2400)
  } catch {
    /* audio unavailable — transitions still work silently */
  }
}

const mins = (m: number) => m * 60

function freshState(preset: FocusPreset): SessionState {
  return {
    phase: 'idle',
    pausedFrom: null,
    round: 0,
    isLongBreak: false,
    secondsLeft: mins(preset.focusMinutes),
    totalSeconds: mins(preset.focusMinutes),
  }
}

/** Decide the next state when a running phase reaches zero. */
function onPhaseComplete(s: SessionState, preset: FocusPreset): SessionState {
  if (s.phase === 'focusing') {
    const isLong = s.round % preset.roundsBeforeLongBreak === 0
    const len = isLong ? preset.longBreakMinutes : preset.breakMinutes
    return { ...s, phase: 'break', isLongBreak: isLong, secondsLeft: mins(len), totalSeconds: mins(len) }
  }
  // a break finished
  if (s.isLongBreak) {
    // a full set of rounds is done — wrap the session up
    return { ...s, phase: 'completed', secondsLeft: 0, totalSeconds: mins(preset.focusMinutes) }
  }
  // short break done — return to idle and offer the next round
  return {
    ...s,
    phase: 'idle',
    secondsLeft: mins(preset.focusMinutes),
    totalSeconds: mins(preset.focusMinutes),
  }
}

export function useFocusSession(preset: FocusPreset = DEFAULT_PRESET) {
  const [state, setState] = useState<SessionState>(() => freshState(preset))
  const intervalRef = useRef<number | null>(null)
  const prevPhase = useRef<FocusPhase>('idle')
  // mirror of state so actions can read current values without re-creating callbacks
  const stateRef = useRef(state)
  stateRef.current = state

  // One ticking interval, alive only while a phase is actively counting down.
  useEffect(() => {
    const counting = state.phase === 'focusing' || state.phase === 'break'
    if (!counting) return
    intervalRef.current = window.setInterval(() => {
      setState((s) =>
        s.secondsLeft > 1 ? { ...s, secondsLeft: s.secondsLeft - 1 } : onPhaseComplete(s, preset),
      )
    }, 1000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [state.phase, preset])

  // Gentle chime + analytics on the transitions that happen on their own.
  useEffect(() => {
    const from = prevPhase.current
    const to = state.phase
    if (to === 'break' && from === 'focusing') {
      gentleChime() // focus → break
      // a full focus block just completed — credit it
      logFocusBlock({ minutes: preset.focusMinutes, presetId: preset.id, completed: true })
    }
    if ((to === 'idle' || to === 'completed') && from === 'break') gentleChime() // break → next
    prevPhase.current = to
  }, [state.phase, preset])

  // Keep the idle preview in sync when the preset changes (before a session starts).
  useEffect(() => {
    setState((s) =>
      s.phase === 'idle' && s.round === 0
        ? { ...s, secondsLeft: mins(preset.focusMinutes), totalSeconds: mins(preset.focusMinutes) }
        : s,
    )
  }, [preset])

  const start = useCallback(() => {
    setState((s) => ({
      phase: 'focusing',
      pausedFrom: null,
      round: s.phase === 'completed' ? 1 : s.round + 1,
      isLongBreak: false,
      secondsLeft: mins(preset.focusMinutes),
      totalSeconds: mins(preset.focusMinutes),
    }))
  }, [preset])

  const pause = useCallback(() => {
    setState((s) =>
      s.phase === 'focusing' || s.phase === 'break'
        ? { ...s, phase: 'paused', pausedFrom: s.phase }
        : s,
    )
  }, [])

  const resume = useCallback(() => {
    setState((s) =>
      s.phase === 'paused' && s.pausedFrom
        ? { ...s, phase: s.pausedFrom, pausedFrom: null }
        : s,
    )
  }, [])

  const end = useCallback(() => {
    // credit partial focus time if we were mid-focus when ending
    const s = stateRef.current
    const wasFocusing = s.phase === 'focusing' || (s.phase === 'paused' && s.pausedFrom === 'focusing')
    if (wasFocusing) {
      const elapsedMin = Math.round((s.totalSeconds - s.secondsLeft) / 60)
      if (elapsedMin >= 1) logFocusBlock({ minutes: elapsedMin, presetId: preset.id, completed: false })
    }
    setState((cur) => ({ ...cur, phase: 'completed', pausedFrom: null }))
  }, [preset])

  const skipBreak = useCallback(() => {
    setState((s) => ({
      phase: 'focusing',
      pausedFrom: null,
      round: s.round + 1,
      isLongBreak: false,
      secondsLeft: mins(preset.focusMinutes),
      totalSeconds: mins(preset.focusMinutes),
    }))
  }, [preset])

  const reset = useCallback(() => setState(freshState(preset)), [preset])

  return { ...state, preset, start, pause, resume, end, skipBreak, reset }
}
