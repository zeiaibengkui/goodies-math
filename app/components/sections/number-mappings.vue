<script setup lang="ts">
import FourierRoundMap from '~/components/math/fourier-round-map.vue'
import KmpFailMap from '~/components/math/kmp-fail-map.vue'
import ManacherMap from '~/components/math/manacher-map.vue'
import { useLuckyStore } from '~/stores/lucky'

const lucky = useLuckyStore()
</script>

<template>
  <section
    id="number-mappings"
    class="band band--mappings"
    aria-labelledby="number-mappings-title"
  >
    <BContainer>
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
        <div class="flex-grow-1">
          <p class="kicker kicker--warning">05 / 数字映射</p>
          <h2 id="number-mappings-title" class="display-5 fw-bolder mb-0">
            一个号码，<br class="d-lg-none"><span class="text-warning">三种数字指纹。</span>
          </h2>
        </div>
        <p class="section-meta d-none d-lg-block mb-1">KMP · MANACHER · DFT</p>
      </div>

      <p class="section-lead text-white mb-4">
        同一串十位数字，分别经过前缀函数、回文半径和傅里叶变换，映射成三组可以逐位对照的数字。
      </p>

      <div class="map-input panel panel--warning panel--thin mb-4">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <p class="kicker mb-1">INPUT / 当前十位号码</p>
            <p class="number-display mb-0">{{ lucky.number }}</p>
          </div>
          <p class="small fw-bolder mb-0">
            输入或开出一注新号码，<br class="d-none d-md-inline">三张映射会同步更新。
          </p>
        </div>
      </div>

      <BAccordion flush class="map-accordion">
        <BAccordionItem
          title="01 / KMP FAIL · 前缀函数"
          class="map-accordion-item"
          body-class="p-3 p-md-4"
          visible
        >
          <KmpFailMap :digits="lucky.digits" />
        </BAccordionItem>

        <BAccordionItem
          title="02 / MANACHER · 回文半径"
          class="map-accordion-item"
          body-class="p-3 p-md-4"
        >
          <ManacherMap :digits="lucky.digits" />
        </BAccordionItem>

        <BAccordionItem
          title="03 / FOURIER · 傅里叶取整"
          class="map-accordion-item map-accordion-item--last"
          body-class="p-3 p-md-4"
        >
          <FourierRoundMap :digits="lucky.digits" />
        </BAccordionItem>
      </BAccordion>
    </BContainer>
  </section>
</template>
