<script setup lang="ts">
import { computed } from 'vue'

export interface Message {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  text: string
  duration?: number
}

const props = defineProps<{
  messages: Message[]
}>()

const emit = defineEmits<{
  remove: [id: number]
}>()

// 获取图标
const getIcon = (type: string) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }
  return icons[type as keyof typeof icons] || 'ℹ️'
}

// 获取颜色
const getColor = (type: string) => {
  const colors = {
    success: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
    error: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
    warning: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
    info: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
  }
  return colors[type as keyof typeof colors] || colors.info
}
</script>

<template>
  <Teleport to="body">
    <div class="message-container">
      <TransitionGroup name="message">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :style="{ borderLeftColor: message.type === 'success' ? '#4caf50' : message.type === 'error' ? '#f44336' : message.type === 'warning' ? '#ff9800' : '#2196f3' }"
        >
          <div class="message-icon">{{ getIcon(message.type) }}</div>
          <div class="message-content">
            <div class="message-text">{{ message.text }}</div>
          </div>
          <button class="message-close" @click="emit('remove', message.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.message-container {
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.message-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;
  max-width: 480px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(40, 40, 70, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border-left: 4px solid;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.message-icon {
  font-size: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
}

.message-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #a0aec0;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.message-close:hover {
  background: rgba(244, 67, 54, 0.3);
  color: #ffffff;
  transform: rotate(90deg);
}

/* TransitionGroup 动画 */
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.message-move {
  transition: transform 0.3s ease;
}

/* 响应式 */
@media (max-width: 768px) {
  .message-container {
    right: 10px;
    left: 10px;
    top: 80px;
  }

  .message-item {
    min-width: 0;
    max-width: none;
  }
}
</style>
