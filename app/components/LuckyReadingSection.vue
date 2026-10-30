<script setup lang="ts">
import { useLuckyStore } from '~/stores/lucky'
import { analyzeLucky } from '~/utils/lucky'

const lucky = useLuckyStore()
const numberInput = ref('')
const inputError = ref('')
const luckyReading = computed(() => analyzeLucky(lucky.digits))

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
</script>

<template>
  <section id="lucky-reading" class="band band--reading">
    <BContainer>
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
        <div class="flex-grow-1">
          <p class="kicker">03 / 数字预言</p>
          <h2 class="display-5 fw-bolder mb-0">
            这串数字，<br class="d-lg-none"><span class="text-primary">在替你说什么？</span>
          </h2>
        </div>
        <p class="section-meta d-none d-lg-block mb-1">{{ lucky.sourceLabel }}</p>
      </div>

      <form class="oracle-form" @submit.prevent="readNumber">
        <div class="row g-3 align-items-end">
          <div class="col-lg-4">
            <p class="kicker kicker--warning mb-1">YOUR NUMBER / 自选解读</p>
            <label for="lucky-number" class="h4 fw-bolder text-white d-block mb-0">
              把你的十位数字交给我
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
                placeholder="例如 0812081624"
                aria-describedby="lucky-number-help"
                :aria-invalid="inputError ? 'true' : undefined"
                class="oracle-input"
              />
              <BButton type="submit" variant="warning">
                <span class="d-none d-sm-inline">解读号码</span>
                <span class="d-sm-none">解读</span>
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
              恰好 10 位数字，允许前导 0。解读描述数字结构，不改变任何中奖概率。
            </p>
          </div>
        </div>
      </form>

      <article class="panel oracle-card" aria-live="polite">
        <header class="oracle-header">
          <div>
            <p class="kicker kicker--warning mb-2">
              {{ lucky.sourceLabel }} · {{ lucky.drawLabel }}
            </p>
            <h3 class="display-6 fw-bolder mb-0">数字预言</h3>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <BBadge
              v-for="keyword in luckyReading.keywords"
              :key="keyword"
              variant="warning"
            >
              {{ keyword }}
            </BBadge>
          </div>
        </header>

        <div class="oracle-body">
          <BRow class="g-4">
            <BCol lg="5">
              <p class="kicker mb-2">ORACLE / 给你的预言</p>
              <blockquote class="display-6 fw-bolder lh-sm mb-4">“{{ luckyReading.prophecy }}”</blockquote>
              <p class="text-secondary mb-0">{{ luckyReading.summary }}</p>
            </BCol>

            <BCol lg="7">
              <div
                v-for="(signal, index) in luckyReading.signals"
                :key="signal.title"
                class="oracle-signal"
              >
                <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <BBadge variant="dark">0{{ index + 1 }}</BBadge>
                  <span class="small text-danger fw-bolder">{{ signal.kicker }}</span>
                </div>
                <h4 class="h5 fw-bolder mb-2">{{ signal.title }}</h4>
                <p class="mb-0">{{ signal.detail }}</p>
              </div>
            </BCol>
          </BRow>
        </div>

        <footer class="oracle-footer">
          <span>{{ lucky.number }}</span>
          <span>仅供娱乐 / NOT A PREDICTION</span>
        </footer>
      </article>
    </BContainer>
  </section>
</template>
