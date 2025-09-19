import type { ExtendedKeyOption, KeyboardKey, KeyboardLayout, KeyboardRow } from './types'

const LETTER_ALTERNATES: Record<string, string[]> = {
  a: ['á', 'à', 'â', 'ä', 'ã'],
  e: ['é', 'è', 'ê', 'ë'],
  i: ['í', 'ì', 'î', 'ï'],
  o: ['ó', 'ò', 'ô', 'ö', 'õ'],
  u: ['ú', 'ù', 'û', 'ü'],
  c: ['ç'],
  n: ['ñ'],
  y: ['ý', 'ÿ']
}

const createAlternates = (char: string): ExtendedKeyOption[] | undefined => {
  const options = LETTER_ALTERNATES[char]
  if (!options) {
    return undefined
  }

  return options.map((value) => ({
    label: value,
    value
  }))
}

const createLetterKey = (char: string): KeyboardKey => {
  const lower = char.toLowerCase()
  return {
    label: lower,
    value: lower,
    shiftLabel: lower.toUpperCase(),
    codeValues: [`Key${lower.toUpperCase()}`],
    widthUnits: 1,
    alternates: createAlternates(lower)
  }
}

const cloneLayout = (layout: KeyboardLayout): KeyboardLayout =>
  layout.map((row) => row.map((key) => ({ ...key, styleClasses: key.styleClasses ? [...key.styleClasses] : undefined, alternates: key.alternates ? key.alternates.map((option) => ({ ...option })) : undefined })))

const WINDOWS_LAYOUT_TEMPLATE: KeyboardLayout = [
  [
    { label: '`', value: '`', shiftLabel: '~', codeValues: ['Backquote'], widthUnits: 1 },
    { label: '1', value: '1', shiftLabel: '!', codeValues: ['Digit1'], widthUnits: 1 },
    { label: '2', value: '2', shiftLabel: '@', codeValues: ['Digit2'], widthUnits: 1 },
    { label: '3', value: '3', shiftLabel: '#', codeValues: ['Digit3'], widthUnits: 1 },
    { label: '4', value: '4', shiftLabel: '$', codeValues: ['Digit4'], widthUnits: 1 },
    { label: '5', value: '5', shiftLabel: '%', codeValues: ['Digit5'], widthUnits: 1 },
    { label: '6', value: '6', shiftLabel: '^', codeValues: ['Digit6'], widthUnits: 1 },
    { label: '7', value: '7', shiftLabel: '&', codeValues: ['Digit7'], widthUnits: 1 },
    { label: '8', value: '8', shiftLabel: '*', codeValues: ['Digit8'], widthUnits: 1 },
    { label: '9', value: '9', shiftLabel: '(', codeValues: ['Digit9'], widthUnits: 1 },
    { label: '0', value: '0', shiftLabel: ')', codeValues: ['Digit0'], widthUnits: 1 },
    { label: '-', value: '-', shiftLabel: '_', codeValues: ['Minus'], widthUnits: 1 },
    { label: '=', value: '=', shiftLabel: '+', codeValues: ['Equal'], widthUnits: 1 },
    {
      label: 'Backspace',
      value: 'Backspace',
      keyValues: ['Backspace'],
      codeValues: ['Backspace'],
      widthUnits: 3
    }
  ],
  [
    {
      label: 'Tab',
      value: 'Tab',
      keyValues: ['Tab'],
      codeValues: ['Tab'],
      widthUnits: 2
    },
    createLetterKey('q'),
    createLetterKey('w'),
    createLetterKey('e'),
    createLetterKey('r'),
    createLetterKey('t'),
    createLetterKey('y'),
    createLetterKey('u'),
    createLetterKey('i'),
    createLetterKey('o'),
    createLetterKey('p'),
    { label: '[', value: '[', shiftLabel: '{', codeValues: ['BracketLeft'], widthUnits: 1 },
    { label: ']', value: ']', shiftLabel: '}', codeValues: ['BracketRight'], widthUnits: 1 },
    {
      label: '\\',
      value: '\\',
      shiftLabel: '|',
      codeValues: ['Backslash'],
      widthUnits: 2
    }
  ],
  [
    {
      label: 'Caps',
      value: 'CapsLock',
      keyValues: ['CapsLock'],
      codeValues: ['CapsLock'],
      widthUnits: 2
    },
    createLetterKey('a'),
    createLetterKey('s'),
    createLetterKey('d'),
    createLetterKey('f'),
    createLetterKey('g'),
    createLetterKey('h'),
    createLetterKey('j'),
    createLetterKey('k'),
    createLetterKey('l'),
    { label: ';', value: ';', shiftLabel: ':', codeValues: ['Semicolon'], widthUnits: 1 },
    { label: "'", value: "'", shiftLabel: '"', codeValues: ['Quote'], widthUnits: 1 },
    {
      label: 'Enter',
      value: 'Enter',
      keyValues: ['Enter'],
      codeValues: ['Enter'],
      widthUnits: 3
    }
  ],
  [
    { label: 'Shift', value: 'ShiftLeft', codeValues: ['ShiftLeft'], widthUnits: 3 },
    createLetterKey('z'),
    createLetterKey('x'),
    createLetterKey('c'),
    createLetterKey('v'),
    createLetterKey('b'),
    createLetterKey('n'),
    createLetterKey('m'),
    { label: ',', value: ',', shiftLabel: '<', codeValues: ['Comma'], widthUnits: 1 },
    { label: '.', value: '.', shiftLabel: '>', codeValues: ['Period'], widthUnits: 1 },
    { label: '/', value: '/', shiftLabel: '?', codeValues: ['Slash'], widthUnits: 1 },
    { label: 'Shift', value: 'ShiftRight', codeValues: ['ShiftRight'], widthUnits: 3 }
  ],
  [
    { label: 'Ctrl', value: 'ControlLeft', codeValues: ['ControlLeft'], widthUnits: 2 },
    { label: 'Alt', value: 'AltLeft', codeValues: ['AltLeft'], widthUnits: 2 },
    {
      label: 'Space',
      value: ' ',
      keyValues: [' '],
      codeValues: ['Space'],
      widthUnits: 8,
      styleClasses: ['is-space']
    },
    { label: 'Alt', value: 'AltRight', codeValues: ['AltRight'], widthUnits: 2 },
    { label: 'Ctrl', value: 'ControlRight', codeValues: ['ControlRight'], widthUnits: 2 }
  ]
]

