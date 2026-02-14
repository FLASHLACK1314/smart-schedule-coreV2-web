import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { storage } from '@/utils/storage'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('@/views/ChangePasswordView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/teacher-management',
    name: 'TeacherManagement',
    component: () => import('@/views/TeacherManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/student-management',
    name: 'StudentManagement',
    component: () => import('@/views/StudentManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/academic-management',
    name: 'AcademicManagement',
    component: () => import('@/views/AcademicManagementView.vue'),
    meta: { requiresAuth: true, allowedRoles: ['SYSTEM_ADMIN'] },
  },
  {
    path: '/college-management',
    name: 'CollegeManagement',
    component: () => import('@/views/CollegeManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/major-management',
    name: 'MajorManagement',
    component: () => import('@/views/MajorManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/building-management',
    name: 'BuildingManagement',
    component: () => import('@/views/BuildingManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/classroom-management',
    name: 'ClassroomManagement',
    component: () => import('@/views/ClassroomManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/class-management',
    name: 'ClassManagement',
    component: () => import('@/views/ClassManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/course-type-management',
    name: 'CourseTypeManagement',
    component: () => import('@/views/CourseTypeManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/course-management',
    name: 'CourseManagement',
    component: () => import('@/views/CourseManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/course-classroom-type-management',
    name: 'CourseClassroomTypeManagement',
    component: () => import('@/views/CourseClassroomTypeManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/course-qualification-management',
    name: 'CourseQualificationManagement',
    component: () => import('@/views/CourseQualificationManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/teaching-class-management',
    name: 'TeachingClassManagement',
    component: () => import('@/views/teaching-class/TeachingClassManagement.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/teaching-class-class-management',
    name: 'TeachingClassClassManagement',
    component: () => import('@/views/TeachingClassClassManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/schedule-management',
    name: 'ScheduleManagement',
    component: () => import('@/views/ScheduleManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/semester-management',
    name: 'SemesterManagement',
    component: () => import('@/views/SemesterManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/timetable-view',
    name: 'TimetableView',
    component: () => import('@/views/TimetableView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = storage.getToken()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !token) {
    // 需要登录但未登录，跳转到登录页
    next('/login')
  } else if (to.path === '/login' && token) {
    // 已登录用户访问登录页，跳转到首页
    next('/')
  } else {
    next()
  }
})

export default router
