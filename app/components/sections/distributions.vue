<script setup lang="ts">
import MathFormula from '~/components/math/math-formula.vue'
import { useLuckyStore } from '~/stores/lucky'
import {
  DIGIT_DISTRIBUTIONS,
  DISTRIBUTION_OPTIONS,
  type DigitDistributionId
} from '~/utils/distributions'

const lucky = useLuckyStore()
const numberInput = ref('')
const inputError = ref('')

watch(numberInput, (value) => {
  const sanitized = value.replace(/\D/g, '').slice(0, 10)
  if (sanitized !== value) numberInput.value = sanitized
  if (inputError.value) inputError.value = ''
})

function scrollToLucky() {
  if (!import.meta.client) return
  void nextTick(() => {
    document.getElementById('lucky-reading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function readNumber() {
  const value = numberInput.value.trim()

  if (!/^\d{10}$/.test(value)) {
    inputError.value = '请输入恰好 10 位数字（0–9），允许前导 0。'
    return
  }

  inputError.value = ''
  lucky.reveal(
    value.split('').map((digit) => Number(digit)),
    'custom'
  )
  scrollToLucky()
}

function setDigit(index: number, value: unknown) {
  const digit = Number(value)
  if (!Number.isInteger(digit)) return
  lucky.setDigit(index, digit)
}

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
        真实中奖号码为均匀分布，因此分析采用均匀分布。你可以直接输入整串号码，或在下方逐位选择数字；
        也可以把任意一位改成二项、泊松或正态分布，开号器会按该位置的分布独立抽样。
        数学注脚仍以均匀 0–9 为基线，便于对照。
      </p>

      <form class="oracle-form" @submit.prevent="readNumber">
        <div class="row g-3 align-items-end">
          <div class="col-lg-4">
            <p class="kicker kicker--warning mb-1">YOUR NUMBER / 自选号码</p>
            <label for="lucky-number" class="h4 fw-bolder text-white d-block mb-0">
              输入整串十位号码
            </label>
          </div>
          <div class="col-lg-8">
            <div class="input-group">
              <BFormInput
                id="lucky-number"
                v-model="numberInput"
                inputmode="numeric"
                autocomplete="off"
                maxlength="10"
                placeholder="例如 1234567890"
                aria-describedby="lucky-number-help"
                :aria-invalid="inputError ? 'true' : undefined"
                class="oracle-input"
              />
              <BButton type="submit" variant="warning">
                <span class="d-none d-sm-inline">填入号码</span>
                <span class="d-sm-none">填入</span>
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
              恰好 10 位数字，允许前导 0。填入后也可以在下方逐位微调。
            </p>
          </div>
        </div>
      </form>

      <div class="panel distribution-studio">
        <BRow class="g-3 row-cols-2 row-cols-md-3 row-cols-xl-5">
          <BCol
            v-for="(distributionId, index) in lucky.digitDistributions"
            :key="index"
          >
            <div class="dist-card">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <span class="dist-index">#{{ index + 1 }}</span>
                <BFormSelect
                  :id="`digit-${index}`"
                  :model-value="String(lucky.digits[index])"
                  :aria-label="`第 ${index + 1} 位数字`"
                  size="sm"
                  class="dist-digit-select"
                  @update:model-value="(value) => setDigit(index, value)"
                >
                  <option v-for="digit in 10" :key="digit" :value="String(digit - 1)">
                    {{ digit - 1 }}
                  </option>
                </BFormSelect>
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
