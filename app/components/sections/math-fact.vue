<script setup lang="ts">
import MathFormula from '~/components/math/math-formula.vue'
import ProbabilityChart from '~/components/math/probability-chart.vue'
import type { DistributionPoint, FactDistribution } from '~/types/probability'
import { FIXED_ODDS } from '~/utils/entropy'
import { formatPercent } from '~/utils/format'
import { analyzeLucky } from '~/utils/lucky'
import { useLuckyStore } from '~/stores/lucky'

type Fact = {
  eyebrow: string
  title: string
  metricLabel: string
  metricValue: string
  metricNote: string
  statement: string
  formula: string
  reading: string
  distribution: FactDistribution
}

type FactBuilder = (draw: number[]) => Fact

type BasePoint = Pick<DistributionPoint, 'x' | 'probability'>

type DistributionOptions = {
  xLabel: string
  eventLabel: string
  points: BasePoint[]
  current: number
  currentLabel: string
  note: string
  isEvent: (x: number) => boolean
  marker?: {
    value: number
    label: string
  }
}

const FACT_COUNT = 7
const lucky = useLuckyStore()
const activeFactIndex = ref(0)
const lastFactIndex = ref(0)

function combinations(n: number, k: number) {
  let result = 1
  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - k + i)) / i
  }
  return result
}

function factorial(n: number) {
  let result = 1
  for (let i = 2; i <= n; i += 1) result *= i
  return result
}

function stirlingSecondKind(n: number, k: number) {
  const table = Array.from({ length: n + 1 }, () => Array<number>(n + 1).fill(0))
  table[0]![0] = 1

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= i; j += 1) {
      table[i]![j] = j * table[i - 1]![j]! + table[i - 1]![j - 1]!
    }
  }

  return table[n]![k]!
}

function buildBinomialDistribution(trials: number, probability: number): BasePoint[] {
  return Array.from({ length: trials + 1 }, (_, successes) => ({
    x: successes,
    probability:
      combinations(trials, successes) * probability ** successes * (1 - probability) ** (trials - successes)
  }))
}

function buildDistinctDistribution(): BasePoint[] {
  return Array.from({ length: 10 }, (_, index) => {
    const kinds = index + 1
    const sequences = combinations(10, kinds) * factorial(kinds) * stirlingSecondKind(10, kinds)
    return { x: kinds, probability: sequences / 10 ** 10 }
  })
}

function buildSumDistribution(): BasePoint[] {
  let counts = [1]

  for (let position = 0; position < 10; position += 1) {
    const next = Array<number>(counts.length + 9).fill(0)
    counts.forEach((count, sum) => {
      if (!count) return
      for (let digit = 0; digit <= 9; digit += 1) {
        next[sum + digit] = (next[sum + digit] ?? 0) + count
      }
    })
    counts = next
  }

  return counts.map((count, sum) => ({ x: sum, probability: count / 10 ** 10 }))
}

function buildDescentDistribution(): BasePoint[] {
  let counts = Array.from({ length: 10 }, () => Array<number>(10).fill(0))
  for (let digit = 0; digit <= 9; digit += 1) counts[digit]![0] = 1

  for (let length = 2; length <= 10; length += 1) {
    const next = Array.from({ length: 10 }, () => Array<number>(10).fill(0))
    for (let last = 0; last <= 9; last += 1) {
      for (let descents = 0; descents < length; descents += 1) {
        const count = counts[last]![descents]!
        if (!count) continue
        for (let digit = 0; digit <= 9; digit += 1) {
          const nextDescents = descents + (last > digit ? 1 : 0)
          next[digit]![nextDescents] = (next[digit]![nextDescents] ?? 0) + count
        }
      }
    }
    counts = next
  }

  return Array.from({ length: 10 }, (_, descents) => ({
    x: descents,
    probability: counts.reduce((total, endings) => total + endings[descents]!, 0) / 10 ** 10
  }))
}

