<template>
  <main class="page">
    <section class="keyboard-demo">
      <header class="intro">
        <h1>虚拟键盘演示</h1>
        <p>按下物理键盘上的按键，观察下方虚拟键盘上对应按键的高亮效果。</p>
      </header>

      <section class="virtual-textarea-section">
        <header class="virtual-textarea-header">
          <h2>虚拟输入框</h2>
          <p>所有捕获的按键都会写入此处，可选中、换行并移动光标。</p>
        </header>
        <div
          ref="virtualTextareaRef"
          class="virtual-textarea"
          role="textbox"
          aria-multiline="true"
          aria-label="虚拟输入框"
          :class="{ 'is-focused': virtualInput.isFocused }"
          tabindex="0"
          @pointerdown.stop="handleTextPointerDown"
          @pointermove="handleTextPointerMove"
          @pointerup="handleTextPointerUp"
          @pointercancel="handleTextPointerCancel"
          @focus="focusVirtualInput"
          @blur="blurVirtualInput"
        >
          <div class="virtual-textarea-content">
            <template v-if="showPlaceholder">
              <span class="virtual-placeholder">开始输入...</span>
            </template>
            <template v-else>
              <template v-for="node in displayNodes" :key="node.key">
                <span
                  v-if="node.type === 'char'"
                  class="virtual-char"
                  :class="{ 'is-selected': node.isSelected }"
                  :data-index="node.index"
                >{{ node.char }}</span><span
                  v-else-if="node.type === 'line-break'"
                  class="virtual-line-break"
                  :class="{ 'is-selected': node.isSelected }"
                  :data-index="node.index"
                ></span><span
                  v-else
                  class="virtual-caret"
                  :data-index="node.index"
                ></span>
              </template>
            </template>
          </div>
        </div>
      </section>

      <div
        ref="keyboardRef"
        class="keyboard"
        role="presentation"
      >
        <div
          v-for="(row, rowIndex) in keyboardRows"
          :key="`row-${rowIndex}`"
          class="keyboard-row"
        >
          <button
            v-for="(keyInfo, keyIndex) in row"
            :key="`${keyInfo.label}-${keyIndex}`"
            type="button"
            class="keyboard-key"
            :class="[
              ...(keyInfo.styleClasses ?? []),
              {
                'is-active': isKeyActive(keyInfo.value),
                'has-icon': hasControlIcon(keyInfo),
                'has-alternates': hasAlternates(keyInfo)
              }
            ]"
            :aria-pressed="isKeyActive(keyInfo.value)"
            :style="getKeyStyle(keyInfo)"
            :ref="(el) => registerKeyElement(keyInfo, el)"
            @pointerdown="handlePointerDown($event, keyInfo)"
            @pointerup="handlePointerUp($event, keyInfo)"
            @pointerleave="handlePointerLeave($event, keyInfo)"
            @pointercancel="handlePointerCancel($event, keyInfo)"
          >
            <span>{{ getDisplayLabel(keyInfo) }}</span>
          </button>
        </div>
      </div>
    </section>
  </main>

  <Teleport to="body">
    <div
      v-if="activePopup"
      class="key-popup-backdrop"
      @pointerdown.self="closePopup"
    >
      <div
        class="key-popup"
        :style="{
          left: `${activePopup.position.left}px`,
          top: `${activePopup.position.top - 12}px`
        }"
      >
        <button
          v-for="(option, optionIndex) in activePopup.alternates"
          :key="option.value"
          type="button"
          class="key-popup-option"
          :class="{ 'is-focused': optionIndex === activePopupIndex }"
          :aria-selected="optionIndex === activePopupIndex"
          @pointerenter="activePopupIndex = optionIndex"
          @pointerdown.stop.prevent="selectAlternateOption(activePopup.baseKey, option)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  createDefaultMacLayout,
  createDefaultWindowsLayout,
  createJapaneseLayout
} from '../layouts/defaultLayouts'
import type {
  ExtendedKeyOption,
  KeyboardKey,
  KeyboardLayout
} from '../layouts/types'

type LayoutName = 'windows' | 'macos' | 'japanese'
type BaseLayoutName = 'windows' | 'macos'

const layoutFactories: Record<LayoutName, () => KeyboardLayout> = {
  windows: createDefaultWindowsLayout,
  macos: createDefaultMacLayout,
  japanese: createJapaneseLayout
}

const defaultLayoutName = ref<BaseLayoutName>('windows')
const activeLayoutName = ref<LayoutName>('windows')
const keyboardRows = ref<KeyboardLayout>(layoutFactories.windows())

const keyboardRef = ref<HTMLElement | null>(null)

const virtualTextareaRef = ref<HTMLElement | null>(null)

