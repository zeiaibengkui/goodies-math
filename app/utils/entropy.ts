export type FixedOddsItem = {
  label: string
  formula: string
  probability: number
  value: string
  matches: (digits: number[]) => boolean
}

function factorial(value: number) {
  let result = 1
  for (let factor = 2; factor <= value; factor += 1) result *= factor
  return result
}

function hasRepeat(digits: number[]) {
  return new Set(digits).size < digits.length
}

function isPalindrome(digits: number[]) {
  return digits.every((digit, index) => digit === digits[digits.length - 1 - index])
}

const distinctSequences = factorial(10)
const allSequences = 10 ** 10

export const FIXED_ODDS: FixedOddsItem[] = [
  {
    label: '至少出现一个 8',
    formula: '1 - \\left(\\frac{9}{10}\\right)^{10}',
    probability: 1 - 0.9 ** 10,
    value: '65.13%',
    matches: (digits) => digits.includes(8)
  },
  {
    label: '至少一对数字重复',
    formula: '1 - \\frac{10!}{10^{10}}',
    probability: 1 - distinctSequences / allSequences,
    value: '99.96%',
    matches: hasRepeat
  },
  {
    label: '十位数字全部不同',
    formula: '\\frac{10!}{10^{10}}',
    probability: distinctSequences / allSequences,
    value: '0.0363%',
    matches: (digits) => !hasRepeat(digits)
  },
  {
    label: '十位号码是回文',
    formula: '\\frac{10^5}{10^{10}}',
    probability: 10 ** 5 / allSequences,
    value: '0.001%',
    matches: isPalindrome
  }
]

export const REAL_INFORMATION_BITS = -Math.log2(0.1 ** 10)

export function selfInformationBits(probability: number) {
  return -Math.log2(probability)
}

export type LuckyInformation = {
  bits: number
  best: FixedOddsItem | null
  matched: FixedOddsItem[]
}

export function analyzeLuckyInformation(digits: number[]): LuckyInformation {
  const matched = FIXED_ODDS.filter((item) => item.matches(digits))
  const best = matched.reduce<FixedOddsItem | null>((current, item) => {
    if (!current) return item
    return selfInformationBits(item.probability) > selfInformationBits(current.probability)
      ? item
      : current
  }, null)

  return {
    bits: best ? selfInformationBits(best.probability) : 0,
    best,
    matched
  }
}
