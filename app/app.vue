<script setup lang="ts">
import type { DistributionPoint, FactDistribution } from '~/types/probability'
import { formatPercent } from '~/utils/format'
import { plans, type Plan } from '~~/shared/plans'

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

type LuckySignal = {
  tag: string
  kicker: string
  title: string
  detail: string
  oracle: string
  weight: number
}

type LuckyReading = {
  prophecy: string
  keywords: string[]
  signals: LuckySignal[]
  summary: string
}

type RevealSource = 'sample' | 'random' | 'custom'

const FACT_COUNT = 7
const SAMPLE_DIGITS = [0, 8, 2, 7, 1, 8, 4, 6, 3, 5]

useHead({
  title: '拾光概率室 · 十位号码的幸运预言与离散数学',
  meta: [
    {
      name: 'description',
      content: '随机开一注十位号码，或输入你的号码，读取它的幸运结构与离散数学事实。仅供娱乐。'
    }
  ],
  htmlAttrs: { lang: 'zh-CN' }
})

const digits = ref([...SAMPLE_DIGITS])
const source = ref<RevealSource>('sample')
const numberInput = ref('')
const inputError = ref('')
const drawCount = ref(0)
const isDrawing = ref(false)
const activeFactIndex = ref(0)
const lastFactIndex = ref(0)
const selectedPlan = ref<Plan | null>(null)
const pendingPlan = ref<Plan | null>(null)
const currentPlanId = ref<Plan['id'] | null>(null)
const planMessage = ref('')
const authMode = ref<'login' | 'register'>('login')
const authName = ref('')
const authEmail = ref('')
const authPassword = ref('')
const authError = ref('')
const authPending = ref(false)
const { status: authStatus, data: authSession, signIn, signOut, getSession } = useAuth()
let drawTimer: ReturnType<typeof setTimeout> | undefined

const digitSum = computed(() => digits.value.reduce((total, digit) => total + digit, 0))
const distinctCount = computed(() => new Set(digits.value).size)
const eightCount = computed(() => digits.value.filter((digit) => digit === 8).length)
const oddCount = computed(() => digits.value.filter((digit) => digit % 2 === 1).length)
const isAuthenticated = computed(() => authStatus.value === 'authenticated')
const currentPlan = computed(() => plans.find((plan) => plan.id === currentPlanId.value) ?? null)

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
const factLabel = computed(() => `FACT ${String(activeFactIndex.value + 1).padStart(2, '0')} / ${String(FACT_COUNT).padStart(2, '0')}`)

watch(numberInput, (value) => {
  const sanitized = value.replace(/\D/g, '').slice(0, 10)
  if (sanitized !== value) numberInput.value = sanitized
  if (inputError.value) inputError.value = ''
})

function combinations(n: number, k: number) {
  let result = 1
  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - k + i)) / i
  }
  return result
}

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

