import { ref } from 'vue'
import type { ConfirmOptions } from '@/components/ConfirmDialog.vue'

// 全局单例引用
const confirmRef = ref<{ show: (opts: ConfirmOptions) => Promise<boolean> } | null>(null)

/**
 * 设置确认对话框组件引用
 * 在组件挂载时调用
 */
export function setConfirmRef(ref: { show: (opts: ConfirmOptions) => Promise<boolean> }) {
  confirmRef.value = ref
}

/**
 * 确认对话框 composable
 * 使用方式：
 * ```typescript
 * const { confirm } = useConfirm()
 * const confirmed = await confirm('确定删除吗？', { type: 'danger' })
 * if (confirmed) { ... }
 * ```
 */
export function useConfirm() {
  /**
   * 显示确认对话框
   * @param message 提示消息
   * @param options 可选配置（title, confirmText, cancelText, type）
   * @returns Promise<boolean> - 用户点击确定返回 true，取消返回 false
   */
  const confirm = async (message: string, options?: Partial<ConfirmOptions>): Promise<boolean> => {
    if (!confirmRef.value) {
      console.warn('ConfirmDialog not initialized. Please ensure ConfirmDialog is mounted.')
      // 降级到原生 confirm
      return window.confirm(message)
    }
    return confirmRef.value.show({ message, ...options })
  }

  return {
    confirm,
  }
}
