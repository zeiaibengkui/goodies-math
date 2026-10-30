export type DigitDistributionId = 'uniform' | 'binomial' | 'poisson' | 'normal'

export type DigitDistribution = {
  id: DigitDistributionId
  name: string
  shortName: string
  description: string
  probabilities: number[]
}

const DIGIT_COUNT = 10

function normalize(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0)
  return values.map((value) => value / total)
}

function combinations(n: number, k: number) {
  let result = 1
  for (let index = 1; index <= k; index += 1) {
    result = (result * (n - k + index)) / index
  }
  return result
}

function buildBinomialProbabilities(trials: number, probability: number) {
  return Array.from({ length: DIGIT_COUNT }, (_, successes) => {
    const failures = trials - successes
    if (failures < 0) return 0
    return combinations(trials, successes) * probability ** successes * (1 - probability) ** failures
  })
}

function buildPoissonProbabilities(lambda: number) {
  const raw = Array.from({ length: DIGIT_COUNT }, (_, value) => {
    let factorial = 1
    for (let index = 2; index <= value; index += 1) factorial *= index
    return Math.exp(-lambda) * lambda ** value / factorial
  })
  return normalize(raw)
}

function erf(value: number) {
  const sign = value < 0 ? -1 : 1
  const x = Math.abs(value)
  const t = 1 / (1 + 0.3275911 * x)
  const polynomial =
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t
  return sign * (1 - polynomial * Math.exp(-x * x))
}

function normalCdf(value: number, mean: number, deviation: number) {
  return 0.5 * (1 + erf((value - mean) / (deviation * Math.SQRT2)))
}

function buildNormalProbabilities(mean: number, deviation: number) {
  const raw = Array.from({ length: DIGIT_COUNT }, (_, value) => {
    const low = value === 0 ? Number.NEGATIVE_INFINITY : value - 0.5
    const high = value === DIGIT_COUNT - 1 ? Number.POSITIVE_INFINITY : value + 0.5
    return normalCdf(high, mean, deviation) - normalCdf(low, mean, deviation)
  })
  return normalize(raw)
}

export const DIGIT_DISTRIBUTIONS: Record<DigitDistributionId, DigitDistribution> = {
  uniform: {
    id: 'uniform',
    name: '均匀 U(0,9)',
    shortName: '均匀',
    description: '每位 0–9 等概率，均值 4.5。',
    probabilities: Array.from({ length: DIGIT_COUNT }, () => 1 / DIGIT_COUNT)
  },
  binomial: {
    id: 'binomial',
    name: '二项 B(9, 0.5)',
    shortName: '二项',
    description: '9 次独立硬币；正面数落到 0–9。',
    probabilities: buildBinomialProbabilities(9, 0.5)
  },
  poisson: {
    id: 'poisson',
    name: '泊松 P(4.5)',
    shortName: '泊松',
    description: 'λ=4.5，按 0–9 截断归一化。',
    probabilities: buildPoissonProbabilities(4.5)
  },
  normal: {
    id: 'normal',
    name: '正态 N(4.5, 2²)',
    shortName: '正态',
    description: 'N(4.5, 2²) 离散到 0–9 的区间。',
    probabilities: buildNormalProbabilities(4.5, 2)
  }
}

export const DISTRIBUTION_OPTIONS = (
  Object.keys(DIGIT_DISTRIBUTIONS) as DigitDistributionId[]
).map((id) => ({
  id,
  name: DIGIT_DISTRIBUTIONS[id].name,
  shortName: DIGIT_DISTRIBUTIONS[id].shortName
}))

export function sampleFromDistribution(probabilities: number[], unit: number) {
  let cumulative = 0
  for (let digit = 0; digit < probabilities.length; digit += 1) {
    cumulative += probabilities[digit] ?? 0
    if (unit < cumulative) return digit
  }
  return probabilities.length - 1
}

export function hashSeed(input: string) {
  let hash = 1779033703 ^ input.length

  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353)
    hash = (hash << 13) | (hash >>> 19)
  }

  hash = Math.imul(hash ^ (hash >>> 16), 2246822507)
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909)
  return (hash ^ (hash >>> 16)) >>> 0
}

export function createLcg(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
