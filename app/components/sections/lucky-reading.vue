<script setup lang="ts">
import { useLuckyStore } from '~/stores/lucky'
import { analyzeLucky } from '~/utils/lucky'

const lucky = useLuckyStore()
const luckyReading = computed(() => analyzeLucky(lucky.digits))
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