const MAC_LAYOUT_TEMPLATE: KeyboardLayout = [
  [
    { label: '`', value: '`', shiftLabel: '~', codeValues: ['Backquote'], widthUnits: 1 },
    { label: '1', value: '1', shiftLabel: '!', codeValues: ['Digit1'], widthUnits: 1 },
    { label: '2', value: '2', shiftLabel: '@', codeValues: ['Digit2'], widthUnits: 1 },
    { label: '3', value: '3', shiftLabel: '#', codeValues: ['Digit3'], widthUnits: 1 },
    { label: '4', value: '4', shiftLabel: '$', codeValues: ['Digit4'], widthUnits: 1 },
    { label: '5', value: '5', shiftLabel: '%', codeValues: ['Digit5'], widthUnits: 1 },
    { label: '6', value: '6', shiftLabel: '^', codeValues: ['Digit6'], widthUnits: 1 },
    { label: '7', value: '7', shiftLabel: '&', codeValues: ['Digit7'], widthUnits: 1 },
    { label: '8', value: '8', shiftLabel: '*', codeValues: ['Digit8'], widthUnits: 1 },
    { label: '9', value: '9', shiftLabel: '(', codeValues: ['Digit9'], widthUnits: 1 },
    { label: '0', value: '0', shiftLabel: ')', codeValues: ['Digit0'], widthUnits: 1 },
    { label: '-', value: '-', shiftLabel: '_', codeValues: ['Minus'], widthUnits: 1 },
    { label: '=', value: '=', shiftLabel: '+', codeValues: ['Equal'], widthUnits: 1 },
    {
      label: 'Delete',
      value: 'Backspace',
      keyValues: ['Backspace'],
      codeValues: ['Backspace'],
      widthUnits: 3
    }
  ],
  [
    {
      label: 'Tab',
      value: 'Tab',
      keyValues: ['Tab'],
      codeValues: ['Tab'],
      widthUnits: 2
    },
    createLetterKey('q'),
    createLetterKey('w'),
    createLetterKey('e'),
    createLetterKey('r'),
    createLetterKey('t'),
    createLetterKey('y'),
    createLetterKey('u'),
    createLetterKey('i'),
    createLetterKey('o'),
    createLetterKey('p'),
    { label: '[', value: '[', shiftLabel: '{', codeValues: ['BracketLeft'], widthUnits: 1 },
    { label: ']', value: ']', shiftLabel: '}', codeValues: ['BracketRight'], widthUnits: 1 },
    {
      label: '\\',
      value: '\\',
      shiftLabel: '|',
      codeValues: ['Backslash'],
      widthUnits: 2
    }
  ],
  [
    {
      label: 'Caps Lock',
      value: 'CapsLock',
      keyValues: ['CapsLock'],
      codeValues: ['CapsLock'],
      widthUnits: 2
    },
    createLetterKey('a'),
    createLetterKey('s'),
    createLetterKey('d'),
    createLetterKey('f'),
    createLetterKey('g'),
    createLetterKey('h'),
    createLetterKey('j'),
    createLetterKey('k'),
    createLetterKey('l'),
    { label: ';', value: ';', shiftLabel: ':', codeValues: ['Semicolon'], widthUnits: 1 },
    { label: "'", value: "'", shiftLabel: '"', codeValues: ['Quote'], widthUnits: 1 },
    {
      label: 'Return',
      value: 'Enter',
      keyValues: ['Enter'],
      codeValues: ['Enter'],
      widthUnits: 3
    }
  ],
  [
    { label: 'Shift', value: 'ShiftLeft', codeValues: ['ShiftLeft'], widthUnits: 3 },
    createLetterKey('z'),
    createLetterKey('x'),
    createLetterKey('c'),
    createLetterKey('v'),
    createLetterKey('b'),
    createLetterKey('n'),
    createLetterKey('m'),
    { label: ',', value: ',', shiftLabel: '<', codeValues: ['Comma'], widthUnits: 1 },
    { label: '.', value: '.', shiftLabel: '>', codeValues: ['Period'], widthUnits: 1 },
    { label: '/', value: '/', shiftLabel: '?', codeValues: ['Slash'], widthUnits: 1 },
    { label: 'Shift', value: 'ShiftRight', codeValues: ['ShiftRight'], widthUnits: 3 }
  ],
  [
    { label: 'Control', value: 'ControlLeft', codeValues: ['ControlLeft'], widthUnits: 2 },
    { label: 'Option', value: 'AltLeft', codeValues: ['AltLeft'], widthUnits: 2 },
    { label: 'Command', value: 'MetaLeft', codeValues: ['MetaLeft'], widthUnits: 2 },
    {
      label: 'Space',
      value: ' ',
      keyValues: [' '],
      codeValues: ['Space'],
      widthUnits: 6,
      styleClasses: ['is-space']
    },
    { label: 'Command', value: 'MetaRight', codeValues: ['MetaRight'], widthUnits: 2 },
    { label: 'Option', value: 'AltRight', codeValues: ['AltRight'], widthUnits: 2 }
  ]
]

