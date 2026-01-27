<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { UserType } from '@/api/types'

const router = useRouter()
const userStore = useUserStore()

// 计算用户信息显示
const userInfo = computed(() => {
  const info = userStore.userInfo
  const userType = userStore.userType

  if (!info || !userType) return null

  // 根据用户类型返回对应的用户信息
  if (userType === UserType.STUDENT && info.student_name) {
    return {
      type: '学生',
      icon: '👨‍🎓',
      fields: [
        { label: '学号', value: info.student_id || '-' },
        { label: '姓名', value: info.student_name || '-' },
      ],
    }
  }

  if (userType === UserType.TEACHER && info.teacher_name) {
    return {
      type: '教师',
      icon: '👨‍🏫',
      fields: [
        { label: '教师编号', value: info.teacher_num || '-' },
        { label: '姓名', value: info.teacher_name || '-' },
        { label: '职称', value: info.title || '-' },
        { label: '每周最大课时', value: info.max_hours_per_week || '-' },
        { label: '状态', value: info.is_active ? '在职' : '离职' },
      ],
    }
  }

  if (userType === UserType.ACADEMIC_ADMIN && info.academic_name) {
    return {
      type: '教务管理员',
      icon: '📋',
      fields: [
        { label: '教务编号', value: info.academic_num || '-' },
        { label: '姓名', value: info.academic_name || '-' },
      ],
    }
  }

  if (userType === UserType.SYSTEM_ADMIN && info.admin_username) {
    return {
      type: '系统管理员',
      icon: '⚙️',
      fields: [
        { label: '用户名', value: info.admin_username || '-' },
      ],
    }
  }

  return null
})

// 计算是否允许修改密码（系统管理员不能修改密码）
const canChangePassword = computed(() => {
  const userType = userStore.userType
  return userType === UserType.STUDENT ||
         userType === UserType.TEACHER ||
         userType === UserType.ACADEMIC_ADMIN
})

/**
 * 返回首页
 */
const goBack = () => {
  router.push('/')
}

/**
 * 跳转到修改密码页面
 */
const goToChangePassword = () => {
  router.push('/change-password')
}
</script>

<template>
  <div class="profile-page">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo">
          <span class="logo-icon">📅</span>
          <span class="logo-text">智能排课系统</span>
        </div>
        <button class="back-button" @click="goBack">
          <span class="back-icon">←</span>
          <span>返回首页</span>
        </button>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <div class="profile-content">
      <div class="profile-card" v-if="userInfo">
        <!-- 用户头像和类型 -->
        <div class="profile-header">
          <div class="avatar-icon">{{ userInfo.icon }}</div>
          <h1 class="profile-title">{{ userInfo.type }}信息</h1>
        </div>

        <!-- 用户信息字段 -->
        <div class="info-section">
          <h2 class="section-title">基本信息</h2>
          <div class="info-list">
            <div
              v-for="(field, index) in userInfo.fields"
              :key="index"
              class="info-item"
            >
              <div class="info-label">{{ field.label }}</div>
              <div class="info-value">{{ field.value }}</div>
            </div>
          </div>
        </div>

        <!-- 账户信息 -->
        <div class="info-section">
          <h2 class="section-title">账户信息</h2>
          <div class="info-list">
            <div class="info-item">
              <div class="info-label">用户类型</div>
              <div class="info-value">
                <span class="user-type-badge">{{ userInfo.type }}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">安全设置</div>
              <div class="info-value">
                <button
                  class="change-password-btn"
                  :class="{ disabled: !canChangePassword }"
                  :disabled="!canChangePassword"
                  @click="goToChangePassword"
                  :title="canChangePassword ? '修改密码' : '系统管理员暂不支持修改密码'"
                >
                  <span class="btn-icon">🔒</span>
                  修改密码
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">ℹ️</div>
        <h2 class="empty-title">暂无用户信息</h2>
        <p class="empty-description">请先登录系统</p>
        <button class="empty-button" @click="goBack">返回首页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
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

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  color: #00d4ff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.5);
  transform: translateY(-1px);
}

.back-icon {
  font-size: 1rem;
}

/* 主内容区域 */
.profile-content {
  display: flex;
  justify-content: center;
  padding: 4rem 2rem;
}

.profile-card {
  width: 100%;
  max-width: 800px;
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 用户头像和类型 */
.profile-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
}

.profile-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

/* 信息区域 */
.info-section {
  margin-bottom: 2.5rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1.5rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.info-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.2);
}

.info-label {
  min-width: 150px;
  font-size: 0.95rem;
  color: #a0aec0;
  font-weight: 500;
}

.info-value {
  flex: 1;
  font-size: 1rem;
  color: #ffffff;
  font-weight: 500;
}

.user-type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.change-password-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  color: #00d4ff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.change-password-btn:hover:not(.disabled) {
  background: rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.5);
  transform: translateY(-1px);
}

.change-password-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #a0aec0;
}

.change-password-btn.disabled:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.btn-icon {
  font-size: 1rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
}

.empty-description {
  font-size: 1.1rem;
  color: #a0aec0;
  margin-bottom: 2rem;
}

.empty-button {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar-content {
    padding: 1rem 1.5rem;
  }

  .profile-content {
    padding: 2rem 1.5rem;
  }

  .profile-card {
    padding: 2rem 1.5rem;
  }

  .profile-title {
    font-size: 2rem;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .info-label {
    min-width: auto;
  }
}
</style>
