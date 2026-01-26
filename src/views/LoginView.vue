<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { UserType } from '@/api/types'
import type { LoginVO } from '@/api/types'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const formData = ref<LoginVO>({
  user_type: UserType.STUDENT,
  user_name: '',
  password: '',
})

// 用户类型选项
const userTypeOptions = [
  { label: '学生', value: UserType.STUDENT, icon: '👨‍🎓' },
  { label: '教师', value: UserType.TEACHER, icon: '👨‍🏫' },
  { label: '教务管理员', value: UserType.ACADEMIC_ADMIN, icon: '📋' },
  { label: '系统管理员', value: UserType.SYSTEM_ADMIN, icon: '⚙️' },
]

// 加载状态
const loading = ref(false)
const errorMessage = ref('')

/**
 * 处理登录提交
 */
const handleLogin = async () => {
  // 表单验证
  if (!formData.value.user_name.trim()) {
    errorMessage.value = '请输入用户名'
    return
  }

  if (!formData.value.password.trim()) {
    errorMessage.value = '请输入密码'
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    await userStore.login({
      user_type: formData.value.user_type,
      user_name: formData.value.user_name,
      password: formData.value.password,
    })

    // 登录成功，跳转到首页
    router.push('/')
  } catch (error: any) {
    errorMessage.value = error.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}

/**
 * 选择用户类型
 */
const selectUserType = (type: string) => {
  formData.value.user_type = type
  errorMessage.value = ''
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 左侧装饰区域 -->
      <div class="login-decoration">
        <div class="decoration-content">
          <div class="logo-section">
            <div class="logo-icon">📅</div>
            <h1 class="logo-title">智能排课系统</h1>
            <p class="logo-subtitle">Smart Schedule System V2.0</p>
          </div>

          <div class="features-list">
            <div class="feature-item">
              <span class="feature-icon">🚀</span>
              <span class="feature-text">智能高效</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span class="feature-text">数据可视化</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔒</span>
              <span class="feature-text">安全可靠</span>
            </div>
          </div>
        </div>

        <!-- 浮动装饰元素 -->
        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form-section">
        <div class="form-container">
          <div class="form-header">
            <h2 class="form-title">欢迎回来</h2>
            <p class="form-subtitle">请登录以继续使用系统</p>
          </div>

          <!-- 用户类型选择 -->
          <div class="user-type-selector">
            <div class="selector-label">选择身份</div>
            <div class="type-options">
              <button
                v-for="option in userTypeOptions"
                :key="option.value"
                class="type-option"
                :class="{ active: formData.user_type === option.value }"
                @click="selectUserType(option.value)"
              >
                <span class="option-icon">{{ option.icon }}</span>
                <span class="option-label">{{ option.label }}</span>
              </button>
            </div>
          </div>

          <!-- 登录表单 -->
          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label" for="username">用户名</label>
              <input
                id="username"
                v-model="formData.user_name"
                type="text"
                class="form-input"
                placeholder="请输入用户名"
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="password">密码</label>
              <input
                id="password"
                v-model="formData.password"
                type="password"
                class="form-input"
                placeholder="请输入密码"
                autocomplete="current-password"
              />
            </div>

            <!-- 错误提示 -->
            <div v-if="errorMessage" class="error-message">
              <span class="error-icon">⚠️</span>
              {{ errorMessage }}
            </div>

            <!-- 登录按钮 -->
            <button type="submit" class="login-button" :disabled="loading">
              <span v-if="loading" class="loading-spinner"></span>
              <span v-else>登录</span>
            </button>
          </form>

          <div class="form-footer">
            <p class="footer-text">忘记密码？请联系系统管理员</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

/* 左侧装饰区域 */
.login-decoration {
  position: relative;
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.decoration-content {
  position: relative;
  z-index: 1;
}

.logo-section {
  text-align: center;
  margin-bottom: 3rem;
}

.logo-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: float 3s ease-in-out infinite;
}

.logo-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-subtitle {
  font-size: 1rem;
  color: #a0aec0;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(8px);
}

.feature-icon {
  font-size: 1.5rem;
}

.feature-text {
  font-size: 1rem;
  color: #ffffff;
  font-weight: 500;
}

/* 浮动装饰形状 */
.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  right: -50px;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  bottom: -30px;
  left: -30px;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  top: 50%;
  right: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

/* 右侧表单区域 */
.login-form-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-container {
  width: 100%;
  max-width: 450px;
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

/* 用户类型选择器 */
.user-type-selector {
  margin-bottom: 2rem;
}

.selector-label {
  font-size: 0.9rem;
  color: #a0aec0;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #a0aec0;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-option:hover {
  border-color: rgba(0, 212, 255, 0.3);
  background: rgba(35, 35, 60, 0.9);
}

.type-option.active {
  border-color: #00d4ff;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
}

.option-icon {
  font-size: 1.2rem;
}

.option-label {
  font-weight: 500;
}

/* 表单样式 */
.login-form {
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

/* 错误提示 */
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

.error-icon {
  font-size: 1rem;
}

/* 登录按钮 */
.login-button {
  padding: 1rem;
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
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
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

/* 表单底部 */
.form-footer {
  text-align: center;
  margin-top: 1.5rem;
}

.footer-text {
  font-size: 0.85rem;
  color: #a0aec0;
}

/* 响应式设计 */
@media (max-width: 968px) {
  .login-container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .login-decoration {
    display: none;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 1rem;
  }

  .type-options {
    grid-template-columns: 1fr;
  }
}
</style>
