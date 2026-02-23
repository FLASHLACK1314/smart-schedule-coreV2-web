<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { UserType } from '@/api/types'

// 定义组件名称（用于 keep-alive）
defineOptions({
  name: 'HomeView',
})

interface Feature {
  id: number
  title: string
  description: string
  icon: string
  color: string
  userTypes?: string[] // 限定哪些用户类型可以看到此功能
  category: string // 功能分类
}

interface Category {
  id: string
  title: string
  icon: string
  description: string
  order: number
}

const userStore = useUserStore()
const router = useRouter()

// 功能分类定义
const categories: Category[] = [
  {
    id: 'scheduling',
    title: '核心排课',
    icon: '📅',
    description: '智能排课与排课管理',
    order: 1,
  },
  {
    id: 'basic-data',
    title: '基础数据',
    icon: '📊',
    description: '课程、教师、教室等基础信息',
    order: 2,
  },
  {
    id: 'teaching',
    title: '教学管理',
    icon: '📚',
    description: '教学班与关联管理',
    order: 3,
  },
  {
    id: 'timetable',
    title: '课表查看',
    icon: '🗓️',
    description: '查看个人与班级课表',
    order: 4,
  },
  {
    id: 'system',
    title: '系统管理',
    icon: '⚙️',
    description: '系统配置与用户管理',
    order: 5,
  },
]

// 所有功能定义
const allFeatures: Feature[] = [
  // 核心排课
  {
    id: 1,
    title: '智能排课',
    description: '基于先进算法的自动排课系统，一键生成最优课表',
    icon: '📅',
    color: '#4CAF50',
    userTypes: [],
    category: 'scheduling',
  },
  {
    id: 18,
    title: '排课管理',
    description: '管理排课记录，对教学班进行时间、教室安排',
    icon: '📅',
    color: '#9C27B0',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'scheduling',
  },
  {
    id: 19,
    title: '学期管理',
    description: '管理学期信息，维护学期基础数据',
    icon: '📅',
    color: '#4CAF50',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'scheduling',
  },
  // 基础数据
  {
    id: 2,
    title: '课程管理',
    description: '全面管理课程信息、课时设置和教学安排',
    icon: '📚',
    color: '#2196F3',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'basic-data',
  },
  {
    id: 3,
    title: '教师管理',
    description: '维护教师档案、授课时间偏好和教学资源',
    icon: '👨‍🏫',
    color: '#FF9800',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'basic-data',
  },
  {
    id: 4,
    title: '教学楼管理',
    description: '管理教学楼信息，维护教学场地资源',
    icon: '🏢',
    color: '#FF5722',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'basic-data',
  },
  {
    id: 5,
    title: '教室管理',
    description: '智能化教室资源调度，最大化利用率',
    icon: '🏫',
    color: '#9C27B0',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'basic-data',
  },
  {
    id: 6,
    title: '班级管理',
    description: '灵活管理班级信息和学生数据统计',
    icon: '👥',
    color: '#F44336',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'basic-data',
  },
  {
    id: 7,
    title: '学生管理',
    description: '管理学生档案、学籍信息和成绩数据',
    icon: '🎓',
    color: '#00BCD4',
    userTypes: [UserType.SYSTEM_ADMIN],
    category: 'basic-data',
  },
  {
    id: 8,
    title: '学院管理',
    description: '管理学院组织架构、专业设置和行政配置',
    icon: '🏛️',
    color: '#607D8B',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'basic-data',
  },
  {
    id: 9,
    title: '专业管理',
    description: '管理专业信息、培养方案和专业设置',
    icon: '📖',
    color: '#3F51B5',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'basic-data',
  },
  {
    id: 12,
    title: '课程类型管理',
    description: '管理课程类型分类，如必修课、选修课等',
    icon: '🏷️',
    color: '#8BC34A',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'basic-data',
  },
  // 教学管理
  {
    id: 15,
    title: '教学班管理',
    description: '管理教学班信息，关联课程、教师和学期',
    icon: '📚',
    color: '#00BCD4',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'teaching',
  },
  {
    id: 16,
    title: '教学班-行政班关联管理',
    description: '管理教学班与行政班的关联关系，将行政班级添加到教学班中',
    icon: '🔗',
    color: '#FF6B9D',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'teaching',
  },
  {
    id: 13,
    title: '课程类型-教室类型关联管理',
    description: '管理哪些课程类型可以在哪些教室类型上课',
    icon: '🔗',
    color: '#FF6B9D',
    userTypes: [UserType.ACADEMIC_ADMIN, UserType.SYSTEM_ADMIN],
    category: 'teaching',
  },
  {
    id: 14,
    title: '课程教师资格管理',
    description: '管理教师授课资格，维护课程与教师的关联关系',
    icon: '🎓',
    color: '#FFB74D',
    userTypes: [UserType.SYSTEM_ADMIN, UserType.ACADEMIC_ADMIN, UserType.TEACHER, UserType.STUDENT],
    category: 'teaching',
  },
  // 课表查看
  {
    id: 11,
    title: '我的课表',
    description: '查看个人课程安排，支持导出和打印',
    icon: '📊',
    color: '#00BCD4',
    userTypes: [],
    category: 'timetable',
  },
  {
    id: 17,
    title: '课表查看',
    description: '以课表网格形式查看课程安排，支持多种查询维度',
    icon: '📊',
    color: '#FF9800',
    userTypes: [],
    category: 'timetable',
  },
  // 系统管理
  {
    id: 10,
    title: '教务管理',
    description: '教务处人员管理、部门配置与权限设置',
    icon: '📋',
    color: '#E91E63',
    userTypes: [UserType.SYSTEM_ADMIN],
    category: 'system',
  },
]

