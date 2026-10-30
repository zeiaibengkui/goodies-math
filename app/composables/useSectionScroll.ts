import { useWindowScroll } from '@vueuse/core'

const HEADER_GAP = 12
const SECTION_SNAP_TOLERANCE = 2

function headerOffset() {
  const header = document.querySelector<HTMLElement>('.app-header')
  return (header?.offsetHeight ?? 0) + HEADER_GAP
}

function sectionTop(element: HTMLElement) {
  return element.getBoundingClientRect().top + window.scrollY
}

export function useSectionScroll() {
  const { y } = useWindowScroll({ behavior: 'smooth' })

  /**
   * Scrolls one section forward, or to a specific section when `targetId` is given.
   */
  async function scrollIntoNextSection(targetId?: string) {
    await nextTick()
    if (!import.meta.client) return

    const offset = headerOffset()

    if (targetId) {
      const target = document.getElementById(targetId)
      if (!target) return
      y.value = Math.max(0, sectionTop(target) - offset)
      return
    }

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('main > section.band')
    )
    if (!sections.length) return

    const viewportTop = window.scrollY + offset
    let currentIndex = -1

    for (const [index, section] of sections.entries()) {
      if (sectionTop(section) > viewportTop + SECTION_SNAP_TOLERANCE) break
      currentIndex = index
    }

    const next = sections[currentIndex + 1]
    if (!next) return

    y.value = Math.max(0, sectionTop(next) - offset)
  }

  return { scrollIntoNextSection }
}