const virtualInput = reactive({
  text: '',
  selectionStart: 0,
  selectionEnd: 0,
  caretPosition: 0,
  isFocused: false
})

const selectionAnchor = ref(0)
const preferredColumn = ref<number | null>(null)
const textPointerSelection = ref<{ pointerId: number; anchor: number } | null>(null)

const textLength = computed(() => virtualInput.text.length)
const selectionCollapsed = computed(
  () => virtualInput.selectionStart === virtualInput.selectionEnd
)

const showPlaceholder = computed(
  () => !virtualInput.isFocused && virtualInput.text.length === 0
)

const setActiveLayout = (name: LayoutName) => {
  activeLayoutName.value = name
  keyboardRows.value = layoutFactories[name]()
}

const toggleJapaneseLayout = () => {
  const next =
    activeLayoutName.value === 'japanese' ? defaultLayoutName.value : 'japanese'
  setActiveLayout(next)
}

const normalizeKey = (key: string) => {
  if (key.length === 1) {
    return key.toLowerCase()
  }

  return key
}

const allKeyValues = computed(
  () =>
    new Set(
      keyboardRows.value.flatMap((row) =>
        row.map((key) => normalizeKey(key.value))
      )
    )
)

const layoutKeyMap = computed(() => {
  const map = new Map<string, string>()
  keyboardRows.value.forEach((row) => {
    row.forEach((key) => {
      const normalizedValue = normalizeKey(key.value)
      const keyCandidates = key.keyValues ?? [key.value]
      keyCandidates.forEach((candidate) => {
        const normalizedCandidate = normalizeKey(candidate)
        if (!map.has(normalizedCandidate)) {
          map.set(normalizedCandidate, normalizedValue)
        }
      })
    })
  })
  return map
})

const layoutCodeMap = computed(() => {
  const map = new Map<string, string>()
  keyboardRows.value.forEach((row) => {
    row.forEach((key) => {
      const normalizedValue = normalizeKey(key.value)
      const codeCandidates = key.codeValues ?? []
      codeCandidates.forEach((code) => {
        if (!map.has(code)) {
          map.set(code, normalizedValue)
        }
      })
    })
  })
  return map
})

const keyLookup = computed(() => {
  const map = new Map<string, KeyboardKey[]>()
  keyboardRows.value.forEach((row) => {
    row.forEach((key) => {
      const normalizedValue = normalizeKey(key.value)
      const existing = map.get(normalizedValue)
      if (existing) {
        existing.push(key)
      } else {
        map.set(normalizedValue, [key])
      }
    })
  })
  return map
})

const findKeyByNormalizedValue = (normalizedKey: string): KeyboardKey | undefined =>
  keyLookup.value.get(normalizedKey)?.[0]

const clampPosition = (position: number) =>
  Math.max(0, Math.min(position, textLength.value))

const updateSelectionRange = (anchor: number, caret: number) => {
  const clampedAnchor = clampPosition(anchor)
  const clampedCaret = clampPosition(caret)
  virtualInput.selectionStart = Math.min(clampedAnchor, clampedCaret)
  virtualInput.selectionEnd = Math.max(clampedAnchor, clampedCaret)
  virtualInput.caretPosition = clampedCaret
  selectionAnchor.value = clampedAnchor
}

const collapseSelection = (position: number) => {
  const clamped = clampPosition(position)
  virtualInput.selectionStart = clamped
  virtualInput.selectionEnd = clamped
  virtualInput.caretPosition = clamped
  selectionAnchor.value = clamped
  preferredColumn.value = null
}

const ensureAnchorForExtension = () => {
  if (selectionCollapsed.value) {
    selectionAnchor.value = virtualInput.caretPosition
  }
}

const extendSelectionTo = (position: number) => {
  ensureAnchorForExtension()
  updateSelectionRange(selectionAnchor.value, position)
}

const replaceSelection = (replacement: string) => {
  const start = virtualInput.selectionStart
  const end = virtualInput.selectionEnd
  const text = virtualInput.text
  virtualInput.text = text.slice(0, start) + replacement + text.slice(end)
  const newCaret = start + replacement.length
  collapseSelection(newCaret)
}

const deleteBackward = () => {
  if (!selectionCollapsed.value) {
    replaceSelection('')
    return true
  }
  if (virtualInput.caretPosition === 0) {
    return false
  }
  const caret = virtualInput.caretPosition
  virtualInput.text =
    virtualInput.text.slice(0, caret - 1) + virtualInput.text.slice(caret)
  collapseSelection(caret - 1)
  return true
}

