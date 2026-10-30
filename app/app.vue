<script setup lang="ts">
import AppFooter from '~/components/app/footer.vue'
import AppNav from '~/components/app/nav.vue'
import DigitDistributionsSection from '~/components/sections/distributions.vue'
import EntropySection from '~/components/sections/entropy.vue'
import HeroSection from '~/components/sections/hero.vue'
import LuckyReadingSection from '~/components/sections/lucky-reading.vue'
import MathFactSection from '~/components/sections/math-fact.vue'
import NumberMappingsSection from '~/components/sections/number-mappings.vue'
import PricingSection from '~/components/sections/pricing.vue'
import { useLuckyStore } from '~/stores/lucky'
import { useUiStore } from '~/stores/ui'

const lucky = useLuckyStore()
const ui = useUiStore()
let revealObserver: IntersectionObserver | null = null
let revealMutation: MutationObserver | null = null

function initReveal() {
  const viewportHeight = window.innerHeight

  document.querySelectorAll('.band').forEach((band) => {
    const rect = band.getBoundingClientRect()
    if (rect.top < viewportHeight && rect.bottom > 0) {
      band.classList.add('is-visible')
    }
  })

  document.documentElement.classList.add('motion-ready')

  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        revealObserver?.unobserve(entry.target)
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  )

  const observeBands = () => {
    document.querySelectorAll('.band:not(.is-visible)').forEach((band) => {
      revealObserver?.observe(band)
    })
  }

  observeBands()
  revealMutation = new MutationObserver(observeBands)
  const main = document.querySelector('main')
  if (main) revealMutation.observe(main, { childList: true })
}

onMounted(() => {
  if (!import.meta.client) return
  if (['#distributions', '#number-mappings'].includes(window.location.hash)) {
    ui.revealDetails()
  }
  initReveal()
})

onBeforeUnmount(() => {
  lucky.cancelDraw()
  revealObserver?.disconnect()
  revealMutation?.disconnect()
})

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
        <EntropySection />
        <DigitDistributionsSection v-if="ui.showDetails" />
        <LuckyReadingSection />
        <MathFactSection />
        <NumberMappingsSection v-if="ui.showDetails" />
        <PricingSection />
      </main>
      <AppFooter />
    </div>
  </BApp>
</template>
