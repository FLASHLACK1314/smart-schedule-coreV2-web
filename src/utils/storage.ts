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
    const userInfo = localStorage.getItem('userInfo')
    return userInfo ? JSON.parse(userInfo) : null
  },

  /**
   * 移除用户信息
   */
  removeUserInfo(): void {
    localStorage.removeItem('userInfo')
  },

  /**
   * 清除所有登录信息
   */
  clearAuth(): void {
    this.removeToken()
    this.removeUserInfo()
  },
}
