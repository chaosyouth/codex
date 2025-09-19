export type ExtendedKeyOption = {
  label: string
  value: string
}

export type KeyboardKey = {
  label: string
  value: string
  shiftLabel?: string
  keyValues?: string[]
  codeValues?: string[]
  widthUnits?: number
  styleClasses?: string[]
  alternates?: ExtendedKeyOption[]
}

export type KeyboardRow = KeyboardKey[]

export type KeyboardLayout = KeyboardRow[]
