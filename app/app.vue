<script setup lang="ts">
import AppFooter from '~/components/app/footer.vue'
import AppNav from '~/components/app/nav.vue'
import DigitDistributionsSection from '~/components/sections/distributions.vue'
import HeroSection from '~/components/sections/hero.vue'
import LuckyReadingSection from '~/components/sections/lucky-reading.vue'
import MathFactSection from '~/components/sections/math-fact.vue'
import NumberMappingsSection from '~/components/sections/number-mappings.vue'
import PricingSection from '~/components/sections/pricing.vue'
import { useLuckyStore } from '~/stores/lucky'

const lucky = useLuckyStore()

onBeforeUnmount(() => lucky.cancelDraw())

useHead({
  title: '拾光概率室 · 十位号码的幸运预言与离散数学',
  meta: [
    {
      name: 'description',
      content: '随机开一注十位号码，或输入你的号码，读取它的幸运结构与离散数学事实。仅供娱乐。'
    }
  ],
  htmlAttrs: { lang: 'zh-CN' }
})
</script>

<template>
  <BApp>
    <NuxtRouteAnnouncer />
    <div class="site-shell">
      <div class="top-strip" aria-hidden="true" />
      <AppNav />
      <main class="flex-grow-1">
        <HeroSection />
        <DigitDistributionsSection />
        <LuckyReadingSection />
        <MathFactSection />
        <NumberMappingsSection />
        <PricingSection />
      </main>
      <AppFooter />
    </div>
  </BApp>
</template>