const BINOMIAL_TEN = buildBinomialDistribution(10, 0.1)
const BINOMIAL_FIVE = buildBinomialDistribution(5, 0.1)
const DISTINCT_DISTRIBUTION = buildDistinctDistribution()
const SUM_DISTRIBUTION = buildSumDistribution()
const DESCENT_DISTRIBUTION = buildDescentDistribution()

function makeDistribution(options: DistributionOptions): FactDistribution {
  return {
    xLabel: options.xLabel,
    eventLabel: options.eventLabel,
    points: options.points.map((point) => ({ ...point, isEvent: options.isEvent(point.x) })),
    current: options.current,
    currentLabel: options.currentLabel,
    note: options.note,
    ...(options.marker ? { marker: options.marker } : {})
  }
}

const factBuilders: FactBuilder[] = [
  (draw) => {
    const eights = draw.filter((digit) => digit === 8).length
    const distribution = makeDistribution({
      xLabel: '8 的个数 X',
      eventLabel: 'X ≥ 1',
      points: BINOMIAL_TEN,
      current: eights,
      currentLabel: `本注：${eights} 个 8`,
      note: '柱高为十位中恰好出现 k 个 8 的概率；黄色为至少出现一个 8 的事件区间，红色为本注。',
      marker: { value: 1, label: 'E[X] = 1' },
      isEvent: (value) => value >= 1
    })

    return {
      eyebrow: '组合概率 / COMBINATORICS',
      title: '至少一个 8',
      metricLabel: '十位中至少出现一个 8 的概率',
      metricValue: '65.13%',
      metricNote: '1 − (9/10)^10',
      statement:
        '把十位数字看作 10 次独立且均匀的抽取。一个 8 都不出现的概率是 (9/10)^10 ≈ 34.87%，所以至少出现一个 8 的概率约为 65.13%。',
      formula: 'P(X \\ge 1) = 1 - \\left(\\frac{9}{10}\\right)^{10} \\approx 0.6513215599',
      reading:
        eights > 0
          ? `本注出现了 ${eights} 个 8。它命中了一个约 65% 的常见事件，并不是“必中信号”。`
          : '本注没有 8，落在 34.87% 的补集里。随机事件不欠任何人一个 8。',
      distribution
    }
  },
  (draw) => {
    const distinct = new Set(draw).size
    const distribution = makeDistribution({
      xLabel: '不同数字个数 D',
      eventLabel: 'D ≤ 9',
      points: DISTINCT_DISTRIBUTION,
      current: distinct,
      currentLabel: `本注：${distinct} 种数字`,
      note: '柱高为十位中恰好出现 D 种不同数字的概率；黄色为至少一对重复的区间，红色为本注。',
      isEvent: (value) => value <= 9
    })

    return {
      eyebrow: '生日悖论 / PIGEONHOLE',
      title: '几乎必然撞号',
      metricLabel: '十位中至少一对数字相同的概率',
      metricValue: '99.96%',
      metricNote: '1 − 10!/10^10',
      statement:
        '十位数字互不相同的排列只有 10! 种。与全部 10^10 个等可能序列相比，全部不同的概率仅 0.036288%，于是至少一对重复的概率高达 99.963712%。',
      formula: 'P(D \\le 9) = 1 - \\frac{10!}{10^{10}} \\approx 0.99963712',
      reading: `本注有 ${distinct} 种不同的数字。重复不是意外，而是概率意义上的默认剧本。`,
      distribution
    }
  },
  (draw) => {
    const eights = draw.filter((digit) => digit === 8).length
    const probability = combinations(10, eights) * 0.1 ** eights * 0.9 ** (10 - eights)
    const distribution = makeDistribution({
      xLabel: '8 的个数 X',
      eventLabel: `X = ${eights}`,
      points: BINOMIAL_TEN,
      current: eights,
      currentLabel: `本注：${eights} 个 8`,
      note: `柱高为恰好出现 k 个 8 的概率；红色柱是本注，也是事件 X = ${eights} 的取值。`,
      marker: { value: 1, label: 'E[X] = 1' },
      isEvent: (value) => value === eights
    })

    return {
      eyebrow: '二项分布 / BINOMIAL',
      title: '8 的个数分布',
      metricLabel: `恰好有 ${eights} 个 8 的概率`,
      metricValue: formatPercent(probability),
      metricNote: 'X ~ B(10, 0.1)',
      statement: `每位是否为 8 是一次 p = 0.1 的伯努利试验，所以 8 的个数 X 服从二项分布 B(10, 0.1)。本注有 ${eights} 个 8。`,
      formula: 'P(X = k) = \\binom{10}{k} (0.1)^k (0.9)^{10-k}',
      reading: `8 的期望个数是 10 × 0.1 = 1。最常见的个数也是 1 个，概率约 38.74%；本注是 ${eights} 个。`,
      distribution
    }
  },
  (draw) => {
    const total = draw.reduce((sum, digit) => sum + digit, 0)
    const gap = total - 45
    const direction = gap === 0 ? '正好落在期望中心' : gap > 0 ? `高于期望 ${gap}` : `低于期望 ${Math.abs(gap)}`
    const distribution = makeDistribution({
      xLabel: '十位数字之和 S',
      eventLabel: '36 ≤ S ≤ 54',
      points: SUM_DISTRIBUTION,
      current: total,
      currentLabel: `本注：S = ${total}`,
      note: '柱高为 S 取该值的概率；黄色为均值 ±1 个标准差的常见区间，黑线标出期望 45，红色为本注。',
      marker: { value: 45, label: 'E[S] = 45' },
      isEvent: (value) => value >= 36 && value <= 54
    })

    return {
      eyebrow: '期望与方差 / EXPECTATION',
      title: '45 只是一个中心',
      metricLabel: '十位数字之和的期望值',
      metricValue: '45',
      metricNote: 'E[X] = 10 × 4.5',
      statement:
        '每个数字的期望是 4.5。由期望的线性性，十位数字之和的期望是 10 × 4.5 = 45；单个数字的方差为 8.25，因此总和的标准差是 √82.5 ≈ 9.08。',
      formula:
        '\\begin{aligned} \\mathbb{E}[S] &= 10 \\times 4.5 = 45, \\\\ \\operatorname{SD}(S) &= \\sqrt{10 \\times 8.25} \\approx 9.08 \\end{aligned}',
      reading: `本注数字之和是 ${total}，${direction}。一次偏离期望值，并不证明随机数有记忆。`,
      distribution
    }
  },
  (draw) => {
    const palindrome = draw.join('') === [...draw].reverse().join('')
    const mirrorMatches = draw.reduce((count, digit, index) => {
      if (index >= 5) return count
      return draw[9 - index] === digit ? count + 1 : count
    }, 0)
    const distribution = makeDistribution({
      xLabel: '镜像位置匹配对数 M',
      eventLabel: 'M = 5',
      points: BINOMIAL_FIVE,
      current: mirrorMatches,
      currentLabel: `本注：${mirrorMatches} / 5 对匹配`,
      note: '5 对镜像位置逐对比较，每对匹配的概率为 1/10；黄色为回文事件 M=5，红色为本注。',
      isEvent: (value) => value === 5
    })

    return {
      eyebrow: '对称性 / SYMMETRY',
      title: '镜像的稀有性',
      metricLabel: '十位号码是回文串的概率',
      metricValue: '0.001%',
      metricNote: '10^5 / 10^10 = 1/100000',
      statement:
        '一个十位回文串由前 5 位完全决定：后 5 位必须依次是前 5 位的镜像。因此回文串共有 10^5 个，占全体 10^10 个序列的十万分之一。',
      formula: 'P(\\mathrm{pal}) = \\frac{10^5}{10^{10}} = 10^{-5} = 0.001\\%',
      reading: palindrome
        ? '本注正好是回文串，撞上了约十万分之一的对称。'
        : '本注不是回文串；把号码倒过来，它并不会保持原样。',
      distribution
    }
  },
  (draw) => {
    const nondecreasing = draw.every((digit, index) => index === 0 || draw[index - 1]! <= digit)
    const descents = draw.reduce(
      (count, digit, index) => (index > 0 && draw[index - 1]! > digit ? count + 1 : count),
      0
    )
    const distribution = makeDistribution({
      xLabel: '相邻下降次数 D',
      eventLabel: 'D = 0',
      points: DESCENT_DISTRIBUTION,
      current: descents,
      currentLabel: `本注：${descents} 次下降`,
      note: '柱高为相邻数字出现严格下降（前一位大于后一位）的次数分布；黄色为 D=0，即非降序事件，红色为本注。',
      isEvent: (value) => value === 0
    })

    return {
      eyebrow: '隔板法 / STARS & BARS',
      title: '非降序的秩序',
      metricLabel: '数字从左到右不下降的概率',
      metricValue: '0.000924%',
      metricNote: 'C(19, 10) / 10^10',
      statement:
        '从 0–9 中有放回地取 10 个数并排成一列，非降序列的数量等于“10 类中可重复取 10 个”的组合数 C(19, 10) = 92,378。它只占全部 10^10 个序列的极小一部分。',
      formula: 'P(D = 0) = \\frac{\\binom{19}{10}}{10^{10}} \\approx 0.00092378\\%',
      reading: nondecreasing
        ? '本注从左到右没有下降，命中了约十万分之一的秩序。'
        : '本注不是非降序列。真正的随机序列，通常都会上下起伏。',
      distribution
    }
  },
  (draw) => {
    const fives = draw.filter((digit) => digit === 5).length
    const distribution = makeDistribution({
      xLabel: '5 的个数 X',
      eventLabel: 'X ≥ 1',
      points: BINOMIAL_TEN,
      current: fives,
      currentLabel: `本注：${fives} 个 5`,
      note: '柱高为十位中恰好出现 k 个 5 的概率；黄色为至少出现一个 5 的事件区间，红色为本注。',
      marker: { value: 1, label: 'E[X] = 1' },
      isEvent: (value) => value >= 1
    })

    return {
      eyebrow: '五福 / FIVE',
      title: '5 的个数分布',
      metricLabel: '十位中至少出现一个 5 的概率',
      metricValue: '65.13%',
      metricNote: '1 − (9/10)^10',
      statement:
        '5 是第三个质数，也是斐波那契数列的第五项。十进制中每一位独立地以 1/10 的概率取到 5，所以 5 的个数 X 服从二项分布 B(10, 0.1)。',
      formula: 'P(X \\ge 1) = 1 - \\left(\\frac{9}{10}\\right)^{10} \\approx 0.6513215599',
      reading:
        fives > 0
          ? `本注有 ${fives} 个 5；至少一个 5 并不罕见，真正罕见的是它恰好落在你的号码里。`
          : '本注没有 5；十位中一个 5 都不出现的概率约为 34.87%，这同样是一种正常的随机。',
      distribution
    }
  }
]

