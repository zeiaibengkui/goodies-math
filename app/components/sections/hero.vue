<script setup lang="ts">
import { useLuckyStore } from '~/stores/lucky'
import { useUiStore } from '~/stores/ui'

const lucky = useLuckyStore()
const ui = useUiStore()

function scrollToLucky() {
  if (!import.meta.client) return
  void nextTick(() => {
    document.getElementById('lucky-reading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function openNumberInput(event: MouseEvent) {
  event.preventDefault()
  ui.revealDetails()
  void nextTick(() => {
    document.getElementById('distributions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

async function drawAndScroll() {
  const nextDigits = await lucky.draw()
  if (nextDigits) scrollToLucky()
}

function digitTileClass(digit: number) {
  if (digit === 8) return 'digit-tile--eight'
  return digit % 2 === 0 ? 'digit-tile--even' : 'digit-tile--odd'
}
</script>

<template>
  <section class="band band--hero">
    <BContainer>
      <BRow class="align-items-center g-4 g-lg-5">
        <BCol lg="7">
          <p class="hero-chip">随机号码 · 幸运预言实验</p>

          <h1 class="display-3 fw-bolder lh-1 mb-4">
            十位数字，<br>
            <span class="text-danger">一场幸运</span><span class="text-primary">显形</span>。
          </h1>

          <p class="fs-5 mb-4">
            按一下按钮按逐位分布开号，或输入你自己的十位数字。概率室会从数字结构里找出一段幸运预言，再用离散数学告诉你这注号码有多稀有。
          </p>

          <div class="d-flex flex-wrap align-items-center gap-3">
            <BButton
              variant="primary"
              size="lg"
              :disabled="lucky.isDrawing"
              @click="drawAndScroll"
            >
              <span>{{ lucky.isDrawing ? '正在洗牌…' : '开出一注 / 听预言' }}</span>
              <span class="ms-3" aria-hidden="true">{{ lucky.isDrawing ? '···' : '→' }}</span>
            </BButton>

            <a href="#distributions" class="btn btn-outline-dark" @click="openNumberInput">
              输入我的号码 <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div class="d-flex flex-wrap gap-2 mt-4">
            <BBadge variant="dark">逐位独立抽样</BBadge>
            <BBadge variant="danger">LCG / 32-bit</BBadge>
            <BBadge variant="warning">样本 = 1</BBadge>
          </div>

          <p class="small text-secondary mt-4 mb-0">
            每个位置按当前分布独立抽样，种子由健康检查延迟、时间与浏览器熵哈希而成。本页仅作数学教育与娱乐。
          </p>
        </BCol>

        <BCol lg="5">
          <article class="ticket">
            <div class="ticket__top">
              <span>TICKET / {{ lucky.drawLabel }}</span>
              <span>{{ lucky.ticketStatus }}</span>
            </div>

            <div class="ticket__body">
              <div class="d-flex justify-content-between align-items-center small mb-3">
                <span class="text-warning">10 DIGITS</span>
                <span class="text-white-50">0—9</span>
              </div>

              <div class="row row-cols-5 g-2" aria-label="当前十位号码">
                <div v-for="(digit, index) in lucky.digits" :key="`${lucky.drawCount}-${index}`" class="col">
                  <div class="digit-tile" :class="digitTileClass(digit)">
                    <span class="digit-value">{{ digit }}</span>
                  </div>
                </div>
              </div>

              <div class="ticket-stats">
                <div class="ticket-stat">
                  <div class="ticket-stat__label">SUM</div>
                  <div class="ticket-stat__value">{{ lucky.digitSum }}</div>
                </div>
                <div class="ticket-stat">
                  <div class="ticket-stat__label">KINDS</div>
                  <div class="ticket-stat__value">{{ lucky.distinctCount }}</div>
                </div>
                <div class="ticket-stat">
                  <div class="ticket-stat__label">8s</div>
                  <div class="ticket-stat__value">{{ lucky.eightCount }}</div>
                </div>
                <div class="ticket-stat">
                  <div class="ticket-stat__label">ODD:EVEN</div>
                  <div class="ticket-stat__value">{{ lucky.oddCount }}:{{ 10 - lucky.oddCount }}</div>
                </div>
              </div>
            </div>

            <div class="ticket__foot">
              <span>P(含 8) / 65.13%</span>
              <span>MATH IS NOT LUCK</span>
            </div>
          </article>
        </BCol>
      </BRow>
    </BContainer>
  </section>
</template>