const deleteForward = () => {
  if (!selectionCollapsed.value) {
    replaceSelection('')
    return true
  }
  if (virtualInput.caretPosition === textLength.value) {
    return false
  }
  const caret = virtualInput.caretPosition
  virtualInput.text =
    virtualInput.text.slice(0, caret) + virtualInput.text.slice(caret + 1)
  collapseSelection(caret)
  return true
}

const selectAllText = () => {
  updateSelectionRange(0, textLength.value)
}

const lineStarts = computed(() => {
  const starts: number[] = [0]
  const text = virtualInput.text
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') {
      starts.push(i + 1)
    }
  }
  return starts
})

const getLineLength = (line: number) => {
  const text = virtualInput.text
  const starts = lineStarts.value
  if (line >= starts.length) {
    return 0
  }
  const start = starts[line]
  const nextStart = line + 1 < starts.length ? starts[line + 1] - 1 : text.length
  return Math.max(0, nextStart - start)
}

const getLineColumn = (index: number) => {
  const starts = lineStarts.value
  const clampedIndex = clampPosition(index)
  let line = 0
  for (let i = 0; i < starts.length; i += 1) {
    if (starts[i] <= clampedIndex) {
      line = i
    } else {
      break
    }
  }
  const lineStart = starts[line]
  const lineLength = getLineLength(line)
  const column = Math.min(clampedIndex - lineStart, lineLength)
  return { line, column }
}

const getIndexFromLineColumn = (line: number, column: number) => {
  const starts = lineStarts.value
  if (line <= 0) {
    return clampPosition(column)
  }
  if (line >= starts.length) {
    return textLength.value
  }
  const lineStart = starts[line]
  const lineLength = getLineLength(line)
  const clampedColumn = Math.max(0, Math.min(column, lineLength))
  return clampPosition(lineStart + clampedColumn)
}

const moveCaretHorizontal = (direction: 'left' | 'right', extend: boolean) => {
  if (!extend && !selectionCollapsed.value) {
    const position =
      direction === 'left' ? virtualInput.selectionStart : virtualInput.selectionEnd
    collapseSelection(position)
    return true
  }

  const caret = virtualInput.caretPosition
  if (direction === 'left') {
    if (caret === 0) {
      return false
    }
    const newPos = caret - 1
    if (extend) {
      extendSelectionTo(newPos)
    } else {
      collapseSelection(newPos)
    }
  } else {
    if (caret === textLength.value) {
      return false
    }
    const newPos = caret + 1
    if (extend) {
      extendSelectionTo(newPos)
    } else {
      collapseSelection(newPos)
    }
  }

  preferredColumn.value = null
  return true
}

const moveCaretHome = (extend: boolean) => {
  const { line } = getLineColumn(virtualInput.caretPosition)
  const newPos = lineStarts.value[line]
  if (extend) {
    extendSelectionTo(newPos)
  } else {
    collapseSelection(newPos)
  }
  preferredColumn.value = null
  return true
}

const moveCaretEnd = (extend: boolean) => {
  const { line } = getLineColumn(virtualInput.caretPosition)
  const newPos = getIndexFromLineColumn(line, getLineLength(line))
  if (extend) {
    extendSelectionTo(newPos)
  } else {
    collapseSelection(newPos)
  }
  preferredColumn.value = null
  return true
}

const moveCaretVertical = (direction: 'up' | 'down', extend: boolean) => {
  const { line, column } = getLineColumn(virtualInput.caretPosition)
  const goalColumn = preferredColumn.value ?? column
  preferredColumn.value = goalColumn

  if (direction === 'up' && line === 0) {
    if (extend) {
      extendSelectionTo(0)
    } else {
      collapseSelection(0)
    }
    preferredColumn.value = null
    return true
  }

  const maxLineIndex = lineStarts.value.length - 1
  if (direction === 'down' && line >= maxLineIndex) {
    const endPos = textLength.value
    if (extend) {
      extendSelectionTo(endPos)
    } else {
      collapseSelection(endPos)
    }
    preferredColumn.value = null
    return true
  }

  const targetLine = direction === 'up' ? line - 1 : line + 1
  const newPos = getIndexFromLineColumn(targetLine, goalColumn)
  if (extend) {
    extendSelectionTo(newPos)
  } else {
    collapseSelection(newPos)
  }
  return true
}