function pickNextFactIndex() {
  const offset = 1 + Math.floor(lucky.nextUnit() * (FACT_COUNT - 1))
  const next = (lastFactIndex.value + offset) % FACT_COUNT
  lastFactIndex.value = next
  return next
}

function factIndexForDigits(draw: number[]) {
  const topTag = analyzeLucky(draw).signals[0]?.tag
  const linkedFacts: Record<string, number> = {
    照见: 4,
    上行: 5,
    双八: 2,
    八方: 2,
    机遇: 0,
    独行: 1,
    重逢: 1,
    闭环: 3,
    同频: 3,
    五行: 6,
    五福: 6,
    中宫: 6,
    黄金: 6
  }

  if (topTag && linkedFacts[topTag] !== undefined) return linkedFacts[topTag]!

  const hash = draw.reduce((value, digit) => (value * 31 + digit) % 1_000_003, 7)
  return hash % FACT_COUNT
}

const activeFact = ref<Fact>(factBuilders[0]!(lucky.digits))
const factLabel = computed(
  () => `FACT ${String(activeFactIndex.value + 1).padStart(2, '0')} / ${String(FACT_COUNT).padStart(2, '0')}`
)

watch(
  () => lucky.digits,
  (draw) => {
    if (lucky.source === 'custom') {
      const nextIndex = factIndexForDigits(draw)
      lastFactIndex.value = nextIndex
      activeFactIndex.value = nextIndex
    } else {
      activeFactIndex.value = pickNextFactIndex()
    }

    activeFact.value = factBuilders[activeFactIndex.value]!(draw)
  }
)
</script>

