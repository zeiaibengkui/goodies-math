<script setup lang="ts">
import { BarChart, LineChart } from 'echarts/charts'
import { AriaComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import MathFormula from '~/components/math/math-formula.vue'

use([BarChart, LineChart, AriaComponent, GridComponent, LegendComponent, TooltipComponent, SVGRenderer])

const props = defineProps<{
  digits: number[]
}>()

type Coefficient = {
  k: number
  re: number
  im: number
  magnitude: number
}

function roundToInteger(value: number) {
  const rounded = Math.round(value)
  return Object.is(rounded, -0) ? 0 : rounded
}

function buildCoefficients(values: number[]): Coefficient[] {
  const size = values.length

  return Array.from({ length: size }, (_, k) => {
    let re = 0
    let im = 0

    for (let index = 0; index < size; index += 1) {
      const angle = (-2 * Math.PI * k * index) / size
      re += values[index]! * Math.cos(angle)
      im += values[index]! * Math.sin(angle)
    }

    return {
      k,
      re: roundToInteger(re),
      im: roundToInteger(im),
      magnitude: roundToInteger(Math.hypot(re, im))
    }
  })
}

const coefficients = computed(() => buildCoefficients(props.digits))
const dc = computed(() => coefficients.value[0]?.re ?? 0)

const chartOption = computed(() => ({
  animationDuration: 280,
  textStyle: {
    fontFamily: 'monospace'
  },
  aria: {
    enabled: true,
    label: {
      enabled: true,
      description: '取整后的傅里叶系数：每个频率的实部、虚部与模。'
    }
  },
  tooltip: {
    trigger: 'axis',
    confine: true,
    backgroundColor: '#17120b',
    borderColor: '#ffc107',
    borderWidth: 2,
    textStyle: {
      color: '#ffc107',
      fontFamily: 'monospace',
      fontSize: 12
    }
  },
  legend: {
    top: 0,
    itemWidth: 14,
    itemHeight: 10,
    textStyle: {
      color: '#17120b',
      fontFamily: 'monospace',
      fontWeight: 'bold'
    }
  },
  grid: {
    left: 44,
    right: 20,
    top: 44,
    bottom: 40
  },
  xAxis: {
    type: 'category',
    data: coefficients.value.map((coefficient) => `k=${coefficient.k}`),
    axisLine: { lineStyle: { color: '#17120b', width: 2 } },
    axisTick: { show: false },
    axisLabel: { color: '#17120b', fontWeight: 'bold' }
  },
  yAxis: {
    type: 'value',
    name: '取整值',
    nameTextStyle: { color: '#17120b', fontWeight: 'bold' },
    axisLine: { show: true, lineStyle: { color: '#17120b', width: 2 } },
    splitLine: { lineStyle: { color: '#e3d6c2' } },
    axisLabel: { color: '#17120b' }
  },
  series: [
    {
      name: 'Re',
      type: 'bar',
      data: coefficients.value.map((coefficient) => coefficient.re),
      itemStyle: { color: '#ff6a00', borderColor: '#17120b', borderWidth: 1 }
    },
    {
      name: 'Im',
      type: 'bar',
      data: coefficients.value.map((coefficient) => coefficient.im),
      itemStyle: { color: '#d81e2c', borderColor: '#17120b', borderWidth: 1 }
    },
    {
      name: '|X[k]|',
      type: 'line',
      data: coefficients.value.map((coefficient) => coefficient.magnitude),
      symbol: 'square',
      symbolSize: 8,
      lineStyle: { color: '#17120b', width: 2 },
      itemStyle: { color: '#ffc107', borderColor: '#17120b', borderWidth: 1 }
    }
  ]
}))

const initOptions = { renderer: 'svg' as const }
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        <p class="kicker mb-2">DISCRETE FOURIER / 离散傅里叶</p>
        <h3 class="h2 fw-bolder mb-2">每个频率，落回哪个整数？</h3>
        <p class="text-secondary mb-0">
          把十位数字看成实序列，做离散傅里叶变换，再把每个复系数的实部与虚部分别四舍五入。
        </p>
      </div>
      <BBadge variant="dark" class="fs-6">
        DC = 数字和 = {{ dc }}
      </BBadge>
    </div>

    <div class="formula-box">
      <MathFormula
        formula="X[k] = \sum_{n=0}^{N-1} x[n]\,e^{-2\pi i kn/N}"
        display-mode
      />
      <MathFormula
        formula="\hat{X}[k] = \operatorname{round}(\operatorname{Re} X[k]) + \operatorname{round}(\operatorname{Im} X[k])\,i"
        display-mode
      />
    </div>

    <div
      class="chart-frame ratio ratio-16x9 mb-3"
      role="img"
      aria-label="取整后的傅里叶系数图：各频率的实部、虚部与模"
    >
      <div class="w-100 h-100">
        <VChart :option="chartOption" :init-options="initOptions" autoresize />
      </div>
    </div>

    <div class="table-responsive map-table">
      <table class="table table-sm table-bordered align-middle text-center">
        <caption class="px-2 pt-2 mb-0 small text-secondary">
          X[k] → 取整后的复系数（k = 0, 1, …, 9）
        </caption>
        <thead class="table-dark">
          <tr>
            <th scope="col">k</th>
            <th scope="col">Re</th>
            <th scope="col">Im</th>
            <th scope="col">|X[k]|</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="coefficient in coefficients" :key="coefficient.k" :class="coefficient.k === 0 ? 'table-warning' : ''">
            <th scope="row">{{ coefficient.k }}</th>
            <td>{{ coefficient.re }}</td>
            <td>{{ coefficient.im }}</td>
            <td>{{ coefficient.magnitude }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="map-note">
      k = 0 是直流分量，正好等于十位数字之和；k 越大，对应变化越快的频率。
      因为输入是实数，取整后的系数仍近似满足共轭对称：X[N−k] 与 X[k] 的实部相同、虚部相反。
    </p>
  </div>
</template>