const displayNodes = computed(() => {
  const nodes: Array<
    | { type: 'char'; key: string; char: string; index: number; isSelected: boolean }
    | { type: 'line-break'; key: string; index: number; isSelected: boolean }
    | { type: 'caret'; key: string; index: number }
  > = []
  const text = virtualInput.text
  const caret = virtualInput.caretPosition
  const selectionStart = virtualInput.selectionStart
  const selectionEnd = virtualInput.selectionEnd

  if (selectionCollapsed.value && virtualInput.isFocused && caret === 0) {
    nodes.push({ type: 'caret', key: 'caret-0', index: 0 })
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const isSelected = i >= selectionStart && i < selectionEnd

    if (char === '\n') {
      nodes.push({
        type: 'line-break',
        key: `lb-${i}`,
        index: i,
        isSelected
      })
    } else {
      nodes.push({
        type: 'char',
        key: `char-${i}`,
        char,
        index: i,
        isSelected
      })
    }

    if (
      selectionCollapsed.value &&
      virtualInput.isFocused &&
      caret === i + 1
    ) {
      nodes.push({ type: 'caret', key: `caret-${i + 1}`, index: i + 1 })
    }
  }

  if (selectionCollapsed.value && virtualInput.isFocused && caret === text.length) {
    nodes.push({ type: 'caret', key: `caret-${text.length}`, index: text.length })
  }

  return nodes
})

const getCharacterForKey = (key: KeyboardKey, preferShift = false) => {
  const base =
    activeLayoutName.value === 'japanese'
      ? key.label
      : key.value

  const shiftVariant =
    activeLayoutName.value === 'japanese'
      ? key.shiftLabel ?? key.label
      : key.shiftLabel ?? base

  const useShift = preferShift || isShiftActive.value
  const candidate = useShift ? shiftVariant : base
  return candidate ?? ''
}

const applyKeyToVirtualInput = (key: KeyboardKey) => {
  const value = key.value

  switch (value) {
    case 'Backspace':
      return deleteBackward()
    case 'Enter':
    case 'Return':
      replaceSelection('\n')
      return true
    case 'Tab':
      toggleJapaneseLayout()
      return true
    case ' ': // Space character
      replaceSelection(' ')
      return true
    case 'Space':
      replaceSelection(' ')
      return true
    case 'CapsLock':
    case 'ShiftLeft':
    case 'ShiftRight':
    case 'ControlLeft':
    case 'ControlRight':
    case 'AltLeft':
    case 'AltRight':
    case 'MetaLeft':
    case 'MetaRight':
      return false
    default:
      break
  }

  const char = getCharacterForKey(key)
  if (char && char.length > 0) {
    replaceSelection(char)
    return true
  }

  return false
}

const focusVirtualInput = () => {
  if (!virtualInput.isFocused) {
    virtualInput.isFocused = true
  }
  nextTick(() => {
    const element = virtualTextareaRef.value
    if (element && document.activeElement !== element) {
      element.focus()
    }
  })
}

const blurVirtualInput = () => {
  if (!virtualInput.isFocused) {
    return
  }
  virtualInput.isFocused = false
  selectionAnchor.value = virtualInput.caretPosition
  preferredColumn.value = null
  virtualTextareaRef.value?.blur()
}

const getIndexFromPointer = (event: PointerEvent) => {
  const element = document.elementFromPoint(event.clientX, event.clientY) as
    | HTMLElement
    | null
  const target = element?.closest('[data-index]') as HTMLElement | null

  if (!target) {
    return textLength.value
  }

  const index = Number(target.dataset.index)
  if (Number.isNaN(index)) {
    return textLength.value
  }

  if (target.classList.contains('virtual-char')) {
    const rect = target.getBoundingClientRect()
    const midpoint = rect.left + rect.width / 2
    if (event.clientX > midpoint) {
      return clampPosition(index + 1)
    }
    return clampPosition(index)
  }

  if (target.classList.contains('virtual-line-break')) {
    const rect = target.getBoundingClientRect()
    const midpointY = rect.top + rect.height / 2
    if (event.clientY > midpointY) {
      return clampPosition(index + 1)
    }
    return clampPosition(index)
  }

  return clampPosition(index)
}

const handleTextPointerDown = (event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  focusVirtualInput()

  const index = getIndexFromPointer(event)
  if (event.shiftKey) {
    extendSelectionTo(index)
  } else {
    collapseSelection(index)
  }

  textPointerSelection.value = { pointerId: event.pointerId, anchor: selectionAnchor.value }
  virtualTextareaRef.value?.setPointerCapture(event.pointerId)
}

const handleTextPointerMove = (event: PointerEvent) => {
  const state = textPointerSelection.value
  if (!state || state.pointerId !== event.pointerId) {
    return
  }
  event.preventDefault()
  const index = getIndexFromPointer(event)
  updateSelectionRange(state.anchor, index)
}

const finishPointerSelection = (event: PointerEvent) => {
  const state = textPointerSelection.value
  if (!state || state.pointerId !== event.pointerId) {
    return
  }
  virtualTextareaRef.value?.releasePointerCapture(event.pointerId)
  textPointerSelection.value = null
}