// 根据用户类型过滤功能
const features = computed(() => {
  const userType = userStore.userType

  if (!userType) return []

  // 学生和老师可以看到"我的课表"和"课表查看"
  if (userType === UserType.STUDENT || userType === UserType.TEACHER) {
    return allFeatures.filter(f => f.title === '我的课表' || f.title === '课表查看')
  }

  // 管理员：根据 userTypes 过滤功能
  return allFeatures.filter(f => {
    // 如果 userTypes 未定义或为空数组，该功能对所有用户可见
    if (!f.userTypes || f.userTypes.length === 0) {
      return true
    }
    // 否则，只对指定用户类型可见
    return f.userTypes.includes(userType)
  })
})

// 获取每个分类下的功能（按分类顺序）
const categorizedFeatures = computed(() => {
  return categories
    .sort((a, b) => a.order - b.order)
    .map(category => ({
      ...category,
      features: features.value.filter(f => f.category === category.id),
    }))
    .filter(category => category.features.length > 0) // 只显示有功能的分类
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

  // 根据用户类型返回对应的名称字段（使用下划线命名）
  if (userInfo.student_name) return userInfo.student_name
  if (userInfo.teacher_name) return userInfo.teacher_name
  if (userInfo.academic_name) return userInfo.academic_name
  if (userInfo.admin_username) return userInfo.admin_username

  return '用户'
})

