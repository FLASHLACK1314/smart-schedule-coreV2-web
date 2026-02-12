/**
 * 点击外部检测 composable
 * 用于检测点击是否发生在指定元素外部
 */
import type { Ref } from 'vue'
import { onMounted, onUnmounted } from 'vue'

export function useClickOutside(
  elementRef: Ref<HTMLElement | undefined>,
  callback: () => void
) {
  const handleClick = (event: MouseEvent) => {
    if (elementRef.value && !elementRef.value.contains(event.target as Node)) {
      callback()
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClick)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClick)
  })
}
