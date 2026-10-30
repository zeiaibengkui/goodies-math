<script setup lang="ts">
import MathFormula from '~/components/math/math-formula.vue'
import { useLuckyStore } from '~/stores/lucky'
import {
  analyzeLuckyInformation,
  FIXED_ODDS,
  REAL_INFORMATION_BITS,
  selfInformationBits
} from '~/utils/entropy'

const lucky = useLuckyStore()
const luckyInfo = computed(() => analyzeLuckyInformation(lucky.digits))
const luckyRatio = computed(() => luckyInfo.value.bits / REAL_INFORMATION_BITS)
const ratioPercent = computed(() => `${(luckyRatio.value * 100).toFixed(2)}%`)
const rows = computed(() =>
  FIXED_ODDS.map((item) => ({
    label: item.label,
    value: item.value,
    bits: selfInformationBits(item.probability),
    matched: item.matches(lucky.digits)
  }))
)

function formatBits(value: number) {
  return `${value.toFixed(3)} bit`
}

function formatRatio(value: number) {
  return `${(value * 100).toFixed(2)}%`
}
</script>

<template>
  <section id="entropy" class="band band--entropy">
    <BContainer>
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
        <div class="flex-grow-1">
          <p class="kicker">02 / 信息熵</p>
          <h2 class="display-5 fw-bolder mb-0">
            幸运，<span class="text-primary">有多少比特？</span>
          </h2>
        </div>
        <p class="section-meta d-none d-lg-block mb-1">INFORMATION ENTROPY</p>
      </div>

      <p class="section-lead mb-4">
        十位号码在均匀分布下的真实信息熵是 −log₂(0.1¹⁰) ≈ {{ formatBits(REAL_INFORMATION_BITS) }}。
        在 04 数学注脚「固定概率速查」的四个事件里，找出本注命中的那些，取最大的自信息作为幸运比特；
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
            <p class="entropy-label">LUCKY / 幸运比特</p>
            <p class="entropy-value">{{ formatBits(luckyInfo.bits) }}</p>
            <p class="entropy-note">
              本注命中的最稀有事件：{{ luckyInfo.best?.label ?? '—' }}。
            </p>
            <div class="entropy-formula">
              <MathFormula formula="\max_{i \in \mathrm{hit}} -\log_2 p_i" />
            </div>
          </div>
        </BCol>

        <BCol md="4">
          <div class="entropy-card entropy-card--ratio">
            <p class="entropy-label">RATIO / 幸运比率</p>
            <p class="entropy-value">{{ formatRatio(luckyRatio) }}</p>
            <p class="entropy-note">幸运比特 ÷ 真实信息熵。</p>
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
              <th scope="col">本注</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.label"
              :class="{ 'entropy-table__row--match': row.matched }"
            >
              <td>{{ row.label }}</td>
              <td>{{ row.value }}</td>
              <td>{{ formatBits(row.bits) }}</td>
              <td>{{ row.matched ? '命中' : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="entropy-note mb-0">
        四个事件并不互斥；幸运比特取本注命中事件中自信息最大的一个，只用于与真实信息熵比较。
      </p>
    </BContainer>
  </section>
</template>
