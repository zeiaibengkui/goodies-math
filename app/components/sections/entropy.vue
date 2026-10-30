<script setup lang="ts">
import MathFormula from '~/components/math/math-formula.vue'
import { useUiStore } from '~/stores/ui'
import {
  FIXED_ODDS,
  LUCKY_INFORMATION_BITS,
  LUCKY_RATIO,
  REAL_INFORMATION_BITS,
  selfInformationBits
} from '~/utils/entropy'

const ui = useUiStore()
const ratioPercent = `${(LUCKY_RATIO * 100).toFixed(2)}%`

function formatBits(value: number) {
  return `${value.toFixed(3)} bit`
}

function formatRatio(value: number) {
  return `${(value * 100).toFixed(2)}%`
}

function revealDetails() {
  ui.revealDetails()
  if (!import.meta.client) return
  void nextTick(() => {
    document.getElementById('distributions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
</script>

<template>
  <section id="entropy" class="band band--entropy">
    <BContainer>
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
        <div class="flex-grow-1">
          <p class="kicker">01 / 信息熵</p>
          <h2 class="display-5 fw-bolder mb-0">
            幸运，<span class="text-primary">有多少比特？</span>
          </h2>
        </div>
        <p class="section-meta d-none d-lg-block mb-1">INFORMATION ENTROPY</p>
      </div>

      <p class="section-lead mb-4">
        十位号码在均匀分布下的真实信息熵是 −log₂(0.1¹⁰) ≈ {{ formatBits(REAL_INFORMATION_BITS) }}。
        把 04 数学注脚「固定概率速查」里四个概率的自信息相加，得到幸运信息熵；
        它占真实信息熵的比例，就是幸运比率。
      </p>

      <BRow class="g-3 mb-4">
        <BCol md="4">
          <div class="entropy-card">
            <p class="entropy-label">REAL / 真实信息熵</p>
            <p class="entropy-value">{{ formatBits(REAL_INFORMATION_BITS) }}</p>
            <p class="entropy-note">均匀分布下，每个十位号码串的概率都是 10⁻¹⁰。</p>
            <div class="entropy-formula">
              <MathFormula formula="-\log_2\left(0.1^{10}\right) = 10\log_2 10" />
            </div>
          </div>
        </BCol>

        <BCol md="4">
          <div class="entropy-card">
            <p class="entropy-label">LUCKY / 幸运信息熵</p>
            <p class="entropy-value">{{ formatBits(LUCKY_INFORMATION_BITS) }}</p>
            <p class="entropy-note">04 固定概率速查中四个概率的自信息之和。</p>
            <div class="entropy-formula">
              <MathFormula formula="\sum_{i=1}^{4} -\log_2 p_i" />
            </div>
          </div>
        </BCol>

        <BCol md="4">
          <div class="entropy-card entropy-card--ratio">
            <p class="entropy-label">RATIO / 幸运比率</p>
            <p class="entropy-value entropy-value--ratio">{{ formatRatio(LUCKY_RATIO) }}</p>
            <p class="entropy-note">幸运信息熵 ÷ 真实信息熵。</p>
            <div class="entropy-formula">
              <MathFormula formula="\frac{S_{\mathrm{lucky}}}{S_{\mathrm{real}}}" />
            </div>
          </div>
        </BCol>
      </BRow>

      <div
        class="entropy-meter"
        role="img"
        :aria-label="`幸运比率 ${ratioPercent}`"
      >
        <div class="entropy-meter__fill" :style="{ width: ratioPercent }" />
      </div>

      <div class="entropy-table-wrap">
        <table class="entropy-table">
          <thead>
            <tr>
              <th scope="col">04 / 固定事件</th>
              <th scope="col">概率 p</th>
              <th scope="col">−log₂ p</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in FIXED_ODDS" :key="item.label">
              <td>{{ item.label }}</td>
              <td>{{ item.value }}</td>
              <td>{{ formatBits(selfInformationBits(item.probability)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="entropy-note mb-4">
        四个事件并不互斥；幸运信息熵是按本节约定对 04 固定概率的自信息加总，只用于与真实信息熵比较。
      </p>

      <BButton v-if="!ui.showDetails" variant="dark" @click="revealDetails">
        查看详情 / 逐位分布与数字映射 <span aria-hidden="true">↓</span>
      </BButton>
    </BContainer>
  </section>
</template>
