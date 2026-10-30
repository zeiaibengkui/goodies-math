export type FixedOddsItem = {
  label: string
  formula: string
  probability: number
  value: string
}

function factorial(value: number) {
  let result = 1
  for (let factor = 2; factor <= value; factor += 1) result *= factor
  return result
}

const distinctSequences = factorial(10)
const allSequences = 10 ** 10

export const FIXED_ODDS: FixedOddsItem[] = [
  {
    label: '至少出现一个 8',
    formula: '1 - \\left(\\frac{9}{10}\\right)^{10}',
    probability: 1 - 0.9 ** 10,
    value: '65.13%'
  },
  {
    label: '至少一对数字重复',
    formula: '1 - \\frac{10!}{10^{10}}',
    probability: 1 - distinctSequences / allSequences,
    value: '99.96%'
  },
  {
    label: '十位数字全部不同',
    formula: '\\frac{10!}{10^{10}}',
    probability: distinctSequences / allSequences,
    value: '0.0363%'
  },
  {
    label: '十位号码是回文',
    formula: '\\frac{10^5}{10^{10}}',
    probability: 10 ** 5 / allSequences,
    value: '0.001%'
  }
]

export const REAL_INFORMATION_BITS = -Math.log2(0.1 ** 10)

export function selfInformationBits(probability: number) {
  return -Math.log2(probability)
}

export const LUCKY_INFORMATION_BITS = FIXED_ODDS.reduce(
  (total, item) => total + selfInformationBits(item.probability),
  0
)

export const LUCKY_RATIO = LUCKY_INFORMATION_BITS / REAL_INFORMATION_BITS
