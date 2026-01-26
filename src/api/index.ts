import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { BaseResponse } from './types'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加 token
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = token
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理错误
request.interceptors.response.use(
  (response: AxiosResponse<BaseResponse<any>>) => {
    const { output, data } = response.data

    // Success 表示成功
    if (output === 'Success') {
      return data
    } else {
      // OperationFailed 等其他情况
      const errorMessage = response.data.error_message || response.data.message || '请求失败'
      return Promise.reject(new Error(errorMessage))
    }
  },
  (error: AxiosError<BaseResponse<any>>) => {
    if (error.response) {
      const { status, data } = error.response

      // 尝试从响应数据中获取错误信息
      let errorMessage = '请求失败'

      if (data) {
        // 后端返回的统一错误格式
        if (data.error_message) {
          errorMessage = data.error_message
        } else if (data.message) {
          errorMessage = data.message
        }
      }

      switch (status) {
        case 400:
          // 业务错误（如用户名密码错误），error_message 已在上面提取
          console.error(errorMessage)
          break
        case 401:
          // 未授权，清除 token 并跳转登录
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          window.location.href = '/login'
          break
        case 403:
          console.error('没有权限访问')
          break
        case 500:
          console.error('服务器错误')
          break
        default:
          console.error(errorMessage)
      }

      // 返回包含错误信息的 Error 对象
      return Promise.reject(new Error(errorMessage))
    } else {
      // 网络错误
      const networkError = new Error('网络错误，请检查网络连接')
      console.error(networkError.message)
      return Promise.reject(networkError)
    }
  }
)

export default request
