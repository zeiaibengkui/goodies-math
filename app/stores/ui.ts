import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const expertMode = ref(false)

  function toggleExpertMode() {
    expertMode.value = !expertMode.value
  }

  return { expertMode, toggleExpertMode }
})