function analyzeLucky(draw: number[]): LuckyReading {
  const joined = draw.join('')
  const total = draw.reduce((sum, digit) => sum + digit, 0)
  const distinct = new Set(draw).size
  const repeats = 10 - distinct
  const count = (target: number) => draw.filter((digit) => digit === target).length
  const eights = count(8)
  const fives = count(5)
  const sixes = count(6)
  const nines = count(9)
  const primeDigitCount = draw.filter((digit) => [2, 3, 5, 7].includes(digit)).length
  const odd = draw.filter((digit) => digit % 2 === 1).length
  const first = draw[0]!
  const last = draw[9]!
  const signals: LuckySignal[] = []

  if (joined === [...draw].reverse().join('')) {
    signals.push({
      tag: '照见',
      kicker: '对称',
      title: '十位回文，内外如一',
      detail: '这串号码正读、反读完全相同。十位回文只占全部号码的 0.001%，像一面小小的数字镜子。',
      oracle: '你正在寻找的答案，其实一直在镜子里等你。',
      weight: 44
    })
  }

  if (draw.every((digit, index) => index === 0 || draw[index - 1]! <= digit)) {
    signals.push({
      tag: '上行',
      kicker: '趋势',
      title: '一路不降，步步向上',
      detail: '从左到右，每一位数字都不小于前一位。非降序列只占全部号码的 0.000924%，是一种少见的秩序。',
      oracle: '接下来的路适合一直向前；慢一点没关系，别回头。',
      weight: 42
    })
  }

  if (distinct === 10) {
    signals.push({
      tag: '独行',
      kicker: '排列',
      title: '十位全异，没有模板',
      detail: '十位数字互不相同，概率只有 0.036288%。你没有旧答案可以照抄，这本身就是一种自由。',
      oracle: '你脚下的路没有模板；照抄别人的答案，反而会错过自己的好运。',
      weight: 36
    })
  } else {
    signals.push({
      tag: '重逢',
      kicker: '重数',
      title: repeats === 1 ? '一对重逢，回声初现' : `${repeats} 次重复，回声聚拢`,
      detail: `十位里出现了 ${distinct} 种数字，共有 ${repeats} 次重复。旧的线索可能再次出现，这一次你可以换一种回应。`,
      oracle: '同一份好运，会用两次不同的方式敲你的门。',
      weight: 20 + repeats * 2
    })
  }

  if (eights >= 2) {
    const positions = draw
      .map((digit, index) => (digit === 8 ? index + 1 : 0))
      .filter((position) => position > 0)
      .join('、')
    signals.push({
      tag: eights === 2 ? '双八' : '八方',
      kicker: '好彩',
      title: eights === 2 ? '双八临门，回声加倍' : `${eights} 个 8，八方来风`,
      detail: `数字 8 出现在第 ${positions} 位。文化里“八”谐音“发”，概率上它与其他数字完全平等；把它当作好彩头就好。`,
      oracle: '同一个机会会来两次；第二次，请别再假装没看见。',
      weight: 30 + eights * 2
    })
  } else if (eights === 1) {
    signals.push({
      tag: '机遇',
      kicker: '一个 8',
      title: '一个 8，门缝透光',
      detail: `8 出现在第 ${draw.indexOf(8) + 1} 位。它没有喧宾夺主，只留了一盏灯。`,
      oracle: '有一扇门正在为你留着，轻一点推，它会开。',
      weight: 24
    })
  }

  if (sixes > 0) {
    signals.push({
      tag: '顺风',
      kicker: '顺利',
      title: `${sixes} 个 6，顺风而行`,
      detail: `数字 6 出现了 ${sixes} 次。六六大顺是文化里的祝愿；在此刻，把它读成“阻力会变小”。`,
      oracle: '阻力会变小；先做那件你一直拖着的小事。',
      weight: 16 + sixes * 2
    })
  }

  if (nines > 0) {
    signals.push({
      tag: '余韵',
      kicker: '收尾',
      title: `${nines} 个 9，一程收尾`,
      detail: `9 是十进制里的最后一位，也是下一轮 0 的前奏。它出现了 ${nines} 次，提醒你有些事该合上封面。`,
      oracle: '一段循环正在收尾；别急着开始新的，先把旧的合上。',
      weight: 14 + nines * 2
    })
  }

  if (fives > 0) {
    const centerPosition = draw[4] === 5 ? 5 : draw[5] === 5 ? 6 : 0
    const centered = centerPosition > 0
    signals.push({
      tag: centered ? '中宫' : fives >= 2 ? '五福' : '五行',
      kicker: centered ? '中宫' : '五福',
      title: centered
        ? '五居中宫，四面平衡'
        : fives === 1
          ? '一个 5，五福临门'
          : `${fives} 个 5，五福齐聚`,
      detail: centered
        ? `5 出现在第 ${centerPosition} 位，正好落在号码的中宫。5 是第三个质数、斐波那契数列第五项；正五边形与五芒星里藏着黄金分割。传统文化又以“五”为“全”的基数：五行、五色、五音、五谷、五味。`
        : `本注有 ${fives} 个 5。5 是第三个质数、斐波那契数列第五项；正五边形与五芒星里藏着黄金分割。传统文化又以“五”为“全”的基数：五行、五色、五音、五谷、五味。`,
      oracle: centered
        ? '你正站在变化的正中央；先稳住重心，再决定往哪边走。'
        : '别只盯着一个方向；把生活的五个角落都照亮，答案会自己出现。',
      weight: 21 + fives * 2 + (centered ? 4 : 0)
    })
  }

  if (fives > 0 && eights > 0) {
    const adjacent = draw.some(
      (digit, index) =>
        index < draw.length - 1 &&
        ((digit === 5 && draw[index + 1] === 8) || (digit === 8 && draw[index + 1] === 5))
    )
    signals.push({
      tag: '黄金',
      kicker: '比例',
      title: adjacent ? '5 与 8 相邻，斐波那契的节拍' : '5 与 8 同现，黄金比例',
      detail: adjacent
        ? '5 和 8 在号码中相邻，正好是斐波那契数列的相邻两项；8/5 = 1.6 逼近黄金分割 1.618，正五边形与五芒星也藏着这个比例。'
        : '5 和 8 同时出现，它们是斐波那契数列的相邻两项；8/5 = 1.6 逼近黄金分割 1.618，正五边形与五芒星也藏着这个比例。',
      oracle: '美感和好运常常来自比例，而不是用力；给生活留一点空白。',
      weight: adjacent ? 31 : 27
    })
  }

  if (primeDigitCount === 10) {
    signals.push({
      tag: '纯质',
      kicker: '质数',
      title: '十位皆质数，稀有骨架',
      detail: '2、3、5、7 是十进制中的质数数字。十位全部落在质数集合的概率是 (4/10)^10 = 0.01048576%。',
      oracle: '你的答案不需要很多装饰；越纯粹，越有力量。',
      weight: 40
    })
  }

  if (odd === 5) {
    signals.push({
      tag: '平衡',
      kicker: '奇偶',
      title: '奇偶各半，天平归位',
      detail: '5 个奇数与 5 个偶数同时出现。你能同时看见问题的两面，这本身就是一种幸运。',
      oracle: '当两个选择看起来一样重，答案可能在第三种做法里。',
      weight: 23
    })
  }

  if (total % 9 === 0) {
    signals.push({
      tag: '闭环',
      kicker: '和数',
      title: `和值 ${total}，九宫闭环`,
      detail: `十位相加得到 ${total}，恰好被 9 整除。数字替你把一个完整循环走了一遍。`,
      oracle: '该结束的会结束，该回来的会回来。',
      weight: 26
    })
  } else if (total % 3 === 0) {
    signals.push({
      tag: '同频',
      kicker: '和数',
      title: `和值 ${total}，三数同频`,
      detail: `十位相加得到 ${total}，能被 3 整除。零散的节奏开始对齐，适合把想法说出口。`,
      oracle: '心意、时机和行动正在对齐；先迈出最小的一步。',
      weight: 18
    })
  }

  if (count(0) > 0 && nines > 0) {
    signals.push({
      tag: '循环',
      kicker: '边界',
      title: '0 与 9，一圈完整',
      detail: '起点的 0 与终点的 9 同时出现在号码里。从无到有、从有到无，这是一个完整的圆。',
      oracle: '一件拖了很久的事即将闭环，从终点重新看见起点。',
      weight: 25
    })
  }

  if (first === last) {
    signals.push({
      tag: '呼应',
      kicker: '首尾',
      title: `首尾同为 ${first}`,
      detail: `第一位和最后一位都是 ${first}。故事的入口与出口指向同一个数字。`,
      oracle: '别向外找答案，先问问那个已经知道答案的自己。',
      weight: 22
    })
  }

  let longestRun = 1
  let currentRun = 1
  let longestStart = 0
  for (let index = 1; index < draw.length; index += 1) {
    if (draw[index] === draw[index - 1]! + 1) {
      currentRun += 1
      if (currentRun > longestRun) {
        longestRun = currentRun
        longestStart = index - currentRun + 1
      }
    } else {
      currentRun = 1
    }
  }

  if (longestRun >= 3) {
    const runValues = draw.slice(longestStart, longestStart + longestRun).join(' → ')
    signals.push({
      tag: '连号',
      kicker: '顺势',
      title: `${longestRun} 位连号，顺势而行`,
      detail: `号码中出现了一段连续递增：${runValues}。数字已经在排队向前，不用逆着趋势用力。`,
      oracle: '数字已经在排队向前，顺势比用力更重要。',
      weight: 18 + longestRun * 2
    })
  }

  signals.push(
    {
      tag: '唯一',
      kicker: '概率',
      title: '10^10 分之一',
      detail: '全部十位数字串共有 10^10 个，这串号码只占其中一个位置，出现概率是 10^-10。',
      oracle: '你不需要更幸运，只需要更相信自己的节奏。',
      weight: 4
    },
    {
      tag: '节奏',
      kicker: '和值',
      title: `和值 ${total}，属于你的重心`,
      detail: `十位相加得到 ${total}。随机号码的和值以 45 为中心波动，而每一串都有自己的重心。`,
      oracle: '把目光从结果挪开一点，幸运会从过程里长出来。',
      weight: 2
    },
    {
      tag: '印记',
      kicker: '首尾',
      title: `从 ${first} 出发，在 ${last} 收尾`,
      detail: `号码的第一位是 ${first}，最后一位是 ${last}。开头已经写好，结尾仍在你手里。`,
      oracle: '故事的开头已经写好，结尾仍由你落笔。',
      weight: 1
    }
  )

  const ranked = [...signals].sort((a, b) => b.weight - a.weight).slice(0, 3)
  const keywords = [...new Set(ranked.map((signal) => signal.tag))]

  return {
    prophecy: ranked[0]!.oracle,
    keywords,
    signals: ranked,
    summary: '这不是对中奖的预测，而是一面用数字结构打磨的镜子。三条线索不会改变概率，却能改变你看待这串号码的方式。'
  }
}