const handleFeatureClick = (feature: Feature) => {
  console.log('点击功能:', feature.title)

  // 根据功能标题跳转到对应页面
  const routeMap: Record<string, string> = {
    教师管理: '/teacher-management',
    学生管理: '/student-management',
    教务管理: '/academic-management',
    学院管理: '/college-management',
    专业管理: '/major-management',
    课程管理: '/course-management',
    教学楼管理: '/building-management',
    教室管理: '/classroom-management',
    班级管理: '/class-management',
    课程类型管理: '/course-type-management',
    '课程类型-教室类型关联管理': '/course-classroom-type-management',
    课程教师资格管理: '/course-qualification-management',
    教学班管理: '/teaching-class-management',
    '教学班-行政班关联管理': '/teaching-class-class-management',
    智能排课: '/auto-schedule',
    我的课表: '/my-schedule',
    课表查看: '/timetable-view',
    排课管理: '/schedule-management',
    学期管理: '/semester-management',
  }

  const route = routeMap[feature.title]
  if (route) {
    router.push(route)
  } else {
    console.warn('未找到对应路由:', feature.title)
  }
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

      <!-- 按分类展示功能 -->
      <div
        v-for="category in categorizedFeatures"
        :key="category.id"
        class="category-section"
      >
        <div class="category-header">
          <div class="category-icon-wrapper">
            <span class="category-icon">{{ category.icon }}</span>
          </div>
          <div class="category-info">
            <h3 class="category-title">{{ category.title }}</h3>
            <p class="category-description">{{ category.description }}</p>
          </div>
        </div>
        <div class="features-grid">
          <div
            v-for="feature in category.features"
            :key="feature.id"
            class="feature-card"
            @click="handleFeatureClick(feature)"
          >
            <div class="feature-icon-wrapper" :style="{ backgroundColor: feature.color + '20' }">
              <span class="feature-icon">{{ feature.icon }}</span>
            </div>
            <div class="feature-content">
              <h4 class="feature-title">
                {{ feature.title }}
              </h4>
              <p class="feature-description">{{ feature.description }}</p>
            </div>
          </div>
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

/* 分类区域 */
.category-section {
  margin-bottom: 4rem;
}

.category-section:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.category-icon-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-icon {
  font-size: 1.75rem;
}

.category-info {
  flex: 1;
}

.category-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.category-description {
  font-size: 0.95rem;
  color: #a0aec0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

/* 超大屏幕：5列 */
@media (min-width: 1601px) {
  .features-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.feature-card {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 20px 60px rgba(0, 212, 255, 0.25);
  border-color: rgba(0, 212, 255, 0.3);
  background: linear-gradient(135deg, rgba(35, 35, 60, 0.9) 0%, rgba(50, 50, 80, 0.9) 100%);
}

.feature-icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.feature-icon {
  font-size: 2.25rem;
}

.feature-content {
  width: 100%;
}

.feature-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.feature-description {
  font-size: 0.9rem;
  color: #a0aec0;
  opacity: 1;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

/* 大屏幕：4列（默认） */
@media (min-width: 1201px) and (max-width: 1600px) {
  .features-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 中屏幕：3列 */
@media (min-width: 769px) and (max-width: 1200px) {
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

  .category-header {
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .category-icon-wrapper {
    width: 48px;
    height: 48px;
  }

  .category-icon {
    font-size: 1.5rem;
  }

  .category-title {
    font-size: 1.25rem;
  }

  .category-description {
    font-size: 0.9rem;
  }

  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 小屏幕：2列 */
@media (min-width: 481px) and (max-width: 768px) {
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
    flex-direction: column;
    text-align: center;
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

  .category-header {
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .category-icon-wrapper {
    width: 48px;
    height: 48px;
  }

  .category-icon {
    font-size: 1.5rem;
  }

  .category-title {
    font-size: 1.15rem;
  }

  .category-description {
    font-size: 0.85rem;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .feature-card {
    padding: 1.5rem 1rem;
  }

  .feature-icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .feature-icon {
    font-size: 1.75rem;
  }

  .feature-title {
    font-size: 1rem;
  }

  .feature-description {
    font-size: 0.85rem;
  }

  .cta-section {
    padding: 4rem 1.5rem;
  }

  .cta-title {
    font-size: 2rem;
  }
}

/* 移动端：1列 */
@media (max-width: 480px) {
  .top-navbar .navbar-content {
    padding: 1rem 1rem;
  }

  .navbar-user {
    gap: 0.75rem;
  }

  .user-info {
    padding: 0.4rem 0.6rem;
  }

  .user-name {
    display: none;
  }

  .user-type {
    display: none;
  }

  .logout-button span:not(.logout-icon) {
    display: none;
  }

  .logout-button {
    padding: 0.4rem 0.6rem;
  }

  .hero-section {
    padding: 2rem 1rem;
    flex-direction: column;
    text-align: center;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-visual {
    display: none;
  }

  .features-section {
    padding: 3rem 1rem;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .section-subtitle {
    font-size: 0.95rem;
  }

  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .category-icon-wrapper {
    width: 48px;
    height: 48px;
  }

  .category-icon {
    font-size: 1.5rem;
  }

  .category-title {
    font-size: 1.1rem;
  }

  .category-description {
    font-size: 0.85rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .feature-card {
    padding: 1.5rem 1rem;
  }

  .feature-icon-wrapper {
    width: 64px;
    height: 64px;
  }

  .feature-icon {
    font-size: 2rem;
  }

  .feature-title {
    font-size: 1.05rem;
  }

  .feature-description {
    font-size: 0.85rem;
    -webkit-line-clamp: 2;
  }

  .cta-section {
    padding: 3rem 1rem;
  }

  .cta-title {
    font-size: 1.75rem;
  }

  .cta-subtitle {
    font-size: 1rem;
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
