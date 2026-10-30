import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { findPlan } from '~~/shared/plans'

export const useAccountStore = defineStore('account', () => {
  const { status, data, signOut, getSession } = useAuth()
  const currentPlanId = ref<string | null>(null)

  const isAuthenticated = computed(() => status.value === 'authenticated')
  const user = computed(() => data.value?.user ?? null)
  const displayName = computed(() => user.value?.name?.trim() || user.value?.email || '账户')
  const currentPlan = computed(() => findPlan(currentPlanId.value) ?? null)
  const planLabel = computed(() => currentPlan.value?.name ?? '免费版')

  async function loadCurrentPlan() {
    if (!isAuthenticated.value) {
      currentPlanId.value = null
      return
    }

    try {
      const result = await $fetch<{ plan: { id: string } | null }>('/api/plans/current')
      currentPlanId.value = result.plan ? findPlan(result.plan.id)?.id ?? null : null
    } catch {
      currentPlanId.value = null
    }
  }

  async function refresh() {
    await getSession()
    await loadCurrentPlan()
  }

  async function logout() {
    currentPlanId.value = null

    try {
      await signOut({ callbackUrl: '/', redirect: false })
    } catch {
      const { csrfToken } = await $fetch<{ csrfToken: string }>('/api/auth/csrf')
      await $fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          csrfToken,
          callbackUrl: '/',
          json: 'true'
        })
      })
    }

    await getSession()

    if (import.meta.client) {
      window.location.assign('/')
    }
  }

  watch(
    status,
    (value) => {
      if (!import.meta.client) return
      if (value === 'authenticated') {
        void loadCurrentPlan()
      } else if (value === 'unauthenticated') {
        currentPlanId.value = null
      }
    },
    { immediate: true }
  )

  return {
    isAuthenticated,
    user,
    displayName,
    currentPlanId,
    currentPlan,
    planLabel,
    loadCurrentPlan,
    refresh,
    logout
  }
})
