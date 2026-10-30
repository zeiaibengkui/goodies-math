export type PlanId = 'free' | 'deep' | 'monthly'

export type Plan = {
  id: PlanId
  code: string
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  featured?: boolean
  free?: boolean
}

export const plans: Plan[] = [
  {
    id: 'free',
    code: 'FREE / 01',
    name: '随缘签',
    price: '¥0',
    period: '永久',
    description: '先看看数字在说什么。',
    features: [
      '随机开出一注十位号码',
      '3 条幸运线索 + 1 张数学事实卡',
      '完整概率分布图',
      '支持自选号码单次解读'
    ],
    cta: '免费体验 →',
    free: true
  },
  {
    id: 'deep',
    code: 'DEEP READ / 02',
    name: '深读签',
    price: '¥9.9',
    period: '/ 次',
    description: '把一注号码拆到结构层。',
    features: [
      '7 张数学事实卡完整轮换',
      '自定义号码连续解读',
      '和值 / 重数 / 质数结构拆解',
      '本次预言与事实卡收藏（演示权益）'
    ],
    cta: '选择深读签',
    featured: true
  },
  {
    id: 'monthly',
    code: 'ORACLE+ / 03',
    name: '长伴签',
    price: '¥39',
    period: '/ 月',
    description: '给每天的好奇心留一个位置。',
    features: [
      '包含「深读签」全部权益',
      '每日自动开号与号码记录（演示权益）',
      '月度幸运结构报告（演示权益）',
      '新规则与视觉主题优先体验'
    ],
    cta: '选择长伴签'
  }
]

export function findPlan(id: string | null | undefined) {
  return plans.find((plan) => plan.id === id)
}