export const createDefaultWindowsLayout = (): KeyboardLayout => cloneLayout(WINDOWS_LAYOUT_TEMPLATE)

export const createDefaultMacLayout = (): KeyboardLayout => cloneLayout(MAC_LAYOUT_TEMPLATE)

const normalizeValue = (value: string) => (value.length === 1 ? value.toLowerCase() : value)

const applyLabelOverrides = (
  layout: KeyboardLayout,
  overrides: Record<string, { label: string; shiftLabel?: string }>
) => {
  layout.forEach((row) => {
    row.forEach((key) => {
      const override = overrides[normalizeValue(key.value)]
      if (!override) {
        return
      }
      key.label = override.label
      key.shiftLabel = override.shiftLabel ?? override.label
    })
  })
}

export const createJapaneseLayout = (): KeyboardLayout => {
  const layout = createDefaultWindowsLayout()

  const overrides: Record<string, { label: string; shiftLabel?: string }> = {
    '`': { label: '半/全' },
    '1': { label: 'ぬ' },
    '2': { label: 'ふ' },
    '3': { label: 'あ' },
    '4': { label: 'う' },
    '5': { label: 'え' },
    '6': { label: 'お' },
    '7': { label: 'や' },
    '8': { label: 'ゆ' },
    '9': { label: 'よ' },
    '0': { label: 'わ' },
    '-': { label: 'ほ' },
    '=': { label: 'へ' },
    q: { label: 'た' },
    w: { label: 'て' },
    e: { label: 'い' },
    r: { label: 'す' },
    t: { label: 'か' },
    y: { label: 'ん' },
    u: { label: 'な' },
    i: { label: 'に' },
    o: { label: 'ら' },
    p: { label: 'せ' },
    '[': { label: '゛' },
    ']': { label: '゜' },
    '\\': { label: 'む' },
    a: { label: 'ち' },
    s: { label: 'と' },
    d: { label: 'し' },
    f: { label: 'は' },
    g: { label: 'き' },
    h: { label: 'く' },
    j: { label: 'ま' },
    k: { label: 'の' },
    l: { label: 'り' },
    ';': { label: 'れ' },
    "'": { label: 'け' },
    z: { label: 'つ' },
    x: { label: 'さ' },
    c: { label: 'そ' },
    v: { label: 'ひ' },
    b: { label: 'こ' },
    n: { label: 'み' },
    m: { label: 'も' },
    ',': { label: 'ね' },
    '.': { label: 'る' },
    '/': { label: 'め' }
  }

  applyLabelOverrides(layout, overrides)

  return layout
}

export const DEFAULT_KEYBOARD_LAYOUTS = {
  windows: createDefaultWindowsLayout,
  macos: createDefaultMacLayout,
  japanese: createJapaneseLayout
}
