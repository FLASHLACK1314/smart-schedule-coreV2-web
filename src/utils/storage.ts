/**
 * localStorage 封装
 */
export const storage = {
  /**
   * 设置 token
   */
  setToken(token: string): void {
    localStorage.setItem('token', token)
  },

  /**
   * 获取 token
   */
  getToken(): string | null {
    return localStorage.getItem('token')
  },

  /**
   * 移除 token
   */
  removeToken(): void {
    localStorage.removeItem('token')
  },

  /**
   * 设置用户信息
   */
  setUserInfo(userInfo: any): void {
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
  },

  /**
   * 获取用户信息
   */
  getUserInfo(): any | null {
    try {
      const userInfo = localStorage.getItem('userInfo')
      if (!userInfo) return null
      return JSON.parse(userInfo)
    } catch (error) {
      console.error('解析用户信息失败:', error)
      return null
    }
  },

  /**
   * 移除用户信息
   */
  removeUserInfo(): void {
    localStorage.removeItem('userInfo')
  },

  /**
   * 设置用户类型
   */
  setUserType(userType: string): void {
    localStorage.setItem('userType', userType)
  },

  /**
   * 获取用户类型
   */
  getUserType(): string | null {
    return localStorage.getItem('userType')
  },

  /**
   * 移除用户类型
   */
  removeUserType(): void {
    localStorage.removeItem('userType')
  },

  /**
   * 清除所有登录信息
   */
  clearAuth(): void {
    this.removeToken()
    this.removeUserInfo()
    this.removeUserType()
  },
}
