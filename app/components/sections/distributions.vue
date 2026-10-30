<script setup lang="ts">
import MathFormula from '~/components/math/math-formula.vue'
import { useLuckyStore } from '~/stores/lucky'
import {
  DIGIT_DISTRIBUTIONS,
  DISTRIBUTION_OPTIONS,
  type DigitDistributionId
} from '~/utils/distributions'

const lucky = useLuckyStore()

function setDistribution(index: number, value: unknown) {
  if (typeof value !== 'string') return
  lucky.setDigitDistribution(index, value as DigitDistributionId)
}

function barHeight(probability: number) {
  return `${Math.max(2, (probability / 0.25) * 100)}%`
}

function formatProbability(probability: number) {
  return `${(probability * 100).toFixed(1)}%`
}

function formatSeedTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false })
}
</script>

<template>
  <section id="distributions" class="band band--distributions">
    <BContainer>
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
        <div class="flex-grow-1">
          <p class="kicker">02 / 逐位概率分布</p>
          <h2 class="display-5 fw-bolder mb-0">
            每个位置，<br class="d-lg-none"><span class="text-primary">有自己的命。</span>
          </h2>
        </div>
        <p class="section-meta d-none d-lg-block mb-1">PER-DIGIT DISTRIBUTIONS</p>
      </div>

      <p class="section-lead mb-4">
        默认每位都是均匀分布。把任意一位改成二项、泊松或正态分布，开号器会按该位置的分布独立抽样。
        数学注脚仍以均匀 0–9 为基线，便于对照。
      </p>

      <div class="panel distribution-studio">
        <BRow class="g-3 row-cols-2 row-cols-md-3 row-cols-xl-5">
          <BCol
            v-for="(distributionId, index) in lucky.digitDistributions"
            :key="index"
          >
            <div class="dist-card">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <span class="dist-index">#{{ index + 1 }}</span>
                <span class="dist-current">{{ lucky.digits[index] }}</span>
              </div>

              <BFormSelect
                :id="`dist-${index}`"
                :model-value="distributionId"
                :aria-label="`第 ${index + 1} 位的概率分布`"
                size="sm"
                class="dist-select"
                @update:model-value="(value) => setDistribution(index, value)"
              >
                <option v-for="option in DISTRIBUTION_OPTIONS" :key="option.id" :value="option.id">
                  {{ option.shortName }}
                </option>
              </BFormSelect>

              <div
                class="dist-bars"
                role="img"
                :aria-label="`第 ${index + 1} 位：${DIGIT_DISTRIBUTIONS[distributionId].name} 的概率分布`"
              >
                <div
                  v-for="(probability, digit) in DIGIT_DISTRIBUTIONS[distributionId].probabilities"
                  :key="digit"
                  class="dist-bar-cell"
                  :title="`P(${digit}) = ${formatProbability(probability)}`"
                >
                  <div
                    class="dist-bar"
                    :class="lucky.digits[index] === digit ? 'dist-bar--current' : ''"
                    :style="{ height: barHeight(probability) }"
                  />
                </div>
              </div>

              <div class="dist-axis">
                <span>0</span>
                <span>9</span>
              </div>

              <p class="dist-detail">{{ DIGIT_DISTRIBUTIONS[distributionId].description }}</p>
            </div>
          </BCol>
        </BRow>

        <div class="dist-controls">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span class="section-meta">ALL / 全部设为</span>
            <BButton
              v-for="option in DISTRIBUTION_OPTIONS"
              :key="option.id"
              variant="outline-dark"
              size="sm"
              @click="lucky.setAllDistributions(option.id)"
            >
              {{ option.shortName }}
            </BButton>
          </div>

          <div class="d-flex flex-wrap gap-2">
            <BButton variant="primary" :disabled="lucky.isDrawing" @click="lucky.draw()">
              {{ lucky.isDrawing ? '正在抽样…' : '按当前分布开号' }}
            </BButton>
          </div>
        </div>

        <div class="seed-panel">
          <div class="seed-copy">
            <p class="kicker kicker--warning mb-1">SEED / 线性同余生成器</p>
            <p class="seed-formula">
              <MathFormula formula="s_{n+1} = (1664525\,s_n + 1013904223) \bmod 2^{32}" />
            </p>
            <p v-if="lucky.seedMeta" class="seed-line">
              seed <strong>{{ lucky.seedMeta.seed }}</strong>
              · health {{ lucky.seedMeta.healthMs }}ms
              · {{ formatSeedTimestamp(lucky.seedMeta.timestamp) }}
              · {{ lucky.seedMeta.timezone }}
            </p>
            <p v-else class="seed-line">
              首次开号时读取 /api/health 延迟、User-Agent、时间、时区、屏幕尺寸与 Web Crypto 熵，哈希成种子。
            </p>
            <p v-if="lucky.seedMeta" class="seed-ua">{{ lucky.seedMeta.userAgent }}</p>
          </div>

          <BButton variant="warning" size="sm" :disabled="lucky.isDrawing" @click="lucky.reseed()">
            重新播种
          </BButton>
        </div>
      </div>
    </BContainer>
  </section>
</template>