const fixedOdds = [
  {
    label: '至少出现一个 8',
    formula: '1 - \\left(\\frac{9}{10}\\right)^{10}',
    value: '65.13%'
  },
  {
    label: '至少一对数字重复',
    formula: '1 - \\frac{10!}{10^{10}}',
    value: '99.96%'
  },
  {
    label: '十位数字全部不同',
    formula: '\\frac{10!}{10^{10}}',
    value: '0.0363%'
  },
  {
    label: '十位号码是回文',
    formula: '\\frac{10^5}{10^{10}}',
    value: '0.001%'
  }
]

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

const activeFact = ref<Fact>(factBuilders[0]!(digits.value))
const luckyReading = ref<LuckyReading>(analyzeLucky(digits.value))

function pickNextFactIndex() {
  const offset = 1 + Math.floor(Math.random() * (FACT_COUNT - 1))
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

function randomDigits() {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10))
}

function reveal(nextDigits: number[], nextSource: 'random' | 'custom', factIndex?: number) {
  digits.value = nextDigits
  source.value = nextSource
  drawCount.value += 1
  luckyReading.value = analyzeLucky(nextDigits)

  const nextFactIndex = factIndex ?? pickNextFactIndex()
  if (factIndex !== undefined) lastFactIndex.value = factIndex
  activeFactIndex.value = nextFactIndex
  activeFact.value = factBuilders[nextFactIndex]!(nextDigits)
}

