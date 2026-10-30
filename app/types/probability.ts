export type DistributionPoint = {
  x: number
  probability: number
  isEvent: boolean
}

export type FactDistribution = {
  xLabel: string
  eventLabel: string
  points: DistributionPoint[]
  current: number
  currentLabel: string
  marker?: {
    value: number
    label: string
  }
  note: string
}
