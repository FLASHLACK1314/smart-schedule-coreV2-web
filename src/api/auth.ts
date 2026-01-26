import request from './index'
import type { LoginVO, GetUserLoginDTO } from './types'

/**
 * 用户登录
 * @param data 登录信息
 * @returns 登录结果
 */
export const login = (data: LoginVO): Promise<GetUserLoginDTO> => {
  return request({
    url: '/v1/auth/login',
    method: 'POST',
    data,
  })
}

/**
 * 用户登出（可选，如果有此接口）
 */
export const logout = (): Promise<void> => {
  return request({
    url: '/v1/auth/logout',
    method: 'POST',
  })
}
