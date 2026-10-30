export type LuckySignal = {
  tag: string
  kicker: string
  title: string
  detail: string
  oracle: string
  weight: number
}

export type LuckyReading = {
  prophecy: string
  keywords: string[]
  signals: LuckySignal[]
  summary: string
}

export const SAMPLE_DIGITS = [0, 8, 2, 7, 1, 8, 4, 6, 3, 5]

export function analyzeLucky(draw: number[]): LuckyReading {
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
