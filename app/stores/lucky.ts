import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createLcg,
  DIGIT_DISTRIBUTIONS,
  hashSeed,
  sampleFromDistribution,
  type DigitDistributionId
} from '~/utils/distributions'
import { SAMPLE_DIGITS } from '~/utils/lucky'

export type RevealSource = 'sample' | 'random' | 'custom'

export type SeedMeta = {
  seed: number
  healthMs: number
  timestamp: number
  userAgent: string
  timezone: string
  hashInput: string
}

export const useLuckyStore = defineStore('lucky', () => {
  const digits = ref([...SAMPLE_DIGITS])
  const source = ref<RevealSource>('sample')
  const drawCount = ref(0)
  const isDrawing = ref(false)
  const digitDistributions = ref<DigitDistributionId[]>(
    Array.from({ length: 10 }, () => 'uniform')
  )
  const seedMeta = ref<SeedMeta | null>(null)
  let drawTimer: ReturnType<typeof setTimeout> | undefined
  let rng: (() => number) | null = null

  const number = computed(() => digits.value.join(''))
  const digitSum = computed(() => digits.value.reduce((total, digit) => total + digit, 0))
  const distinctCount = computed(() => new Set(digits.value).size)
  const eightCount = computed(() => digits.value.filter((digit) => digit === 8).length)
  const oddCount = computed(() => digits.value.filter((digit) => digit % 2 === 1).length)
  const hasCustomDistributions = computed(() =>
    digitDistributions.value.some((distribution) => distribution !== 'uniform')
  )

  const drawLabel = computed(() => {
    if (source.value === 'sample') return 'SAMPLE 000'
    const serial = String(drawCount.value).padStart(3, '0')
    return source.value === 'custom' ? `CUSTOM ${serial}` : `DRAW ${serial}`
  })

  const ticketStatus = computed(() => {
    if (source.value === 'custom') return 'YOUR PICK'
    if (source.value === 'random') return 'JUST DRAWN'
    return 'SAMPLE'
  })

  const sourceLabel = computed(() => {
    if (source.value === 'custom') return 'CUSTOM / 自选号码'
    if (source.value === 'random') return 'RANDOM / 系统开号'
    return 'SAMPLE / 示例号码'
  })

  function reveal(nextDigits: number[], nextSource: RevealSource) {
    if (nextDigits.length !== 10) return

    digits.value = [...nextDigits]
    source.value = nextSource
    drawCount.value += 1
  }

  function setDigit(index: number, digit: number) {
    if (index < 0 || index >= digits.value.length) return
    if (!Number.isInteger(digit) || digit < 0 || digit > 9) return
    digits.value = digits.value.map((current, position) => (position === index ? digit : current))
    source.value = 'custom'
  }

  function setDigitDistribution(index: number, distribution: DigitDistributionId) {
    if (index < 0 || index >= digitDistributions.value.length) return
    if (!DIGIT_DISTRIBUTIONS[distribution]) return
    digitDistributions.value[index] = distribution
  }

  function setAllDistributions(distribution: DigitDistributionId) {
    if (!DIGIT_DISTRIBUTIONS[distribution]) return
    digitDistributions.value = digitDistributions.value.map(() => distribution)
  }

  async function seedRng(force = false) {
    if (import.meta.server) return

    if (rng && !force) return

    const started = performance.now()
    let healthNow = 0

    try {
      const health = await $fetch<{ now: number }>('/api/health', {
        signal: AbortSignal.timeout(1500)
      })
      healthNow = health.now
    } catch {
      healthNow = 0
    }

    const healthMs = Math.max(0, Math.round(performance.now() - started))
    const timestamp = Date.now()
    const userAgent = navigator.userAgent
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'
    const screenInfo = `${window.screen.width}x${window.screen.height}`
    const randomValues = globalThis.crypto?.getRandomValues
      ? Array.from(globalThis.crypto.getRandomValues(new Uint32Array(4))).join(',')
      : `${Math.random()}-${Math.random()}`
    const hashInput = [
      healthNow,
      healthMs,
      timestamp,
      userAgent,
      timezone,
      screenInfo,
      randomValues
    ].join('|')
    const seed = hashSeed(hashInput)

    seedMeta.value = {
      seed,
      healthMs,
      timestamp,
      userAgent,
      timezone,
      hashInput
    }
    rng = createLcg(seed)
  }

  async function reseed() {
    await seedRng(true)
    return seedMeta.value
  }

  function nextUnit() {
    return rng ? rng() : 0.5
  }

  function sampleDigits() {
    if (!rng) return null

    return digitDistributions.value.map((distribution) => {
      const probabilities = DIGIT_DISTRIBUTIONS[distribution].probabilities
      return sampleFromDistribution(probabilities, nextUnit())
    })
  }

  async function draw() {
    if (isDrawing.value) return null

    isDrawing.value = true

    try {
      if (!rng) await seedRng()

      const nextDigits = sampleDigits()
      if (!nextDigits) {
        isDrawing.value = false
        return null
      }

      return await new Promise<number[] | null>((resolve) => {
        drawTimer = setTimeout(() => {
          reveal(nextDigits, 'random')
          isDrawing.value = false
          drawTimer = undefined
          resolve(nextDigits)
        }, 320)
      })
    } catch {
      isDrawing.value = false
      return null
    }
  }

  function cancelDraw() {
    if (drawTimer) clearTimeout(drawTimer)
    drawTimer = undefined
    isDrawing.value = false
  }

  return {
    digits,
    source,
    drawCount,
    isDrawing,
    digitDistributions,
    seedMeta,
    number,
    digitSum,
    distinctCount,
    eightCount,
    oddCount,
    hasCustomDistributions,
    drawLabel,
    ticketStatus,
    sourceLabel,
    reveal,
    setDigit,
    setDigitDistribution,
    setAllDistributions,
    seedRng,
    reseed,
    nextUnit,
    draw,
    cancelDraw
  }
})
