<script setup lang="ts">
import katex from 'katex'

const props = withDefaults(
  defineProps<{
    formula: string
    displayMode?: boolean
  }>(),
  {
    displayMode: false
  }
)

const html = computed(() =>
  katex.renderToString(props.formula, {
    throwOnError: false,
    displayMode: props.displayMode,
    strict: 'ignore',
    output: 'htmlAndMathml'
  })
)
</script>

<template>
  <component :is="displayMode ? 'div' : 'span'" v-html="html" />
</template>
