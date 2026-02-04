import { ref } from 'vue'
import type { Message } from '@/components/MessageToast.vue'

const messages = ref<Message[]>([])
let messageId = 0

/**
 * 显示消息提示
 * @param type 消息类型
 * @param text 消息内容
 * @param duration 持续时间（毫秒），0 表示不自动关闭
 * @returns 消息 ID
 */
export function useMessage() {
  const show = (
    type: 'success' | 'error' | 'warning' | 'info',
    text: string,
    duration: number = 3000
  ) => {
    const id = ++messageId
    const message: Message = {
      id,
      type,
      text,
      duration,
    }

    messages.value.push(message)

    // 自动关闭
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  const remove = (id: number) => {
    const index = messages.value.findIndex((m) => m.id === id)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
  }

  const success = (text: string, duration?: number) => show('success', text, duration)
  const error = (text: string, duration?: number) => show('error', text, duration)
  const warning = (text: string, duration?: number) => show('warning', text, duration)
  const info = (text: string, duration?: number) => show('info', text, duration)

  return {
    messages,
    show,
    remove,
    success,
    error,
    warning,
    info,
  }
}