const handleTextPointerUp = (event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return
  }
  event.preventDefault()
  finishPointerSelection(event)
}

const handleTextPointerCancel = (event: PointerEvent) => {
  finishPointerSelection(event)
}

const documentPointerDown = (event: PointerEvent) => {
  const textareaEl = virtualTextareaRef.value
  const keyboardEl = keyboardRef.value
  if (!textareaEl) {
    return
  }
  const path = event.composedPath?.() ?? []
  if (path.length > 0) {
    if (path.includes(textareaEl) || (keyboardEl && path.includes(keyboardEl))) {
      return
    }
  } else {
    const targetNode = event.target as Node
    if (textareaEl.contains(targetNode)) {
      return
    }
    if (keyboardEl && keyboardEl.contains(targetNode)) {
      return
    }
  }
  blurVirtualInput()
}

const processVirtualInputKey = (
  event: KeyboardEvent,
  keyInfo: KeyboardKey | undefined
) => {
  if (!virtualInput.isFocused) {
    return false
  }

  const key = event.key
  const extend = event.shiftKey
  const meta = event.metaKey
  const ctrl = event.ctrlKey

  if (event.repeat && keyInfo && hasAlternates(keyInfo)) {
    event.preventDefault()
    return true
  }

  if (key === 'Tab') {
    return true
  }

  if ((meta || ctrl) && key.toLowerCase() === 'a') {
    event.preventDefault()
    selectAllText()
    return true
  }

  switch (key) {
    case 'Backspace':
      event.preventDefault()
      return deleteBackward()
    case 'Delete':
      event.preventDefault()
      return deleteForward()
    case 'Enter':
      event.preventDefault()
      replaceSelection('\n')
      return true
    case 'ArrowLeft':
      event.preventDefault()
      return moveCaretHorizontal('left', extend)
    case 'ArrowRight':
      event.preventDefault()
      return moveCaretHorizontal('right', extend)
    case 'ArrowUp':
      event.preventDefault()
      return moveCaretVertical('up', extend)
    case 'ArrowDown':
      event.preventDefault()
      return moveCaretVertical('down', extend)
    case 'Home':
      event.preventDefault()
      return moveCaretHome(extend)
    case 'End':
      event.preventDefault()
      return moveCaretEnd(extend)
    default:
      break
  }

  if (!meta && !ctrl && key.length === 1 && key !== 'Dead') {
    event.preventDefault()
    const char = keyInfo ? getCharacterForKey(keyInfo, event.shiftKey) : key
    replaceSelection(char)
    return true
  }

  return false
}

const hardwareActiveKeys = ref(new Set<string>())
const pointerActiveKeys = ref(new Set<string>())
const metaComboKeys = ref(new Set<string>())

type PointerState = {
  normalizedKey: string
  baseKey: KeyboardKey
  longPressTimer?: number
  longPressTriggered?: boolean
}

const pointerStates = new Map<number, PointerState>()

const LONG_PRESS_DELAY = 450

const activePopup = ref<
  | null
  | {
      baseKey: KeyboardKey
      alternates: ExtendedKeyOption[]
      position: { left: number; top: number }
    }
>(null)
const activePopupIndex = ref(0)

const keyElements = new WeakMap<KeyboardKey, HTMLElement>()
const registerKeyElement = (key: KeyboardKey, el: HTMLElement | null) => {
  if (!el) {
    keyElements.delete(key)
  } else {
    keyElements.set(key, el)
  }
}

const CONTROL_ICONS: Record<string, string> = {
  Backspace: '⌫',
  Tab: '↹',
  CapsLock: '⇪',
  Enter: '⏎',
  ShiftLeft: '⇧',
  ShiftRight: '⇧',
  ControlLeft: '⌃',
  ControlRight: '⌃',
  AltLeft: '⌥',
  AltRight: '⌥',
  MetaLeft: '⌘',
  MetaRight: '⌘',
  ' ': '␣'
}

const SHIFT_KEYS = ['ShiftLeft', 'ShiftRight']
const META_KEYS = ['MetaLeft', 'MetaRight']
const META_KEY_SET = new Set(META_KEYS.map((key) => normalizeKey(key)))

const mergeActiveKeys = () => {
  const merged = new Set<string>()
  hardwareActiveKeys.value.forEach((key) => merged.add(key))
  pointerActiveKeys.value.forEach((key) => merged.add(key))
  return merged
}

const activeKeys = computed(mergeActiveKeys)

const isMetaPressed = computed(() =>
  META_KEYS.some((key) => hardwareActiveKeys.value.has(normalizeKey(key)))
)

