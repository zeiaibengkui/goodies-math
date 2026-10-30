<script setup lang="ts">
import MathFormula from '~/components/math/math-formula.vue'

const props = defineProps<{
  digits: number[]
}>()

function buildOddRadii(values: number[]) {
  const radii = Array.from({ length: values.length }, () => 0)
  let left = 0
  let right = -1

  for (let index = 0; index < values.length; index += 1) {
    let radius = index > right ? 1 : Math.min(radii[left + right - index]!, right - index + 1)

    while (
      index - radius >= 0 &&
      index + radius < values.length &&
      values[index - radius] === values[index + radius]
    ) {
      radius += 1
    }

    radii[index] = radius

    if (index + radius - 1 > right) {
      left = index - radius + 1
      right = index + radius - 1
    }
  }

  return radii
}

function buildEvenRadii(values: number[]) {
  const radii = Array.from({ length: values.length }, () => 0)
  let left = 0
  let right = -1

  for (let index = 0; index < values.length; index += 1) {
    let radius = index > right ? 0 : Math.min(radii[left + right - index + 1]!, right - index + 1)

    while (
      index - radius - 1 >= 0 &&
      index + radius < values.length &&
      values[index - radius - 1] === values[index + radius]
    ) {
      radius += 1
    }

    radii[index] = radius

    if (index + radius - 1 > right) {
      left = index - radius
      right = index + radius - 1
    }
  }

  return radii
}

type LongestPalindrome = {
  text: string
  length: number
  index: number
  odd: boolean
}

const oddRadii = computed(() => buildOddRadii(props.digits))
const evenRadii = computed(() => buildEvenRadii(props.digits))

const longest = computed<LongestPalindrome>(() => {
  let best: LongestPalindrome = { text: '', length: 0, index: -1, odd: true }

  oddRadii.value.forEach((radius, index) => {
    const length = radius * 2 - 1
    if (length > best.length) {
      const start = index - radius + 1
      best = {
        text: props.digits.slice(start, start + length).join(''),
        length,
        index,
        odd: true
      }
    }
  })

  evenRadii.value.forEach((radius, index) => {
    const length = radius * 2
    if (length > best.length) {
      const start = index - radius
      best = {
        text: props.digits.slice(start, start + length).join(''),
        length,
        index,
        odd: false
      }
    }
  })

  return best
})
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        <p class="kicker mb-2">MANACHER / 回文半径</p>
        <h3 class="h2 fw-bolder mb-2">每个中心，能向外扩多远？</h3>
        <p class="text-secondary mb-0">
          Manacher 把每个中心映射为最长回文半径。所有中心共享已经扩出的右边界，因此只需线性时间。
        </p>
      </div>
      <BBadge variant="dark" class="fs-6">
        最长 {{ longest.length }} 位：{{ longest.text || '—' }}
      </BBadge>
    </div>

    <div class="formula-box">
      <MathFormula
        formula="d_1[i] = \max\{\,r : S[i-r+1..i+r-1] \text{ 是回文}\,\}"
        display-mode
      />
      <MathFormula
        formula="d_2[i] = \max\{\,r : S[i-r..i+r-1] \text{ 是回文}\,\}"
        display-mode
      />
    </div>

    <div class="table-responsive map-table">
      <table class="table table-sm table-bordered align-middle text-center">
        <thead class="table-dark">
          <tr>
            <th scope="col">中心 i</th>
            <th v-for="(_, index) in digits" :key="index" scope="col">{{ index + 1 }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" class="table-warning">digit</th>
            <td v-for="(digit, index) in digits" :key="index">{{ digit }}</td>
          </tr>
          <tr>
            <th scope="row" class="table-warning">d₁</th>
            <td
              v-for="(radius, index) in oddRadii"
              :key="index"
              :class="longest.odd && longest.index === index ? 'table-warning fw-bolder' : ''"
            >
              {{ radius }}
            </td>
          </tr>
          <tr>
            <th scope="row" class="table-warning">d₂</th>
            <td
              v-for="(radius, index) in evenRadii"
              :key="index"
              :class="!longest.odd && longest.index === index ? 'table-warning fw-bolder' : ''"
            >
              {{ radius }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="map-note">
      d₁ 以数字为中心，d₂ 以两个数字之间为中心；对应回文长度分别为 2d₁−1 与 2d₂。
      黄色格是当前最长回文的中心。
    </p>
  </div>
</template>