<template>
  <section id="math-fact" class="band">
    <BContainer>
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
        <div class="flex-grow-1">
          <p class="kicker">04 / 数学注脚</p>
          <h2 class="display-5 fw-bolder mb-0">
            预言之后，<br class="d-lg-none"><span class="text-primary">数学怎么说？</span>
          </h2>
        </div>
        <div class="text-lg-end">
          <p class="section-meta d-none d-lg-block mb-1">{{ lucky.drawLabel }}</p>
          <p v-if="lucky.hasCustomDistributions" class="small text-danger fw-bolder mb-0">
            注脚按均匀 0–9 基线计算
          </p>
        </div>
      </div>

      <BRow class="g-4">
        <BCol lg="8">
          <article class="panel fact-card h-100" aria-live="polite">
            <header class="fact-header d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div>
                <p class="kicker kicker--warning mb-2">{{ activeFact.eyebrow }}</p>
                <h3 class="display-6 fw-bolder mb-0">{{ activeFact.title }}</h3>
              </div>
              <BBadge variant="dark">{{ factLabel }}</BBadge>
            </header>

            <div class="fact-body">
              <BRow class="g-4">
                <BCol md="5">
                  <p class="fact-metric-label">{{ activeFact.metricLabel }}</p>
                  <p class="fact-metric-value">{{ activeFact.metricValue }}</p>
                  <p class="fact-metric-note">{{ activeFact.metricNote }}</p>
                </BCol>

                <BCol md="7">
                  <p class="fs-5 lh-base mb-4">{{ activeFact.statement }}</p>

                  <div class="formula-box formula-box--accent">
                    <p class="formula-label">FORMULA / 公式</p>
                    <MathFormula :formula="activeFact.formula" display-mode />
                  </div>
                </BCol>
              </BRow>

              <div class="fact-reading">
                <p class="kicker mb-1">THIS DRAW / 本注读数</p>
                <p class="fw-semibold mb-0">{{ activeFact.reading }}</p>
              </div>

              <div class="fact-chart">
                <ProbabilityChart :distribution="activeFact.distribution" />
              </div>
            </div>
          </article>
        </BCol>

        <BCol lg="4">
          <aside class="odds-panel">
            <div class="odds-header">
              <p class="kicker kicker--dark mb-1">FIXED ODDS</p>
              <h3 class="h4 fw-bolder mb-0">固定概率速查</h3>
            </div>

            <div class="p-3 flex-grow-1 d-flex flex-column">
              <div
                v-for="item in FIXED_ODDS"
                :key="item.label"
                class="odds-item"
              >
                <div class="d-flex justify-content-between align-items-start gap-3">
                  <p class="fw-bolder mb-1">{{ item.label }}</p>
                  <p class="odds-value">{{ item.value }}</p>
                </div>
                <div class="odds-formula">
                  <MathFormula :formula="item.formula" />
                </div>
              </div>

              <p class="small text-white-50 mt-3 mb-0">
                固定概率描述的是长期频率，不是对下一注的承诺。每个号码串出现的机会都是 10^−10。
              </p>

              <BButton
                variant="warning"
                :disabled="lucky.isDrawing"
                class="w-100 mt-4"
                @click="lucky.draw()"
              >
                {{ lucky.isDrawing ? '抽取中…' : '↻ 再开一注' }}
              </BButton>
            </div>
          </aside>
        </BCol>
      </BRow>
    </BContainer>
  </section>
</template>
