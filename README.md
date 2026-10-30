# 拾光概率室

十位号码的幸运预言与离散数学实验。开一注随机号码，或输入自己的十位数字，查看它的幸运信息熵、逐位概率分布和几种数字映射。

![首页截图](docs/screenshot.png)

## 功能

- 逐位独立抽样，种子由健康检查延迟、时间、时区与浏览器熵哈希而成（LCG / 32-bit）
- 均匀、二项、泊松、正态四种逐位概率分布，专家模式下可逐位调整
- 信息熵、幸运比特与幸运比率
- 数字映射：KMP fail 函数、Manacher 回文半径、FFT 取整
- 账户与三种演示付费计划（NuxtAuth + PGlite 本地持久化）

## 技术栈

Nuxt 4 · Vue 3 · TypeScript · BootstrapVueNext · Pinia · VueUse · KaTeX · ECharts

## 本地运行

需要 Node.js 20+ 与 pnpm。

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:3000>。

```bash
pnpm build
pnpm preview
```

## 说明

概率与“预言”仅用于数学教育和娱乐，不构成投注建议。付费计划为界面演示，未接入支付。
