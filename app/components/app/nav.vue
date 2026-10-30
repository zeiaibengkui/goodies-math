<script setup lang="ts">
import { useSectionScroll } from '~/composables/useSectionScroll'
import { useAccountStore } from '~/stores/account'
import { useUiStore } from '~/stores/ui'

const ui = useUiStore()
const account = useAccountStore()
const { scrollIntoNextSection } = useSectionScroll()
</script>

<template>
  <header class="app-header sticky-top">
    <BContainer class="py-3">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-3">
          <div class="brand-mark" aria-hidden="true">10</div>
          <div>
            <div class="brand-title">拾光概率室</div>
            <div class="brand-sub">LOTTO / ORACLE & MATH</div>
          </div>
        </div>

        <nav class="app-nav d-flex flex-wrap align-items-center gap-2" aria-label="页面导航">
          <a href="#distributions" @click.prevent="scrollIntoNextSection('distributions')">生成设置</a>
          <a href="#number-mappings" @click.prevent="scrollIntoNextSection('number-mappings')">数字映射</a>
          <a href="#pricing" @click.prevent="scrollIntoNextSection('pricing')">付费计划</a>

          <button
            type="button"
            class="expert-toggle"
            :class="{ 'expert-toggle--on': ui.expertMode }"
            :aria-pressed="ui.expertMode"
            @click="ui.toggleExpertMode()"
          >
            <span class="expert-toggle__dot" aria-hidden="true" />
            专家模式
          </button>

          <BBadge variant="danger">LIVE ODDS</BBadge>
          <span class="year d-none d-sm-inline">EST. 2026</span>

          <BDropdown
            v-if="account.isAuthenticated"
            variant="warning"
            toggle-class="account-toggle"
            menu-class="account-menu"
            end
          >
            <template #button-content>
              <span class="account-name">{{ account.displayName }}</span>
              <BBadge
              v-if="account.currentPlan"
                variant="danger"
                class="account-plan"
              >
                {{ account.planLabel }}
              </BBadge>
            </template>

            <BDropdownHeader class="account-menu__head">
              <span class="account-menu__name">{{ account.displayName }}</span>
              <span class="account-menu__email">{{ account.user?.email }}</span>
            </BDropdownHeader>
            <BDropdownDivider />
            <BDropdownItem @click="scrollIntoNextSection('account-panel')">账户与方案</BDropdownItem>
            <BDropdownItem @click="scrollIntoNextSection('pricing')">查看付费计划</BDropdownItem>
            <BDropdownDivider />
            <BDropdownItem @click="account.logout()">退出登录</BDropdownItem>
          </BDropdown>
          <a v-else href="#account-panel" @click.prevent="scrollIntoNextSection('account-panel')">登录 / 注册</a>
        </nav>
      </div>
    </BContainer>
  </header>
</template>
