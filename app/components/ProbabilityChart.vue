<script setup lang="ts">
import { BarChart } from 'echarts/charts'
import { AriaComponent, GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { FactDistribution } from '~/types/probability'
import { formatAxisPercent, formatPercent } from '~/utils/format'

use([BarChart, AriaComponent, GridComponent, MarkLineComponent, TooltipComponent, SVGRenderer])

const props = defineProps<{
  distribution: FactDistribution
}>()

const palette = {
  dark: '#17120b',
  danger: '#d81e2c',
  warning: '#ffc107',
  primary: '#ff6a00',
  muted: '#d9c9b1',
  grid: '#e3d6c2'
} as const

const initOptions = { renderer: 'svg' as const }

const labelInterval = computed(() => (props.distribution.points.length > 30 ? 9 : 0))

const chartOption = computed(() => {
  const { points, current, marker, eventLabel, xLabel, currentLabel } = props.distribution

  return {
    animationDuration: 280,
    animationDurationUpdate: 220,
    textStyle: {
      fontFamily: 'monospace'
    },
    aria: {
      enabled: true,
      decal: { show: false },
      label: {
        enabled: true,
        description: `${xLabel}的概率分布。事件 ${eventLabel}。${currentLabel}。`
      }
    },
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: palette.dark,
      borderColor: palette.warning,
      borderWidth: 2,
      padding: [8, 10],
      textStyle: {
        color: palette.warning,
        fontFamily: 'monospace',
        fontSize: 12
      },
      formatter: (params: unknown) => {
        const dataIndex =
          typeof params === 'object' && params !== null && 'dataIndex' in params
            ? Number((params as { dataIndex: unknown }).dataIndex)
            : -1
        const point = points[dataIndex]
        if (!point) return ''
        const role = point.x === current ? '本注' : point.isEvent ? '事件区间' : '其他取值'
        return `<strong>${xLabel} = ${point.x}</strong><br/>概率 ${formatPercent(point.probability)}<br/>${role}`
      }
    },
    grid: {
      left: 54,
      right: 18,
      top: 34,
      bottom: 44
    },
    xAxis: {
      type: 'category',
      data: points.map((point) => String(point.x)),
      name: xLabel,
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        color: palette.dark,
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold'
      },
      axisLine: { lineStyle: { color: palette.dark, width: 2 } },
      axisTick: { show: false },
      axisLabel: {
        color: palette.dark,
        fontFamily: 'monospace',
        fontSize: 10,
        interval: labelInterval.value,
        hideOverlap: true
      }
    },
    yAxis: {
      type: 'value',
      name: '概率',
      nameGap: 16,
      nameTextStyle: {
        color: palette.dark,
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold'
      },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: palette.dark,
        fontFamily: 'monospace',
        fontSize: 10,
        formatter: (value: number) => formatAxisPercent(value)
      },
      splitLine: {
        lineStyle: {
          color: palette.grid,
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '概率',
        type: 'bar',
        barMaxWidth: 34,
        barMinHeight: points.length > 30 ? 0 : 2,
        data: points.map((point) => {
          const isCurrent = point.x === current
          return {
            value: point.probability,
            itemStyle: {
              color: isCurrent ? palette.danger : point.isEvent ? palette.warning : palette.muted,
              borderColor: isCurrent ? palette.dark : 'transparent',
              borderWidth: isCurrent ? 2 : 0
            },
            label: {
              show: isCurrent,
              position: 'top',
              formatter: formatPercent(point.probability),
              color: palette.danger,
              fontFamily: 'monospace',
              fontSize: 10,
              fontWeight: 'bold'
            }
          }
        }),
        emphasis: {
          itemStyle: {
            color: palette.primary,
            borderColor: palette.dark,
            borderWidth: 2
          }
        },
        markLine: marker
          ? {
              silent: true,
              symbol: 'none',
              lineStyle: {
                color: palette.dark,
                type: 'dashed',
                width: 2
              },
              label: {
                formatter: marker.label,
                position: 'insideEndTop',
                rotate: 0,
                color: palette.dark,
                backgroundColor: palette.warning,
                padding: [3, 5],
                fontFamily: 'monospace',
                fontSize: 10,
                fontWeight: 'bold'
              },
              data: [{ xAxis: String(marker.value) }]
            }
          : undefined
      }
    ]
  }
})
</script>

<template>
  <figure class="mb-0">
    <figcaption class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-2">
      <div>
        <p class="small font-monospace fw-bolder text-danger mb-1">DISTRIBUTION / 概率分布</p>
        <p class="h5 fw-bolder mb-0">{{ distribution.xLabel }}</p>
      </div>
      <div class="d-flex flex-wrap gap-2 font-monospace small">
        <span class="badge text-bg-dark">{{ distribution.currentLabel }}</span>
        <span class="badge text-bg-warning text-dark border border-dark">事件：{{ distribution.eventLabel }}</span>
      </div>
    </figcaption>

    <div
      class="ratio ratio-16x9 bg-white border border-2 border-dark"
      role="img"
      :aria-label="`${distribution.xLabel}的概率分布。${distribution.currentLabel}。事件：${distribution.eventLabel}。`"
    >
      <div class="w-100 h-100">
        <VChart :option="chartOption" :init-options="initOptions" autoresize />
      </div>
    </div>

    <div class="d-flex flex-wrap align-items-center gap-3 font-monospace small mt-2">
      <span class="d-inline-flex align-items-center gap-1">
        <span class="badge bg-warning border border-dark" aria-hidden="true">&nbsp;</span>
        事件区间
      </span>
      <span class="d-inline-flex align-items-center gap-1">
        <span class="badge bg-danger border border-dark" aria-hidden="true">&nbsp;</span>
        本注
      </span>
      <span class="d-inline-flex align-items-center gap-1">
        <span class="badge bg-secondary-subtle border border-dark" aria-hidden="true">&nbsp;</span>
        其他取值
      </span>
    </div>

    <p class="small text-secondary mt-2 mb-0">{{ distribution.note }}</p>
  </figure>
</template>
