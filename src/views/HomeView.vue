<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { UserType } from '@/api/types'

interface Feature {
  id: number
  title: string
  description: string
  icon: string
  color: string
  userTypes?: string[] // 限定哪些用户类型可以看到此功能
}

const userStore = useUserStore()
const router = useRouter()

// 所有功能定义
const allFeatures: Feature[] = [
  {
    id: 1,
    title: '智能排课',
    description: '基于先进算法的自动排课系统，一键生成最优课表',
    icon: '📅',
    color: '#4CAF50',
    userTypes: [], // 管理员不显示此功能
  },
  {
    id: 2,
    title: '课程管理',
    description: '全面管理课程信息、课时设置和教学安排',
    icon: '📚',
    color: '#2196F3',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
  },
  {
    id: 3,
    title: '教师管理',
    description: '维护教师档案、授课时间偏好和教学资源',
    icon: '👨‍🏫',
    color: '#FF9800',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
  },
  {
    id: 4,
    title: '教室管理',
    description: '智能化教室资源调度，最大化利用率',
    icon: '🏫',
    color: '#9C27B0',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
  },
  {
    id: 5,
    title: '班级管理',
    description: '灵活管理班级信息和学生数据统计',
    icon: '👥',
    color: '#F44336',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
  },
  {
    id: 6,
    title: '学生管理',
    description: '管理学生档案、学籍信息和成绩数据',
    icon: '🎓',
    color: '#00BCD4',
    userTypes: [UserType.SYSTEM_ADMIN],
  },
  {
    id: 7,
    title: '教务管理',
    description: '教务处人员管理、部门配置与权限设置',
    icon: '📋',
    color: '#E91E63',
    userTypes: [UserType.SYSTEM_ADMIN],
  },
  {
    id: 8,
    title: '我的课表',
    description: '查看个人课程安排，支持导出和打印',
    icon: '📊',
    color: '#00BCD4',
    userTypes: [], // 管理员不显示此功能
  },
]

// 根据用户类型过滤功能
const features = computed(() => {
  const userType = userStore.userType

  if (!userType) return []

  // 学生和老师只能看到"我的课表"
  if (userType === UserType.STUDENT || userType === UserType.TEACHER) {
    return allFeatures.filter(f => f.title === '我的课表')
  }

  // 管理员：根据 userTypes 过滤功能
  return allFeatures.filter(f => {
    // 如果 userTypes 未定义，该功能对所有用户可见
    if (!f.userTypes) {
      return true
    }
    // 如果 userTypes 是空数组，该功能对任何用户都不可见
    if (f.userTypes.length === 0) {
      return false
    }
    // 否则，只对指定用户类型可见
    return f.userTypes.includes(userType)
  })
})

// 用户类型显示名称
const userTypeLabel = computed(() => {
  const userType = userStore.userType
  const labels = {
    [UserType.STUDENT]: '学生',
    [UserType.TEACHER]: '教师',
    [UserType.ACADEMIC_ADMIN]: '教务管理员',
    [UserType.SYSTEM_ADMIN]: '系统管理员',
  }
  return labels[userType as UserType] || '用户'
})

// 用户名显示
const userName = computed(() => {
  const userInfo = userStore.userInfo
  if (!userInfo) return '用户'

  // 根据用户类型返回对应的名称字段
  if (userInfo.studentName) return userInfo.studentName
  if (userInfo.teacherName) return userInfo.teacherName
  if (userInfo.academicName) return userInfo.academicName
  if (userInfo.adminUsername) return userInfo.adminUsername

  return '用户'
})

const handleFeatureClick = (feature: Feature) => {
  console.log('点击功能:', feature.title)
  // TODO: 根据功能跳转到不同页面
}

/**
 * 跳转到个人信息页面
 */
const goToProfile = () => {
  router.push('/profile')
}

/**
 * 处理登出
 */
const handleLogout = async () => {
  try {
    await userStore.logout()
    window.location.href = '/login'
  } catch (error) {
    console.error('登出失败:', error)
    // 即使 API 调用失败，也清除本地状态
    userStore.logout()
    window.location.href = '/login'
  }
}
</script>

