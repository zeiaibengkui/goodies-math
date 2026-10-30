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
          <a href="#distributions">逐位分布</a>
          <a href="#number-mappings">数字映射</a>
          <a href="#pricing">付费计划</a>
          <a href="#account-panel">账户</a>
          <BBadge variant="danger">LIVE ODDS</BBadge>
          <span class="year d-none d-sm-inline">EST. 2026</span>
        </nav>
      </div>
    </BContainer>
  </header>
</template>
