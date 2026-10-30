<script setup lang="ts">
import { plans, type Plan } from '~~/shared/plans'
import { useSectionScroll } from '~/composables/useSectionScroll'
import { useAccountStore } from '~/stores/account'

const account = useAccountStore()
const { signIn } = useAuth()
const { scrollIntoNextSection } = useSectionScroll()

const selectedPlan = ref<Plan | null>(null)
const pendingPlan = ref<Plan | null>(null)
const planMessage = ref('')
const authMode = ref<'login' | 'register'>('login')
const authName = ref('')
const authEmail = ref('')
const authPassword = ref('')
const authError = ref('')
const authPending = ref(false)

const isAuthenticated = computed(() => account.isAuthenticated)
const currentPlan = computed(() => account.currentPlan)

function scrollToLucky() {
  void scrollIntoNextSection('lucky-reading')
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string; message?: string } }).data
    return data?.statusMessage ?? data?.message ?? fallback
  }
  return fallback
}

async function selectPlan(plan: Plan) {
  planMessage.value = ''
  try {
    await $fetch('/api/plans/select', {
      method: 'POST',
      body: { planId: plan.id }
    })
    account.currentPlanId = plan.id
    selectedPlan.value = plan
    planMessage.value = `已将「${plan.name}」保存到你的账户。`
  } catch (error) {
    planMessage.value = getErrorMessage(error, '方案保存失败，请稍后重试。')
  }
}

async function choosePlan(plan: Plan) {
  if (plan.free) {
    selectedPlan.value = null
    pendingPlan.value = null
    scrollToLucky()
    return
  }

  selectedPlan.value = plan
  if (!isAuthenticated.value) {
    pendingPlan.value = plan
    authError.value = `登录后会自动保存「${plan.name}」方案。`
    await scrollIntoNextSection('account-panel')
    return
  }

  await selectPlan(plan)
}

function toggleAuthMode() {
  authMode.value = authMode.value === 'login' ? 'register' : 'login'
  authError.value = ''
}

async function submitAuth() {
  authError.value = ''
  planMessage.value = ''
  authPending.value = true

  try {
    if (authMode.value === 'register') {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: {
          name: authName.value,
          email: authEmail.value,
          password: authPassword.value
        }
      })
    }

    const result = await signIn('credentials', {
      email: authEmail.value.trim(),
      password: authPassword.value,
      redirect: false
    })

    if (result?.error) {
      authError.value = result.error === 'CredentialsSignin' ? '邮箱或密码不正确。' : '登录失败，请重试。'
      return
    }

    authPassword.value = ''
    await account.refresh()

    if (pendingPlan.value) {
      const plan = pendingPlan.value
      pendingPlan.value = null
      await selectPlan(plan)
    }
  } catch (error) {
    authError.value = getErrorMessage(error, '登录失败，请检查邮箱和密码。')
  } finally {
    authPending.value = false
  }
}

async function logout() {
  selectedPlan.value = null
  pendingPlan.value = null
  planMessage.value = ''
  await account.logout()
}
</script>

