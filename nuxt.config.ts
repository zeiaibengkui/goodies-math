// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@vueuse/nuxt/module', '@bootstrap-vue-next/nuxt', '@sidebase/nuxt-auth'],
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    'katex/dist/katex.min.css',
    '~/assets/scss/main.scss'
  ],
  auth: {
    baseURL: process.env.AUTH_ORIGIN || 'http://localhost:3000/api/auth',
    provider: {
      type: 'authjs'
    }
  },
  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET,
    pgliteDataDir: process.env.PGLITE_DATA_DIR || '.data/pglite'
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
