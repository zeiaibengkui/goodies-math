// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@vueuse/nuxt/module', '@bootstrap-vue-next/nuxt'],
  css: ['bootstrap/dist/css/bootstrap.min.css', 'katex/dist/katex.min.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
