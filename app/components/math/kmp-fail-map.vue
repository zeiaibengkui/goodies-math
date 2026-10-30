<script setup lang="ts">
import MathFormula from '~/components/math/math-formula.vue'

const props = defineProps<{
  digits: number[]
}>()

function buildFailure(values: number[]) {
  const failure = Array.from({ length: values.length }, () => 0)

  for (let index = 1; index < values.length; index += 1) {
    let length = failure[index - 1]!

    while (length > 0 && values[index] !== values[length]) {
      length = failure[length - 1]!
    }

    if (values[index] === values[length]) {
      length += 1
    }

    failure[index] = length
  }

  return failure
}

const failure = computed(() => buildFailure(props.digits))
const fullBorder = computed(() => failure.value[failure.value.length - 1] ?? 0)
const repeatedPositions = computed(() => failure.value.filter((value) => value > 0).length)
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        <p class="kicker mb-2">FAILURE FUNCTION / 失配函数</p>
        <h3 class="h2 fw-bolder mb-2">每个位置，能回退多远？</h3>
        <p class="text-secondary mb-0">
          KMP 把每个前缀映射为一个最长的「相等前后缀」长度。匹配失败时，模式串就沿这个值回退。
        </p>
      </div>
      <BBadge variant="dark" class="fs-6">
        π[{{ digits.length }}] = {{ fullBorder }}
      </BBadge>
    </div>

    <div class="formula-box">
      <p class="formula-label">π = [ {{ failure.join(', ') }} ]</p>
      <MathFormula
        formula="\pi[i] = \max\{\,k : S[0..k-1] = S[i-k+1..i]\,\}"
        display-mode
      />
    </div>

    <div class="row row-cols-2 row-cols-sm-5 g-2" aria-label="KMP fail 函数逐位映射">
      <div v-for="(value, index) in failure" :key="index" class="col">
        <div
          class="map-tile"
          :class="value > 0 ? 'map-tile--active' : ''"
        >
          <div class="small text-secondary">i = {{ index + 1 }}</div>
          <div class="fs-2 fw-bolder lh-1">{{ value }}</div>
          <div class="small mt-2">digit {{ digits[index] }}</div>
        </div>
      </div>
    </div>

    <p class="map-note">
      末尾 π 值 <span class="fw-bolder text-dark">{{ fullBorder }}</span>
      <template v-if="fullBorder > 0">
        ：整串数字有一个长度为 {{ fullBorder }} 的相等前后缀。
      </template>
      <template v-else>
        ：整串数字没有非空的相等前后缀。
      </template>
      共有 {{ repeatedPositions }} 个位置需要非零回退。
    </p>
  </div>
</template>
