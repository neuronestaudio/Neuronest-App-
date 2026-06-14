// Focus Session presets — the one place to tune the cadence.
// Add a new preset here and it shows up everywhere automatically.

export interface FocusPreset {
  id: string
  name: string
  focusMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  roundsBeforeLongBreak: number
}

export const FOCUS_PRESETS: FocusPreset[] = [
  {
    id: 'classic',
    name: 'Classic',
    focusMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    roundsBeforeLongBreak: 4,
  },
  {
    id: 'deep',
    name: 'Deep Work',
    focusMinutes: 50,
    breakMinutes: 10,
    longBreakMinutes: 20,
    roundsBeforeLongBreak: 4,
  },
  {
    id: 'quick',
    name: 'Quick Reset',
    focusMinutes: 15,
    breakMinutes: 3,
    longBreakMinutes: 10,
    roundsBeforeLongBreak: 4,
  },
]

export const DEFAULT_PRESET = FOCUS_PRESETS[0]