function scrollToLucky() {
  if (!import.meta.client) return
  void nextTick(() => {
    document.getElementById('lucky-reading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string; message?: string } }).data
    return data?.statusMessage ?? data?.message ?? fallback
  }
  return fallback
}

async function loadCurrentPlan() {
  try {
    const result = await $fetch<{ plan: { id: string } | null }>('/api/plans/current')
    const plan = result.plan ? plans.find((item) => item.id === result.plan?.id) : null
    currentPlanId.value = plan?.id ?? null
  } catch {
    currentPlanId.value = null
  }
}

async function selectPlan(plan: Plan) {
  planMessage.value = ''
  try {
    await $fetch('/api/plans/select', {
      method: 'POST',
      body: { planId: plan.id }
    })
    currentPlanId.value = plan.id
    selectedPlan.value = plan
    planMessage.value = `已将「${plan.name}」保存到你的账户。`
  } catch (error) {
    planMessage.value = getErrorMessage(error, '方案保存失败，请稍后重试。')
  }
}

async function choosePlan(plan: Plan) {
  if (plan.free) {
    selectedPlan.value = null
    pendingPlan.value = null
    scrollToLucky()
    return
  }

  selectedPlan.value = plan
  if (!isAuthenticated.value) {
    pendingPlan.value = plan
    authError.value = `登录后会自动保存「${plan.name}」方案。`
    await nextTick()
    document.getElementById('account-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  await selectPlan(plan)
}

function toggleAuthMode() {
  authMode.value = authMode.value === 'login' ? 'register' : 'login'
  authError.value = ''
}

async function submitAuth() {
  authError.value = ''
  planMessage.value = ''
  authPending.value = true

  try {
    if (authMode.value === 'register') {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: {
          name: authName.value,
          email: authEmail.value,
          password: authPassword.value
        }
      })
    }

    const result = await signIn('credentials', {
      email: authEmail.value.trim(),
      password: authPassword.value,
      redirect: false
    })

    if (result?.error) {
      authError.value = result.error === 'CredentialsSignin' ? '邮箱或密码不正确。' : '登录失败，请重试。'
      return
    }

    authPassword.value = ''
    await getSession()
    await loadCurrentPlan()

    if (pendingPlan.value) {
      const plan = pendingPlan.value
      pendingPlan.value = null
      await selectPlan(plan)
    }
  } catch (error) {
    authError.value = getErrorMessage(error, '登录失败，请检查邮箱和密码。')
  } finally {
    authPending.value = false
  }
}

async function logout() {
  selectedPlan.value = null
  pendingPlan.value = null
  planMessage.value = ''

  try {
    await signOut({ callbackUrl: '/', redirect: false })
  } catch {
    const { csrfToken } = await $fetch<{ csrfToken: string }>('/api/auth/csrf')
    await $fetch('/api/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        csrfToken,
        callbackUrl: '/',
        json: 'true'
      })
    })
  }

  currentPlanId.value = null
  await getSession()

  if (import.meta.client) {
    window.location.assign('/')
  }
}

watch(
  authStatus,
  async (status) => {
    if (!import.meta.client) return
    if (status === 'authenticated') {
      await loadCurrentPlan()
    } else if (status === 'unauthenticated') {
      currentPlanId.value = null
    }
  },
  { immediate: true }
)

function draw(scroll = false) {
  if (isDrawing.value) return
  inputError.value = ''
  isDrawing.value = true

  const nextDigits = randomDigits()

  drawTimer = setTimeout(() => {
    reveal(nextDigits, 'random')
    isDrawing.value = false
    if (scroll) scrollToLucky()
  }, 320)
}

function readNumber() {
  const value = numberInput.value.trim()

  if (!/^\d{10}$/.test(value)) {
    inputError.value = '请输入恰好 10 位数字（0–9），允许前导 0。'
    return
  }

  inputError.value = ''
  const nextDigits = value.split('').map((digit) => Number(digit))
  reveal(nextDigits, 'custom', factIndexForDigits(nextDigits))
  scrollToLucky()
}

onBeforeUnmount(() => {
  if (drawTimer) clearTimeout(drawTimer)
})
</script>