<template>
  <section
    id="pricing"
    class="band band--pricing"
    aria-labelledby="pricing-title"
  >
    <BContainer>
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
        <div class="flex-grow-1">
          <p class="kicker kicker--warning">06 / 付费计划</p>
          <h2 id="pricing-title" class="display-5 fw-bolder mb-0">
            把预言，<br class="d-lg-none"><span class="text-warning">再往下读一层。</span>
          </h2>
        </div>
        <p class="section-meta d-none d-lg-block mb-1">DEMO PRICING / 未接入支付</p>
      </div>

      <p class="section-lead text-white mb-4">
        三种演示方案，对应不同深度的数字解读。所有概率内容仍可免费查看。
      </p>

      <div id="account-panel" class="panel panel--dark panel--account mb-4">
        <div
          v-if="isAuthenticated"
          class="d-flex flex-wrap align-items-start justify-content-between gap-3"
        >
          <div>
            <p class="kicker kicker--warning mb-1">ACCOUNT / 账户</p>
            <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
              <p class="h5 fw-bolder mb-0">{{ account.displayName }}</p>
              <BBadge variant="warning">{{ account.planLabel }}</BBadge>
            </div>
            <p class="small text-white-50 mb-1">{{ account.user?.email }}</p>
            <p class="small text-white-50 mb-0">
              当前方案：
              <span class="text-warning fw-bolder">{{ currentPlan?.name ?? '未选择付费方案' }}</span>
            </p>
            <p v-if="planMessage" class="small text-warning fw-bolder mt-2 mb-0" role="status">
              {{ planMessage }}
            </p>
          </div>
          <BButton variant="light" @click="logout">退出登录</BButton>
        </div>

        <form v-else @submit.prevent="submitAuth">
          <div class="row g-3 align-items-end">
            <div class="col-lg-4">
              <p class="kicker kicker--warning mb-1">ACCOUNT / 账户</p>
              <p class="h4 fw-bolder text-white mb-0">登录后保存方案</p>
              <p class="small text-white-50 mt-2 mb-0">
                账号与方案存入本地 PGlite；密码使用 scrypt 加盐哈希。
              </p>
            </div>

            <div class="col-lg-8">
              <div class="row g-2">
                <div v-if="authMode === 'register'" class="col-md-4">
                  <label for="auth-name" class="form-label field-label mb-1">昵称</label>
                  <BFormInput
                    id="auth-name"
                    v-model="authName"
                    autocomplete="nickname"
                    maxlength="40"
                    class="auth-input"
                  />
                </div>

                <div class="col-md-4">
                  <label for="auth-email" class="form-label field-label mb-1">邮箱</label>
                  <BFormInput
                    id="auth-email"
                    v-model="authEmail"
                    type="email"
                    autocomplete="email"
                    maxlength="254"
                    required
                    class="auth-input"
                  />
                </div>

                <div class="col-md-4">
                  <label for="auth-password" class="form-label field-label mb-1">密码</label>
                  <BFormInput
                    id="auth-password"
                    v-model="authPassword"
                    type="password"
                    :autocomplete="authMode === 'register' ? 'new-password' : 'current-password'"
                    minlength="8"
                    maxlength="128"
                    required
                    class="auth-input"
                  />
                </div>
              </div>

              <div class="d-flex flex-wrap align-items-center gap-2 mt-3">
                <BButton type="submit" variant="warning" :disabled="authPending">
                  {{ authPending ? '处理中…' : authMode === 'login' ? '登录' : '注册并登录' }}
                </BButton>
                <BButton type="button" variant="light" @click="toggleAuthMode">
                  {{ authMode === 'login' ? '没有账号？注册' : '已有账号？登录' }}
                </BButton>
              </div>

              <p v-if="authError" role="alert" class="small text-warning fw-bolder mt-2 mb-0">
                {{ authError }}
              </p>
              <p v-else class="small text-white-50 mt-2 mb-0">
                密码至少 8 位。登录后回到这里继续选择方案。
              </p>
            </div>
          </div>
        </form>
      </div>

      <BRow class="g-4">
        <BCol v-for="(plan, index) in plans" :key="plan.name" lg="4">
          <article
            class="plan-card panel panel--thin h-100 d-flex flex-column"
            :class="plan.featured ? 'panel--warning' : ''"
          >
            <header class="plan-card__header d-flex justify-content-between align-items-start gap-3">
              <div>
                <p class="plan-code mb-1">{{ plan.code }}</p>
                <h3 class="h4 fw-bolder mb-0">{{ plan.name }}</h3>
              </div>
              <BBadge
                v-if="currentPlan?.id === plan.id"
                variant="dark"
              >
                当前方案
              </BBadge>
              <BBadge v-else-if="plan.featured" variant="danger">推荐</BBadge>
              <span v-else class="plan-index">0{{ index + 1 }}</span>
            </header>

            <div class="plan-card__body p-3 p-md-4 d-flex flex-column flex-grow-1">
              <p class="mb-3">{{ plan.description }}</p>
              <div class="d-flex align-items-end gap-2 mb-4">
                <span class="plan-price">{{ plan.price }}</span>
                <span class="plan-period mb-1">{{ plan.period }}</span>
              </div>

              <ul class="list-unstyled small flex-grow-1 mb-4">
                <li
                  v-for="feature in plan.features"
                  :key="feature"
                  class="plan-feature d-flex gap-2 py-2"
                >
                  <span class="text-danger fw-bolder" aria-hidden="true">✓</span>
                  <span>{{ feature }}</span>
                </li>
              </ul>

              <BButton
                :variant="plan.featured ? 'danger' : 'primary'"
                :disabled="currentPlan?.id === plan.id"
                class="w-100"
                @click="choosePlan(plan)"
              >
                {{ currentPlan?.id === plan.id ? '当前方案' : plan.cta }}
              </BButton>
            </div>
          </article>
        </BCol>
      </BRow>

      <div
        v-if="selectedPlan"
        class="panel panel--warning panel--thin selected-plan mt-4"
        role="status"
      >
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <p class="kicker mb-1">PLAN SELECTED / 已选择</p>
            <p class="h5 fw-bolder mb-1">
              {{ selectedPlan.name }} · {{ selectedPlan.price }} {{ selectedPlan.period }}
            </p>
            <p v-if="currentPlan?.id === selectedPlan.id" class="small mb-0">
              方案已保存到你的账户。支付仍未接入，不会产生扣款。
            </p>
            <p v-else-if="isAuthenticated" class="small mb-0">
              正在保存方案；若失败，请查看上方账户提示。本页不会产生扣款。
            </p>
            <p v-else class="small mb-0">
              登录后会自动保存该方案；本页尚未接入支付，不会产生扣款。
            </p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <BButton variant="dark" @click="scrollToLucky">先体验 →</BButton>
            <BButton variant="light" @click="selectedPlan = null">取消</BButton>
          </div>
        </div>
      </div>

      <p class="small text-white mt-4 mb-0">
        演示价仅用于界面展示；支付、订阅与权益发放均未接入。本页不构成任何投注建议。
      </p>
    </BContainer>
  </section>
</template>
