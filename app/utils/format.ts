export function formatPercent(probability: number) {
  const percent = probability * 100
  if (percent >= 1) return `${percent.toFixed(2)}%`
  if (percent >= 0.01) return `${parseFloat(percent.toPrecision(4))}%`
  if (percent >= 0.0001) return `${parseFloat(percent.toPrecision(3))}%`
  return `${percent.toExponential(2)}%`
}

export function formatAxisPercent(probability: number) {
  const percent = probability * 100
  if (percent === 0) return '0%'
  if (percent >= 10) return `${Math.round(percent)}%`
  if (percent >= 1) return `${Number(percent.toFixed(1))}%`
  if (percent >= 0.01) return `${Number(percent.toPrecision(2))}%`
  return `${percent.toExponential(1)}%`
}