<template>
  <div class="home-page">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo">
          <span class="logo-icon">📅</span>
          <span class="logo-text">智能排课系统</span>
        </div>
        <div class="navbar-user">
          <div class="user-info" @click="goToProfile">
            <span class="user-icon">👤</span>
            <span class="user-name">{{ userName }}</span>
            <span class="user-type">{{ userTypeLabel }}</span>
          </div>
          <button class="logout-button" @click="handleLogout">
            <span class="logout-icon">🚪</span>
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 头部横幅 -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-icon">✨</span>
          <span>{{ userTypeLabel }}中心 - 智能排课系统 V2.0</span>
        </div>
        <h1 class="hero-title">
          欢迎回来<br/>
          <span class="highlight">{{ userTypeLabel }}</span>
        </h1>
        <p class="hero-subtitle">
          高效 · 智能 · 便捷的现代化排课解决方案
        </p>
      </div>
      <div class="hero-visual">
        <div class="floating-card card-1">📅 排课</div>
        <div class="floating-card card-2">📚 课程</div>
        <div class="floating-card card-3">👥 班级</div>
      </div>
    </div>

    <!-- 功能模块 -->
    <div class="features-section">
      <div class="section-header">
        <h2 class="section-title">核心功能</h2>
        <p class="section-subtitle">全方位的排课管理功能，满足您的一切需求</p>
      </div>
      <div class="features-grid">
        <div
          v-for="feature in features"
          :key="feature.id"
          class="feature-card"
          @click="handleFeatureClick(feature)"
        >
          <div class="feature-icon-wrapper" :style="{ backgroundColor: feature.color + '20' }">
            <span class="feature-icon">{{ feature.icon }}</span>
          </div>
          <div class="feature-content">
            <h3 class="feature-title">
              {{ feature.title }}
            </h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
          <div class="feature-arrow">→</div>
        </div>
      </div>
    </div>

    <!-- 快速开始 -->
    <div class="cta-section">
      <div class="cta-content">
        <h2 class="cta-title">准备好开始了吗？</h2>
        <p class="cta-subtitle">立即体验智能排课系统，让排课变得简单高效</p>
        <div class="cta-buttons">
          <button class="cta-button primary">
            <span class="button-icon">🚀</span>
            立即开始
          </button>
          <button class="cta-button secondary">
            <span class="button-icon">📖</span>
            查看文档
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
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

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  transform: translateY(-1px);
}

.user-icon {
  font-size: 1.2rem;
}

.user-name {
  color: #ffffff;
  font-weight: 500;
  font-size: 0.95rem;
}

.user-type {
  color: #a0aec0;
  font-size: 0.85rem;
  padding-left: 0.5rem;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 8px;
  color: #f44336;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.5);
  transform: translateY(-1px);
}

.logout-icon {
  font-size: 1rem;
}

/* 头部横幅 */
.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
  gap: 4rem;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.badge-icon {
  font-size: 1.1rem;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  color: #ffffff;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.hero-title .highlight {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #a0aec0;
  opacity: 1;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-visual {
  flex: 1;
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.floating-card {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(40, 40, 70, 0.9) 100%);
  backdrop-filter: blur(10px);
  padding: 1.5rem 2rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  animation: float 3s ease-in-out infinite;
}

.card-1 {
  animation-delay: 0s;
}

.card-2 {
  animation-delay: 0.5s;
}

.card-3 {
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 功能区域 */
.features-section {
  padding: 6rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #a0aec0;
  opacity: 1;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.feature-card {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #00d4ff 0%, #7c3aed 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.3);
  background: linear-gradient(135deg, rgba(35, 35, 60, 0.9) 0%, rgba(50, 50, 80, 0.9) 100%);
}

.feature-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon {
  font-size: 2rem;
}

.feature-content {
  flex: 1;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.feature-description {
  font-size: 0.95rem;
  color: #a0aec0;
  opacity: 1;
  line-height: 1.5;
}

.feature-arrow {
  font-size: 1.5rem;
  color: #00d4ff;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.feature-card:hover .feature-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* CTA 区域 */
.cta-section {
  background: linear-gradient(135deg, #7c3aed 0%, #00d4ff 100%);
  padding: 6rem 4rem;
  margin: 4rem 0;
}

.cta-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.cta-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.cta-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 3rem;
}

.cta-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cta-button.primary {
  background: white;
  color: #7c3aed;
}

.cta-button.primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.cta-button.secondary {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.cta-button.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: white;
}

.button-icon {
  font-size: 1.3rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .top-navbar .navbar-content {
    padding: 1rem 2rem;
  }

  .hero-section {
    padding: 4rem 2rem;
    flex-direction: column;
    text-align: center;
  }

  .hero-content {
    max-width: 100%;
  }

  .hero-title {
    font-size: 3rem;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .top-navbar .navbar-content {
    padding: 1rem 1.5rem;
  }

  .navbar-user {
    gap: 1rem;
  }

  .user-info {
    padding: 0.5rem 0.75rem;
  }

  .user-name {
    display: none;
  }

  .logout-button span:not(.logout-icon) {
    display: none;
  }

  .logout-button {
    padding: 0.5rem 0.75rem;
  }

  .hero-section {
    padding: 3rem 1.5rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .hero-visual {
    display: none;
  }

  .features-section {
    padding: 4rem 1.5rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .feature-card {
    padding: 1.5rem;
  }

  .cta-section {
    padding: 4rem 1.5rem;
  }

  .cta-title {
    font-size: 2rem;
  }

  .cta-buttons {
    flex-direction: column;
  }

  .cta-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
