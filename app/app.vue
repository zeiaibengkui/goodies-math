<script setup lang="ts">
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