<template>
  <BApp>
    <NuxtRouteAnnouncer />

    <div class="min-vh-100 d-flex flex-column">
      <div class="bg-primary py-1 border-bottom border-2 border-dark" aria-hidden="true" />

      <header class="bg-dark text-warning border-bottom border-4 border-warning">
        <BContainer class="py-3">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-3">
              <div
                class="bg-warning text-dark border border-2 border-dark px-2 py-1 fw-bolder font-monospace fs-4 lh-1"
                aria-hidden="true"
              >
                10
              </div>
              <div>
                <div class="fw-bolder fs-5 lh-1">拾光概率室</div>
                <div class="small text-white-50 font-monospace mt-1">LOTTO / ORACLE & MATH</div>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2 font-monospace small">
              <a href="#pricing" class="text-warning text-decoration-none fw-bolder border-bottom border-warning">
                付费计划
              </a>
              <BBadge variant="danger" class="border border-warning fw-bolder">LIVE ODDS</BBadge>
              <span class="text-white-50 d-none d-sm-inline">EST. 2026</span>
            </div>
          </div>
        </BContainer>
      </header>

      <main class="flex-grow-1">
        <section class="border-bottom border-4 border-dark">
          <BContainer class="py-5">
            <BRow class="align-items-center g-4 g-lg-5">
              <BCol lg="7">
                <p
                  class="d-inline-block bg-warning text-dark border border-2 border-dark px-3 py-1 small fw-bolder font-monospace mb-4"
                >
                  随机号码 · 幸运预言实验
                </p>

                <h1 class="display-3 fw-bolder lh-1 mb-4">
                  十位数字，<br>
                  <span class="text-danger">一场幸运</span><span class="text-primary">显形</span>。
                </h1>

                <p class="fs-5 mb-4">
                  按一下按钮随机开号，或输入你自己的十位数字。概率室会从数字结构里找出一段幸运预言，再用离散数学告诉你这注号码有多稀有。
                </p>

                <div class="d-flex flex-wrap align-items-center gap-3">
                  <BButton
                    size="lg"
                    squared
                    :disabled="isDrawing"
                    class="bg-primary text-dark border-3 border-dark fw-bolder px-4 py-3 shadow font-monospace"
                    @click="draw(true)"
                  >
                    <span>{{ isDrawing ? '正在洗牌…' : '开出一注 / 听预言' }}</span>
                    <span class="ms-3" aria-hidden="true">{{ isDrawing ? '···' : '→' }}</span>
                  </BButton>

                  <a href="#lucky-reading" class="btn btn-outline-dark fw-bolder font-monospace">
                    输入我的号码 <span aria-hidden="true">↓</span>
                  </a>
                </div>

                <div class="d-flex flex-wrap gap-2 mt-4">
                  <span class="badge text-bg-dark font-monospace fw-normal">i.i.d. U(0,9)</span>
                  <span class="badge text-bg-danger font-monospace fw-normal border border-dark">10^10 种序列</span>
                  <span class="badge text-bg-warning text-dark font-monospace fw-normal border border-dark">样本 = 1</span>
                </div>

                <p class="small text-secondary mt-4 mb-0">
                  每一注号码独立生成，历史开奖不会改变下一次的概率。本页仅作数学教育与娱乐。
                </p>
              </BCol>

              <BCol lg="5">
                <article class="bg-dark text-white border border-4 border-dark shadow-lg">
                  <div
                    class="bg-warning text-dark border-bottom border-4 border-dark px-3 py-2 d-flex justify-content-between align-items-center gap-3"
                  >
                    <span class="font-monospace fw-bolder small">TICKET / {{ drawLabel }}</span>
                    <span class="font-monospace fw-bolder small">{{ ticketStatus }}</span>
                  </div>

                  <div class="p-3 p-sm-4">
                    <div class="d-flex justify-content-between align-items-center font-monospace small mb-3">
                      <span class="text-warning">10 DIGITS</span>
                      <span class="text-white-50">0—9</span>
                    </div>

                    <div class="row row-cols-5 g-2" aria-label="当前十位号码">
                      <div v-for="(digit, index) in digits" :key="`${drawCount}-${index}`" class="col">
                        <div
                          class="ratio ratio-1x1 border border-2"
                          :class="
                            digit === 8
                              ? 'bg-warning text-dark border-dark'
                              : digit % 2 === 0
                                ? 'bg-danger text-warning border-warning'
                                : 'bg-primary text-dark border-dark'
                          "
                        >
                          <div class="d-flex align-items-center justify-content-center">
                            <span class="display-6 fw-bolder font-monospace lh-1">{{ digit }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <BRow class="g-0 border border-2 border-warning mt-3 text-center font-monospace">
                      <BCol cols="3" class="p-2 border-end border-warning">
                        <div class="small text-white-50">SUM</div>
                        <div class="fs-5 fw-bolder text-warning">{{ digitSum }}</div>
                      </BCol>
                      <BCol cols="3" class="p-2 border-end border-warning">
                        <div class="small text-white-50">KINDS</div>
                        <div class="fs-5 fw-bolder text-warning">{{ distinctCount }}</div>
                      </BCol>
                      <BCol cols="3" class="p-2 border-end border-warning">
                        <div class="small text-white-50">8s</div>
                        <div class="fs-5 fw-bolder" :class="eightCount > 0 ? 'text-warning' : 'text-white'">
                          {{ eightCount }}
                        </div>
                      </BCol>
                      <BCol cols="3" class="p-2">
                        <div class="small text-white-50">ODD:EVEN</div>
                        <div class="fs-5 fw-bolder text-warning">{{ oddCount }}:{{ 10 - oddCount }}</div>
                      </BCol>
                    </BRow>
                  </div>

                  <div
                    class="bg-primary text-dark border-top border-4 border-dark px-3 py-2 d-flex justify-content-between gap-3 font-monospace small fw-bolder"
                  >
                    <span>P(含 8) / 65.13%</span>
                    <span>MATH IS NOT LUCK</span>
                  </div>
                </article>
              </BCol>
            </BRow>
          </BContainer>
        </section>

        <section id="lucky-reading" class="py-5 bg-warning-subtle border-bottom border-4 border-dark">
          <BContainer>
            <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
              <div class="flex-grow-1">
                <p class="font-monospace text-danger fw-bolder small mb-2">02 / 数字预言</p>
                <h2 class="display-5 fw-bolder mb-0">
                  这串数字，<br class="d-lg-none"><span class="text-primary">在替你说什么？</span>
                </h2>
              </div>
              <p class="d-none d-lg-block font-monospace fw-bolder small mb-1">{{ sourceLabel }}</p>
            </div>

            <form class="bg-dark border border-4 border-dark p-3 p-md-4 mb-4" @submit.prevent="readNumber">
              <div class="row g-3 align-items-end">
                <div class="col-lg-4">
                  <p class="font-monospace small text-warning fw-bolder mb-1">YOUR NUMBER / 自选解读</p>
                  <label for="lucky-number" class="h4 fw-bolder text-white d-block mb-0">把你的十位数字交给我</label>
                </div>
                <div class="col-lg-8">
                  <div class="input-group">
                    <BFormInput
                      id="lucky-number"
                      v-model="numberInput"
                      inputmode="numeric"
                      autocomplete="off"
                      maxlength="10"
                      placeholder="例如 0812081624"
                      aria-describedby="lucky-number-help"
                      :aria-invalid="inputError ? 'true' : undefined"
                      class="form-control-lg border-3 border-warning font-monospace fw-bolder"
                    />
                    <BButton
                      type="submit"
                      squared
                      class="bg-warning text-dark border-3 border-dark fw-bolder px-4 font-monospace"
                    >
                      <span class="d-none d-sm-inline">解读号码</span>
                      <span class="d-sm-none">解读</span>
                      →
                    </BButton>
                  </div>
                  <p
                    v-if="inputError"
                    id="lucky-number-help"
                    role="alert"
                    class="small text-warning fw-bolder mt-2 mb-0"
                  >
                    {{ inputError }}
                  </p>
                  <p v-else id="lucky-number-help" class="small text-white-50 mt-2 mb-0">
                    恰好 10 位数字，允许前导 0。解读描述数字结构，不改变任何中奖概率。
                  </p>
                </div>
              </div>
            </form>

            <article class="bg-white border border-4 border-dark" aria-live="polite">
              <header
                class="bg-danger text-white p-3 p-md-4 border-bottom border-4 border-dark d-flex flex-wrap align-items-start justify-content-between gap-3"
              >
                <div>
                  <p class="font-monospace small text-warning fw-bolder mb-2">{{ sourceLabel }} · {{ drawLabel }}</p>
                  <h3 class="display-6 fw-bolder mb-0">数字预言</h3>
                </div>
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <BBadge
                    v-for="keyword in luckyReading.keywords"
                    :key="keyword"
                    variant="warning"
                    class="border border-dark font-monospace"
                  >
                    {{ keyword }}
                  </BBadge>
                </div>
              </header>

              <div class="p-3 p-md-4">
                <BRow class="g-4">
                  <BCol lg="5">
                    <p class="font-monospace small fw-bolder text-danger mb-2">ORACLE / 给你的预言</p>
                    <blockquote class="display-6 fw-bolder lh-sm mb-4">“{{ luckyReading.prophecy }}”</blockquote>
                    <p class="text-secondary mb-0">{{ luckyReading.summary }}</p>
                  </BCol>

                  <BCol lg="7">
                    <div
                      v-for="(signal, index) in luckyReading.signals"
                      :key="signal.title"
                      class="border-top border-4 border-primary py-3"
                    >
                      <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                        <span class="badge text-bg-dark font-monospace">0{{ index + 1 }}</span>
                        <span class="small text-danger font-monospace fw-bolder">{{ signal.kicker }}</span>
                      </div>
                      <h4 class="h5 fw-bolder mb-2">{{ signal.title }}</h4>
                      <p class="mb-0">{{ signal.detail }}</p>
                    </div>
                  </BCol>
                </BRow>
              </div>

              <footer
                class="bg-warning text-dark border-top border-4 border-dark px-3 px-md-4 py-2 d-flex flex-wrap justify-content-between gap-2 font-monospace small fw-bolder"
              >
                <span>{{ digits.join('') }}</span>
                <span>仅供娱乐 / NOT A PREDICTION</span>
              </footer>
            </article>
          </BContainer>
        </section>

        <section id="math-fact" class="py-5">
          <BContainer>
            <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
              <div class="flex-grow-1">
                <p class="font-monospace text-danger fw-bolder small mb-2">03 / 数学注脚</p>
                <h2 class="display-5 fw-bolder mb-0">
                  预言之后，<br class="d-lg-none"><span class="text-primary">数学怎么说？</span>
                </h2>
              </div>
              <p class="d-none d-lg-block font-monospace fw-bolder small mb-1">{{ drawLabel }}</p>
            </div>

            <BRow class="g-4">
              <BCol lg="8">
                <article class="h-100 bg-white border border-4 border-dark" aria-live="polite">
                  <header
                    class="bg-danger text-white p-3 p-md-4 border-bottom border-4 border-dark d-flex flex-wrap align-items-start justify-content-between gap-3"
                  >
                    <div>
                      <p class="font-monospace small text-warning fw-bolder mb-2">{{ activeFact.eyebrow }}</p>
                      <h3 class="display-6 fw-bolder mb-0">{{ activeFact.title }}</h3>
                    </div>
                    <BBadge variant="dark" class="border border-warning font-monospace">{{ factLabel }}</BBadge>
                  </header>

                  <div class="p-3 p-md-4">
                    <BRow class="g-4">
                      <BCol md="5">
                        <p class="small text-uppercase font-monospace fw-bolder text-danger mb-2">
                          {{ activeFact.metricLabel }}
                        </p>
                        <p class="display-4 fw-bolder text-danger lh-1 font-monospace text-break mb-3">
                          {{ activeFact.metricValue }}
                        </p>
                        <p class="small text-secondary font-monospace mb-0">{{ activeFact.metricNote }}</p>
                      </BCol>

                      <BCol md="7">
                        <p class="fs-5 lh-base mb-4">{{ activeFact.statement }}</p>

                        <div class="bg-dark border-start border-5 border-warning p-3">
                          <p class="small font-monospace fw-bolder text-warning mb-2">FORMULA / 公式</p>
                          <div class="text-warning overflow-x-auto pb-1">
                            <MathFormula :formula="activeFact.formula" display-mode />
                          </div>
                        </div>
                      </BCol>
                    </BRow>

                    <div class="bg-warning-subtle border-start border-5 border-primary p-3 mt-4">
                      <p class="small font-monospace fw-bolder text-danger mb-1">THIS DRAW / 本注读数</p>
                      <p class="fw-semibold mb-0">{{ activeFact.reading }}</p>
                    </div>

                    <div class="border-top border-4 border-dark mt-4 pt-3">
                      <ProbabilityChart :distribution="activeFact.distribution" />
                    </div>
                  </div>
                </article>
              </BCol>

              <BCol lg="4">
                <aside class="h-100 d-flex flex-column bg-dark border border-4 border-dark text-white">
                  <div class="bg-primary text-dark p-3 border-bottom border-4 border-dark">
                    <p class="font-monospace small fw-bolder mb-1">FIXED ODDS</p>
                    <h3 class="h4 fw-bolder mb-0">固定概率速查</h3>
                  </div>

                  <div class="p-3 flex-grow-1 d-flex flex-column">
                    <div
                      v-for="item in fixedOdds"
                      :key="item.label"
                      class="py-3 border-bottom border-secondary"
                    >
                      <div class="d-flex justify-content-between align-items-start gap-3">
                        <p class="fw-bolder mb-1">{{ item.label }}</p>
                        <p class="fs-5 fw-bolder font-monospace text-warning mb-0 text-nowrap">{{ item.value }}</p>
                      </div>
                      <div class="small text-white-50 font-monospace mb-0">
                        <MathFormula :formula="item.formula" />
                      </div>
                    </div>

                    <p class="small text-white-50 mt-3 mb-0">
                      固定概率描述的是长期频率，不是对下一注的承诺。每个号码串出现的机会都是 10^−10。
                    </p>

                    <BButton
                      squared
                      :disabled="isDrawing"
                      class="w-100 bg-warning text-dark border-2 border-dark fw-bolder font-monospace mt-4"
                      @click="draw"
                    >
                      {{ isDrawing ? '抽取中…' : '↻ 再开一注' }}
                    </BButton>
                  </div>
                </aside>
              </BCol>
            </BRow>
          </BContainer>
        </section>

        <section
          id="pricing"
          class="py-5 bg-danger text-white border-top border-4 border-dark border-bottom border-4 border-dark"
          aria-labelledby="pricing-title"
        >
          <BContainer>
            <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
              <div class="flex-grow-1">
                <p class="font-monospace text-warning fw-bolder small mb-2">04 / 付费计划</p>
                <h2 id="pricing-title" class="display-5 fw-bolder mb-0">
                  把预言，<br class="d-lg-none"><span class="text-warning">再往下读一层。</span>
                </h2>
              </div>
              <p class="d-none d-lg-block font-monospace fw-bolder small mb-1">DEMO PRICING / 未接入支付</p>
            </div>

            <p class="fs-5 text-white mb-4">
              三种演示方案，对应不同深度的数字解读。所有概率内容仍可免费查看。
            </p>

            <div id="account-panel" class="bg-dark text-white border border-3 border-warning p-3 p-md-4 mb-4">
              <div
                v-if="isAuthenticated"
                class="d-flex flex-wrap align-items-start justify-content-between gap-3"
              >
                <div>
                  <p class="font-monospace small text-warning fw-bolder mb-1">ACCOUNT / 账户</p>
                  <p class="h5 fw-bolder mb-1">{{ authSession?.user?.email }}</p>
                  <p class="small text-white-50 mb-0">
                    当前方案：
                    <span class="text-warning fw-bolder">{{ currentPlan?.name ?? '未选择付费方案' }}</span>
                  </p>
                  <p v-if="planMessage" class="small text-warning fw-bolder mt-2 mb-0" role="status">
                    {{ planMessage }}
                  </p>
                </div>
                <BButton
                  squared
                  class="bg-white text-dark border-3 border-warning fw-bolder font-monospace"
                  @click="logout"
                >
                  退出登录
                </BButton>
              </div>

              <form v-else @submit.prevent="submitAuth">
                <div class="row g-3 align-items-end">
                  <div class="col-lg-4">
                    <p class="font-monospace small text-warning fw-bolder mb-1">ACCOUNT / 账户</p>
                    <p class="h4 fw-bolder text-white mb-0">登录后保存方案</p>
                    <p class="small text-white-50 mt-2 mb-0">
                      账号与方案存入本地 PGlite；密码使用 scrypt 加盐哈希。
                    </p>
                  </div>

                  <div class="col-lg-8">
                    <div class="row g-2">
                      <div v-if="authMode === 'register'" class="col-md-4">
                        <label for="auth-name" class="form-label small font-monospace text-warning fw-bolder mb-1">
                          昵称
                        </label>
                        <BFormInput
                          id="auth-name"
                          v-model="authName"
                          autocomplete="nickname"
                          maxlength="40"
                          class="border-2 border-warning font-monospace"
                        />
                      </div>

                      <div class="col-md-4">
                        <label for="auth-email" class="form-label small font-monospace text-warning fw-bolder mb-1">
                          邮箱
                        </label>
                        <BFormInput
                          id="auth-email"
                          v-model="authEmail"
                          type="email"
                          autocomplete="email"
                          maxlength="254"
                          required
                          class="border-2 border-warning font-monospace"
                        />
                      </div>

                      <div class="col-md-4">
                        <label for="auth-password" class="form-label small font-monospace text-warning fw-bolder mb-1">
                          密码
                        </label>
                        <BFormInput
                          id="auth-password"
                          v-model="authPassword"
                          type="password"
                          :autocomplete="authMode === 'register' ? 'new-password' : 'current-password'"
                          minlength="8"
                          maxlength="128"
                          required
                          class="border-2 border-warning font-monospace"
                        />
                      </div>
                    </div>

                    <div class="d-flex flex-wrap align-items-center gap-2 mt-3">
                      <BButton
                        type="submit"
                        squared
                        :disabled="authPending"
                        class="bg-warning text-dark border-3 border-dark fw-bolder font-monospace"
                      >
                        {{ authPending ? '处理中…' : authMode === 'login' ? '登录' : '注册并登录' }}
                      </BButton>
                      <BButton
                        type="button"
                        squared
                        class="bg-white text-dark border-3 border-warning fw-bolder font-monospace"
                        @click="toggleAuthMode"
                      >
                        {{ authMode === 'login' ? '没有账号？注册' : '已有账号？登录' }}
                      </BButton>
                    </div>

                    <p v-if="authError" role="alert" class="small text-warning fw-bolder mt-2 mb-0">
                      {{ authError }}
                    </p>
                    <p v-else class="small text-white-50 mt-2 mb-0">
                      密码至少 8 位。登录后回到这里继续选择方案。
                    </p>
                  </div>
                </div>
              </form>
            </div>

            <BRow class="g-4">
              <BCol v-for="(plan, index) in plans" :key="plan.name" lg="4">
                <article
                  class="h-100 d-flex flex-column border border-3 border-dark shadow-lg"
                  :class="plan.featured ? 'bg-warning text-dark' : 'bg-white text-dark'"
                >
                  <header
                    class="p-3 p-md-4 border-bottom border-3 border-dark d-flex justify-content-between align-items-start gap-3"
                  >
                    <div>
                      <p class="font-monospace small fw-bolder mb-1">{{ plan.code }}</p>
                      <h3 class="h4 fw-bolder mb-0">{{ plan.name }}</h3>
                    </div>
                    <BBadge
                      v-if="currentPlan?.id === plan.id"
                      variant="dark"
                      class="border border-dark font-monospace"
                    >
                      当前方案
                    </BBadge>
                    <BBadge v-else-if="plan.featured" variant="danger" class="border border-dark font-monospace">
                      推荐
                    </BBadge>
                    <span v-else class="font-monospace small fw-bolder">0{{ index + 1 }}</span>
                  </header>

                  <div class="p-3 p-md-4 d-flex flex-column flex-grow-1">
                    <p class="mb-3">{{ plan.description }}</p>
                    <div class="d-flex align-items-end gap-2 mb-4">
                      <span class="display-4 fw-bolder font-monospace lh-1">{{ plan.price }}</span>
                      <span class="font-monospace small mb-1">{{ plan.period }}</span>
                    </div>

                    <ul class="list-unstyled small flex-grow-1 mb-4">
                      <li
                        v-for="feature in plan.features"
                        :key="feature"
                        class="d-flex gap-2 py-2 border-top border-dark-subtle"
                      >
                        <span class="text-danger fw-bolder" aria-hidden="true">✓</span>
                        <span>{{ feature }}</span>
                      </li>
                    </ul>

                    <BButton
                      squared
                      :disabled="currentPlan?.id === plan.id"
                      class="w-100 border-3 border-dark fw-bolder font-monospace"
                      :class="plan.featured ? 'bg-danger text-white' : 'bg-primary text-dark'"
                      @click="choosePlan(plan)"
                    >
                      {{ currentPlan?.id === plan.id ? '当前方案' : plan.cta }}
                    </BButton>
                  </div>
                </article>
              </BCol>
            </BRow>

            <div
              v-if="selectedPlan"
              class="bg-warning text-dark border border-3 border-dark mt-4 p-3 p-md-4"
              role="status"
            >
              <div class="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div>
                  <p class="font-monospace small fw-bolder text-danger mb-1">PLAN SELECTED / 已选择</p>
                  <p class="h5 fw-bolder mb-1">
                    {{ selectedPlan.name }} · {{ selectedPlan.price }} {{ selectedPlan.period }}
                  </p>
                  <p v-if="currentPlan?.id === selectedPlan.id" class="small mb-0">
                    方案已保存到你的账户。支付仍未接入，不会产生扣款。
                  </p>
                  <p v-else-if="isAuthenticated" class="small mb-0">
                    正在保存方案；若失败，请查看上方账户提示。本页不会产生扣款。
                  </p>
                  <p v-else class="small mb-0">
                    登录后会自动保存该方案；本页尚未接入支付，不会产生扣款。
                  </p>
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <BButton
                    squared
                    class="bg-dark text-warning border-3 border-dark fw-bolder font-monospace"
                    @click="scrollToLucky"
                  >
                    先体验 →
                  </BButton>
                  <BButton
                    squared
                    class="bg-white text-dark border-3 border-dark fw-bolder font-monospace"
                    @click="selectedPlan = null"
                  >
                    取消
                  </BButton>
                </div>
              </div>
            </div>

            <p class="small text-white mt-4 mb-0">
              演示价仅用于界面展示；支付、订阅与权益发放均未接入。本页不构成任何投注建议。
            </p>
          </BContainer>
        </section>
      </main>

      <footer class="bg-dark text-white border-top border-4 border-warning">
        <BContainer class="py-4">
          <BRow class="g-3 align-items-center">
            <BCol md="8">
              <p class="small text-warning fw-bolder font-monospace mb-2">DISCIPLINE OVER LUCK.</p>
              <p class="small text-white-50 mb-0">
                本页仅作概率教育与娱乐演示，不构成任何投注建议。随机号码由浏览器独立均匀生成；自选号码仅用于结构解读。
                全部“幸运”文字均为娱乐内容，不对应真实开奖，也无法预测开奖结果。
              </p>
            </BCol>
            <BCol md="4" class="text-md-end">
              <p class="small text-warning font-monospace mb-1">拾光概率室 / 2026</p>
              <p class="small text-white-50 font-monospace mb-0">NUXT · BOOTSTRAPVUE/NEXT</p>
            </BCol>
          </BRow>
        </BContainer>
      </footer>
    </div>
  </BApp>
</template>

<style>
:root {
  --bs-primary: #ff6a00;
  --bs-primary-rgb: 255, 106, 0;
  --bs-danger: #d81e2c;
  --bs-danger-rgb: 216, 30, 44;
  --bs-warning: #ffc107;
  --bs-warning-rgb: 255, 193, 7;
  --bs-dark: #17120b;
  --bs-dark-rgb: 23, 18, 11;
  --bs-body-bg: #f7ecd7;
  --bs-body-color: #1c150d;
  --bs-link-color-rgb: 216, 30, 44;
  --bs-link-hover-color-rgb: 255, 106, 0;
  --bs-border-radius: 0;
  --bs-border-radius-sm: 0;
  --bs-border-radius-lg: 0;
  --bs-border-radius-xl: 0;
  --bs-border-radius-xxl: 0;
  --bs-border-radius-pill: 0;
}
</style>