const updateKeySet = (current: Set<string>, key: string, pressed: boolean) => {
  const next = new Set(current)
  if (pressed) {
    next.add(key)
  } else {
    next.delete(key)
  }
  return next
}

const setHardwareKeyState = (key: string, pressed: boolean) => {
  const normalizedKey = normalizeKey(key)
  if (!allKeyValues.value.has(normalizedKey)) {
    return
  }
  hardwareActiveKeys.value = updateKeySet(
    hardwareActiveKeys.value,
    normalizedKey,
    pressed
  )
}

const setPointerKeyState = (key: string, pressed: boolean) => {
  const normalizedKey = normalizeKey(key)
  if (!allKeyValues.value.has(normalizedKey)) {
    return
  }
  pointerActiveKeys.value = updateKeySet(
    pointerActiveKeys.value,
    normalizedKey,
    pressed
  )
}

const resolveEventKey = (event: KeyboardEvent) => {
  const codeMatch = layoutCodeMap.value.get(event.code)
  if (codeMatch) {
    return codeMatch
  }

  const normalizedKey = normalizeKey(event.key)
  const keyMatch = layoutKeyMap.value.get(normalizedKey)
  if (keyMatch) {
    return keyMatch
  }

  return normalizedKey
}

const registerMetaComboKey = (normalizedKey: string) => {
  if (META_KEY_SET.has(normalizedKey)) {
    return
  }

  metaComboKeys.value = new Set(metaComboKeys.value).add(normalizedKey)
}

const clearMetaCombos = () => {
  if (metaComboKeys.value.size === 0) {
    return
  }
  const next = new Set(hardwareActiveKeys.value)
  metaComboKeys.value.forEach((comboKey) => next.delete(comboKey))
  hardwareActiveKeys.value = next
  metaComboKeys.value = new Set()
}

const hasAlternates = (key: KeyboardKey) => Boolean(key.alternates?.length)

const hasControlIcon = (key: KeyboardKey) =>
  Boolean(CONTROL_ICONS[normalizeKey(key.value)])

const getKeyStyle = (key: KeyboardKey) => ({
  gridColumn: `span ${Math.max(1, key.widthUnits ?? 1)}`
})

const isShiftActive = computed(() =>
  SHIFT_KEYS.some((shiftKey) => activeKeys.value.has(normalizeKey(shiftKey)))
)

const isKeyActive = (key: string) => activeKeys.value.has(normalizeKey(key))

const getDisplayLabel = (key: KeyboardKey) => {
  const normalizedValue = normalizeKey(key.value)
  const controlIcon = CONTROL_ICONS[normalizedValue]
  if (controlIcon) {
    return controlIcon
  }

  if (isShiftActive.value && key.shiftLabel) {
    return key.shiftLabel
  }

  return key.label
}

const openPopupForKey = (key: KeyboardKey, target: HTMLElement | null) => {
  if (!hasAlternates(key) || !target) {
    return
  }

  const rect = target.getBoundingClientRect()
  activePopup.value = {
    baseKey: key,
    alternates: key.alternates ?? [],
    position: {
      left: rect.left + rect.width / 2,
      top: rect.top
    }
  }
  activePopupIndex.value = 0
}

const closePopup = () => {
  activePopup.value = null
  activePopupIndex.value = 0
}

const cancelPointerState = (pointerId: number) => {
  const state = pointerStates.get(pointerId)
  if (!state) {
    return state
  }

  if (state.longPressTimer) {
    window.clearTimeout(state.longPressTimer)
  }

  pointerStates.delete(pointerId)
  return state
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (activePopup.value) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const total = activePopup.value.alternates.length
      if (total > 0) {
        const delta = event.key === 'ArrowLeft' ? -1 : 1
        activePopupIndex.value =
          (activePopupIndex.value + delta + total) % total
      }
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const option = activePopup.value.alternates[activePopupIndex.value]
      if (option) {
        selectAlternateOption(activePopup.value.baseKey, option)
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closePopup()
      return
    }
  }

  let toggledLayout = false
  if (event.key === 'Tab') {
    event.preventDefault()
    toggleJapaneseLayout()
    toggledLayout = true
  }

  const resolvedKey = resolveEventKey(event)
  const keyInfo = findKeyByNormalizedValue(resolvedKey)

  if (virtualInput.isFocused) {
    processVirtualInputKey(event, keyInfo)
  }

  if (event.metaKey) {
    event.preventDefault()
  }

  setHardwareKeyState(resolvedKey, true)

  if (toggledLayout) {
    return
  }

  if (
    event.repeat &&
    keyInfo &&
    hasAlternates(keyInfo) &&
    (!activePopup.value || activePopup.value.baseKey !== keyInfo)
  ) {
    const element = keyElements.get(keyInfo) ?? null
    openPopupForKey(keyInfo, element)
  }

  if (META_KEY_SET.has(resolvedKey)) {
    return
  }

  if (event.metaKey || isMetaPressed.value) {
    registerMetaComboKey(resolvedKey)
  }
}

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.metaKey) {
    event.preventDefault()
  }

  const resolvedKey = resolveEventKey(event)
  setHardwareKeyState(resolvedKey, false)

  if (
    activePopup.value &&
    normalizeKey(activePopup.value.baseKey.value) === resolvedKey
  ) {
    closePopup()
  }

  if (META_KEY_SET.has(resolvedKey)) {
    clearMetaCombos()
    return
  }

  if (metaComboKeys.value.has(resolvedKey)) {
    const next = new Set(metaComboKeys.value)
    next.delete(resolvedKey)
    metaComboKeys.value = next
  }
}

