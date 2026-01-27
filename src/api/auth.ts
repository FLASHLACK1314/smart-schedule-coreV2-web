import request from './index'
import type { LoginVO, GetUserLoginDTO, ChangePasswordVO } from './types'

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
 * 用户登出
 */
export const logout = (): Promise<void> => {
  return request({
    url: '/v1/auth/logout',
    method: 'DELETE',
  })
}

/**
 * 修改密码
 * @param data 密码信息
 */
export const changePassword = (data: ChangePasswordVO): Promise<void> => {
  return request({
    url: '/v1/auth/change-password',
    method: 'POST',
    data,
  })
}
