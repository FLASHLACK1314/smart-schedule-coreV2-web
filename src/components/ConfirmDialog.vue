<script setup lang="ts">
import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

const visible = ref(false)
const options = ref<ConfirmOptions>({
  title: '',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  type: 'info',
})

let resolvePromise: ((value: boolean) => void) | null = null

const show = (opts: ConfirmOptions): Promise<boolean> => {
  options.value = {
    title: '',
    confirmText: '确定',
    cancelText: '取消',
    type: 'info',
    ...opts,
  }
  visible.value = true
  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

const handleConfirm = () => {
  visible.value = false
  resolvePromise?.(true)
  resolvePromise = null
}

const handleCancel = () => {
  visible.value = false
  resolvePromise?.(false)
  resolvePromise = null
}

defineExpose({ show })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-dialog" :class="options.type">
          <div class="dialog-header">
            <span class="dialog-title">{{ options.title || '确认操作' }}</span>
          </div>
          <div class="dialog-body">
            <p class="dialog-message">{{ options.message }}</p>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-cancel" @click="handleCancel">
              {{ options.cancelText }}
            </button>
            <button class="btn btn-confirm" :class="options.type" @click="handleConfirm">
              {{ options.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.confirm-dialog {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
  min-width: 320px;
  max-width: 420px;
  padding: 24px;
}

.dialog-header {
  margin-bottom: 16px;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.dialog-body {
  margin-bottom: 24px;
}

.dialog-message {
  color: #a0aec0;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  outline: none;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #a0aec0;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.btn-confirm {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: #fff;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.btn-confirm.danger {
  background: linear-gradient(135deg, #ff5252 0%, #ff1744 100%);
}

.btn-confirm.danger:hover {
  box-shadow: 0 4px 12px rgba(255, 82, 82, 0.3);
}

.btn-confirm.warning {
  background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
}

.btn-confirm.warning:hover {
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .confirm-dialog,
.fade-leave-active .confirm-dialog {
  transition: transform 0.2s ease;
}

.fade-enter-from .confirm-dialog,
.fade-leave-to .confirm-dialog {
  transform: scale(0.95);
}

/* 响应式 */
@media (max-width: 480px) {
  .confirm-dialog {
    min-width: 280px;
    margin: 16px;
  }
}
</style>