const handlePointerDown = (event: PointerEvent, key: KeyboardKey) => {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return
  }

  event.preventDefault()
  const target = event.currentTarget as HTMLElement | null
  target?.setPointerCapture(event.pointerId)

  const normalizedKey = normalizeKey(key.value)
  const state: PointerState = {
    normalizedKey,
    baseKey: key
  }

  if (hasAlternates(key)) {
    state.longPressTimer = window.setTimeout(() => {
      state.longPressTriggered = true
      openPopupForKey(key, target)
    }, LONG_PRESS_DELAY)
  }

  pointerStates.set(event.pointerId, state)
  setPointerKeyState(key.value, true)
}

const endPointerInteraction = (event: PointerEvent, key: KeyboardKey) => {
  const target = event.currentTarget as HTMLElement | null
  target?.releasePointerCapture(event.pointerId)

  const state = cancelPointerState(event.pointerId)

  if (!state?.longPressTriggered) {
    closePopup()
  }
  return state
}

const handlePointerUp = (event: PointerEvent, key: KeyboardKey) => {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return
  }
  event.preventDefault()
  const state = endPointerInteraction(event, key)
  setPointerKeyState(key.value, false)
  if (!state?.longPressTriggered) {
    focusVirtualInput()
    applyKeyToVirtualInput(key)
  }
}

const handlePointerLeave = (event: PointerEvent, key: KeyboardKey) => {
  endPointerInteraction(event, key)
  setPointerKeyState(key.value, false)
}

const handlePointerCancel = (event: PointerEvent, key: KeyboardKey) => {
  endPointerInteraction(event, key)
  setPointerKeyState(key.value, false)
}

const selectAlternateOption = (
  baseKey: KeyboardKey,
  option: ExtendedKeyOption
) => {
  focusVirtualInput()
  closePopup()
  if (virtualInput.isFocused) {
    replaceSelection(option.value)
  }
  setPointerKeyState(baseKey.value, true)
  window.setTimeout(() => setPointerKeyState(baseKey.value, false), 180)
}

const resetKeyboardState = () => {
  hardwareActiveKeys.value = new Set()
  pointerActiveKeys.value = new Set()
  metaComboKeys.value = new Set()
  pointerStates.forEach((state) => {
    if (state.longPressTimer) {
      window.clearTimeout(state.longPressTimer)
    }
  })
  pointerStates.clear()
  textPointerSelection.value = null
  closePopup()
}

const handleWindowBlur = () => {
  resetKeyboardState()
}

const detectMacOS = () => {
  if (typeof navigator === 'undefined') {
    return false
  }

  const platform = navigator.platform?.toLowerCase() ?? ''
  if (platform.includes('mac')) {
    return true
  }

  const userAgent = navigator.userAgent?.toLowerCase() ?? ''
  return userAgent.includes('mac os') || userAgent.includes('macintosh')
}

watch(
  allKeyValues,
  (allowedKeys) => {
    const filterKeys = (source: Set<string>) =>
      new Set(Array.from(source).filter((key) => allowedKeys.has(key)))

    hardwareActiveKeys.value = filterKeys(hardwareActiveKeys.value)
    pointerActiveKeys.value = filterKeys(pointerActiveKeys.value)
    metaComboKeys.value = filterKeys(metaComboKeys.value)
  },
  { immediate: true }
)

watch(keyboardRows, () => {
  resetKeyboardState()
})

