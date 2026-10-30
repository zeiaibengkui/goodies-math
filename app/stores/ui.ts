import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const showDetails = ref(false)

  function revealDetails() {
    showDetails.value = true
  }

  return { showDetails, revealDetails }
})
