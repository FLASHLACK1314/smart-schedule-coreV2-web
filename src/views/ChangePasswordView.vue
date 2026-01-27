<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { changePassword } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const formData = reactive({
  newPassword: '',
  confirmPassword: '',
})

// 状态
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

/**
 * 修改密码
 */
const handleChangePassword = async () => {
  // 表单验证
  if (!formData.newPassword.trim()) {
    errorMessage.value = '请输入新密码'
    return
  }

  if (!formData.confirmPassword.trim()) {
    errorMessage.value = '请确认新密码'
    return
  }

  if (formData.newPassword !== formData.confirmPassword) {
    errorMessage.value = '两次输入的新密码不一致'
    return
  }

  if (formData.newPassword.length < 6) {
    errorMessage.value = '新密码长度至少为6位'
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    await changePassword({
      new_password: formData.newPassword,
      confirm_password: formData.confirmPassword,
    })

    successMessage.value = '密码修改成功！'

    // 3秒后返回个人信息页面
    setTimeout(() => {
      router.push('/profile')
    }, 2000)
  } catch (error: any) {
    successMessage.value = ''
    errorMessage.value = error.message || '密码修改失败，请重试'
  } finally {
    loading.value = false
  }
}

/**
 * 取消修改
 */
const handleCancel = () => {
  router.push('/profile')
}
</script>

<template>
  <div class="change-password-page">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo">
          <span class="logo-icon">🔒</span>
          <span class="logo-text">修改密码</span>
        </div>
        <button class="cancel-button" @click="handleCancel">
          <span class="cancel-icon">←</span>
          <span>返回</span>
        </button>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <div class="content">
      <div class="form-card">
        <div class="form-header">
          <h1 class="form-title">修改密码</h1>
          <p class="form-subtitle">为了账户安全，建议定期更换密码</p>
        </div>

        <form class="password-form" @submit.prevent="handleChangePassword">
          <!-- 新密码 -->
          <div class="form-group">
            <label class="form-label" for="newPassword">新密码</label>
            <input
              id="newPassword"
              v-model="formData.newPassword"
              type="password"
              class="form-input"
              placeholder="请输入新密码（至少6位）"
              autocomplete="new-password"
              :disabled="loading"
            />
          </div>

          <!-- 确认新密码 -->
          <div class="form-group">
            <label class="form-label" for="confirmPassword">确认新密码</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              class="form-input"
              placeholder="请再次输入新密码"
              autocomplete="new-password"
              :disabled="loading"
            />
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ errorMessage }}
          </div>

          <!-- 成功提示 -->
          <div v-if="successMessage" class="success-message">
            <span class="success-icon">✅</span>
            {{ successMessage }}
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <button
              type="button"
              class="cancel-btn"
              @click="handleCancel"
              :disabled="loading"
            >
              取消
            </button>
            <button
              type="submit"
              class="submit-btn"
              :disabled="loading"
            >
              <span v-if="loading" class="loading-spinner"></span>
              <span v-else>确认修改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.change-password-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
}

/* 顶部导航栏 */
.top-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(15, 15, 26, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cancel-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.cancel-icon {
  font-size: 1rem;
}

/* 主内容区域 */
.content {
  display: flex;
  justify-content: center;
  padding: 4rem 2rem;
}

.form-card {
  width: 100%;
  max-width: 500px;
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.form-subtitle {
  font-size: 1rem;
  color: #a0aec0;
}

/* 表单样式 */
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.9rem;
  color: #ffffff;
  font-weight: 500;
}

.form-input {
  padding: 0.875rem 1rem;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input::placeholder {
  color: rgba(160, 174, 192, 0.6);
}

.form-input:focus {
  outline: none;
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 提示信息 */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 8px;
  color: #f44336;
  font-size: 0.9rem;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px;
  color: #4caf50;
  font-size: 0.9rem;
}

.error-icon, .success-icon {
  font-size: 1rem;
}

/* 操作按钮 */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar-content {
    padding: 1rem 1.5rem;
  }

  .content {
    padding: 2rem 1.5rem;
  }

  .form-card {
    padding: 2rem 1.5rem;
  }

  .form-title {
    font-size: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn, .submit-btn {
    width: 100%;
  }
}
</style>