onMounted(() => {
  if (detectMacOS()) {
    defaultLayoutName.value = 'macos'
    setActiveLayout('macos')
  } else {
    setActiveLayout('windows')
  }

  window.addEventListener('keydown', handleKeyDown, { passive: false })
  window.addEventListener('keyup', handleKeyUp, { passive: false })
  window.addEventListener('blur', handleWindowBlur)
  window.addEventListener('pointerdown', documentPointerDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('blur', handleWindowBlur)
  window.removeEventListener('pointerdown', documentPointerDown)
  resetKeyboardState()
})
</script>



<style scoped>
.page {
  padding: 4rem 1.5rem;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top, #f8fafc, #e2e8f0);
}

.keyboard-demo {
  width: min(960px, 100%);
  background-color: white;
  padding: 2.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 20px 45px -25px rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.3);
  display: grid;
  gap: 2rem;
}

.intro {
  text-align: center;
}

.intro h1 {
  font-size: clamp(2rem, 3vw, 2.75rem);
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.intro p {
  color: #475569;
  line-height: 1.8;
  margin: 0 auto;
  max-width: 36rem;
}

.virtual-textarea-section {
  display: grid;
  gap: 0.75rem;
}

.virtual-textarea-header h2 {
  font-size: clamp(1.2rem, 2.2vw, 1.5rem);
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.virtual-textarea-header p {
  margin: 0.15rem 0 0;
  font-size: 0.95rem;
  color: #64748b;
}

.virtual-textarea {
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  min-height: 8rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  cursor: text;
  outline: none;
}

.virtual-textarea.is-focused {
  border-color: rgba(59, 130, 246, 0.65);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
}

.virtual-textarea-content {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0;
  min-height: 6rem;
}

.virtual-placeholder {
  color: #94a3b8;
  font-size: 1rem;
}

.virtual-char {
  display: inline;
  position: relative;
  font-size: 1rem;
}

.virtual-char.is-selected {
  background: rgba(59, 130, 246, 0.3);
  color: #1e293b;
}

.virtual-line-break {
  display: block;
  height: 1.6em;
  line-height: 1.6em;
  font-size: 1rem;
}

.virtual-line-break.is-selected {
  background: rgba(59, 130, 246, 0.3);
  color: #1e293b;
}

.virtual-caret {
  position: relative;
  display: inline-block;
  width: 0;
  height: 1.6em;
  font-size: 1rem;
}

.virtual-caret::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #2563eb;
  animation: caret-blink 1.1s steps(1) infinite;
}

@keyframes caret-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}


.keyboard {
  --key-gap: clamp(0.35rem, 1.4vw, 0.6rem);
  --key-height: clamp(2.6rem, 5.8vw, 3.3rem);
  display: grid;
  gap: clamp(0.7rem, 2vw, 1.1rem);
  width: 100%;
  max-width: min(56rem, 100%);
  margin: 0 auto;
}

.keyboard-row {
  display: grid;
  grid-template-columns: repeat(16, minmax(0, 1fr));
  gap: var(--key-gap);
  justify-content: center;
}

.keyboard-key {
  position: relative;
  width: 100%;
  height: var(--key-height);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  color: #0f172a;
  font-size: clamp(0.9rem, 1.6vw, 1rem);
  font-weight: 600;
  cursor: default;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 12px 25px -20px rgba(15, 23, 42, 0.6);
  text-transform: none;
  transition: transform 0.12s ease, background-color 0.12s ease, box-shadow 0.12s ease;
}

.keyboard-key span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  pointer-events: none;
}

.keyboard-key.has-icon span {
  font-size: clamp(1.05rem, 2.1vw, 1.25rem);
}

.keyboard-key.is-active {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 12px 30px -18px rgba(37, 99, 235, 0.75);
  transform: translateY(2px);
}

.keyboard-key.is-space span {
  letter-spacing: 0.18em;
  font-size: clamp(0.85rem, 1.4vw, 0.95rem);
}

.keyboard-key.has-alternates::after {
  content: '';
  position: absolute;
  right: clamp(0.18rem, 1vw, 0.35rem);
  bottom: clamp(0.18rem, 1vw, 0.35rem);
  width: 0;
  height: 0;
  border-left: 0.35rem solid transparent;
  border-top: 0.35rem solid currentColor;
  opacity: 0.65;
}

.key-popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: auto;
  background: transparent;
}

.key-popup {
  position: absolute;
  transform: translate(-50%, -120%);
  display: flex;
  gap: 0.35rem;
  padding: 0.45rem 0.6rem;
  background: rgba(15, 23, 42, 0.92);
  border-radius: 0.75rem;
  box-shadow: 0 18px 28px -18px rgba(15, 23, 42, 0.7);
  pointer-events: auto;
}

.key-popup-option {
  border: none;
  background: transparent;
  color: white;
  font-weight: 600;
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  padding: 0.35rem 0.55rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.key-popup-option:hover,
.key-popup-option:focus-visible,
.key-popup-option.is-focused {
  background: rgba(255, 255, 255, 0.2);
}
</style>
