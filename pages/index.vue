<template>
  <main class="page">
    <section class="keyboard-demo">
      <header class="intro">
        <h1>虚拟键盘演示</h1>
        <p>按下物理键盘上的按键，观察下方虚拟键盘上对应按键的高亮效果。</p>
      </header>

      <div class="keyboard" role="presentation">
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
            :class="{ 'is-active': isKeyActive(keyInfo.value) }"
            :aria-pressed="isKeyActive(keyInfo.value)"
            disabled
          >
            <span>{{ keyInfo.label }}</span>
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type KeyboardKey = {
  label: string
  value: string
}

type KeyboardRow = KeyboardKey[]

const keyboardRows: KeyboardRow[] = [
  [
    { label: '`', value: '`' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '0', value: '0' },
    { label: '-', value: '-' },
    { label: '=', value: '=' },
    { label: 'Backspace', value: 'Backspace' }
  ],
  [
    { label: 'Tab', value: 'Tab' },
    { label: 'Q', value: 'q' },
    { label: 'W', value: 'w' },
    { label: 'E', value: 'e' },
    { label: 'R', value: 'r' },
    { label: 'T', value: 't' },
    { label: 'Y', value: 'y' },
    { label: 'U', value: 'u' },
    { label: 'I', value: 'i' },
    { label: 'O', value: 'o' },
    { label: 'P', value: 'p' },
    { label: '[', value: '[' },
    { label: ']', value: ']' },
    { label: '\\', value: '\\' }
  ],
  [
    { label: 'Caps', value: 'CapsLock' },
    { label: 'A', value: 'a' },
    { label: 'S', value: 's' },
    { label: 'D', value: 'd' },
    { label: 'F', value: 'f' },
    { label: 'G', value: 'g' },
    { label: 'H', value: 'h' },
    { label: 'J', value: 'j' },
    { label: 'K', value: 'k' },
    { label: 'L', value: 'l' },
    { label: ';', value: ';' },
    { label: '\'', value: '\'' },
    { label: 'Enter', value: 'Enter' }
  ],
  [
    { label: 'Shift', value: 'Shift' },
    { label: 'Z', value: 'z' },
    { label: 'X', value: 'x' },
    { label: 'C', value: 'c' },
    { label: 'V', value: 'v' },
    { label: 'B', value: 'b' },
    { label: 'N', value: 'n' },
    { label: 'M', value: 'm' },
    { label: ',', value: ',' },
    { label: '.', value: '.' },
    { label: '/', value: '/' },
    { label: 'Shift', value: 'Shift' }
  ],
  [
    { label: 'Ctrl', value: 'Control' },
    { label: 'Alt', value: 'Alt' },
    { label: 'Space', value: ' ' },
    { label: 'Alt', value: 'Alt' },
    { label: 'Ctrl', value: 'Control' }
  ]
]

const normalizeKey = (key: string) => {
  if (key.length === 1) {
    return key.toLowerCase()
  }

  return key
}

const allKeyValues = new Set(
  keyboardRows.flatMap((row) => row.map((key) => normalizeKey(key.value)))
)

const activeKeys = ref(new Set<string>())

const setKeyState = (key: string, pressed: boolean) => {
  const normalizedKey = normalizeKey(key)
  if (!allKeyValues.has(normalizedKey)) {
    return
  }
  const next = new Set(activeKeys.value)

  if (pressed) {
    next.add(normalizedKey)
  } else {
    next.delete(normalizedKey)
  }

  activeKeys.value = next
}

const handleKeyDown = (event: KeyboardEvent) => {
  setKeyState(event.key, true)
}

const handleKeyUp = (event: KeyboardEvent) => {
  setKeyState(event.key, false)
}

const handleWindowBlur = () => {
  activeKeys.value = new Set()
}

const isKeyActive = (key: string) => activeKeys.value.has(normalizeKey(key))

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', handleWindowBlur)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('blur', handleWindowBlur)
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
  width: min(900px, 100%);
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

.keyboard {
  display: grid;
  gap: 0.75rem;
}

.keyboard-row {
  display: grid;
  grid-auto-flow: column;
  justify-content: center;
  gap: 0.5rem;
}

.keyboard-key {
  position: relative;
  padding: 0.85rem 1.1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: default;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 12px 25px -20px rgba(15, 23, 42, 0.6);
  min-width: 3rem;
  text-transform: uppercase;
  transition: transform 0.12s ease, background-color 0.12s ease, box-shadow 0.12s ease;
}

.keyboard-key[disabled] {
  cursor: default;
}

.keyboard-key span {
  display: block;
  pointer-events: none;
}

.keyboard-key.is-active {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 12px 30px -18px rgba(37, 99, 235, 0.75);
  transform: translateY(2px);
}

.keyboard-row:first-child .keyboard-key:first-child,
.keyboard-row:first-child .keyboard-key:nth-last-child(1) {
  min-width: 4.25rem;
}

.keyboard-row:nth-child(2) .keyboard-key:first-child,
.keyboard-row:nth-child(3) .keyboard-key:first-child,
.keyboard-row:nth-child(4) .keyboard-key:first-child,
.keyboard-row:nth-child(4) .keyboard-key:last-child,
.keyboard-row:last-child .keyboard-key:first-child,
.keyboard-row:last-child .keyboard-key:nth-last-child(1) {
  min-width: 4.75rem;
  text-transform: none;
}

.keyboard-row:last-child .keyboard-key:nth-child(3) {
  min-width: 18rem;
}

@media (max-width: 640px) {
  .keyboard-demo {
    padding: 1.75rem;
  }

  .keyboard-key {
    padding: 0.6rem 0.75rem;
    min-width: 2.4rem;
    font-size: 0.85rem;
  }

  .keyboard-row:last-child .keyboard-key:nth-child(3) {
    min-width: 12rem;
  }
}
</style>
