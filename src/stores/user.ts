import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GetUserLoginDTO } from '@/api/types'
import { storage } from '@/utils/storage'
import { login as loginApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(storage.getToken())
  const userInfo = ref<any | null>(storage.getUserInfo())
  const userType = ref<string | null>(null)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)

  // Actions
  /**
   * 登录
   */
  const login = async (loginData: {
    user_type: string
    user_name: string
    password: string
  }) => {
    try {
      const response = await loginApi(loginData)

      // 保存 token 和用户类型
      token.value = response.token
      userType.value = response.user_type

      // 根据用户类型保存对应的用户信息
      const infoKey = {
        STUDENT: 'student_info',
        TEACHER: 'teacher_info',
        ACADEMIC_ADMIN: 'academic_admin_info',
        SYSTEM_ADMIN: 'system_admin_info',
      }[response.user_type] || 'student_info'

      userInfo.value = response[infoKey as keyof GetUserLoginDTO]

      // 持久化到 localStorage
      storage.setToken(response.token)
      storage.setUserInfo(userInfo.value)

      return response
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  /**
   * 登出
   */
  const logout = () => {
    token.value = null
    userInfo.value = null
    userType.value = null
    storage.clearAuth()
  }

  return {
    token,
    userInfo,
    userType,
    isLoggedIn,
    login,
    logout,
  }
})
