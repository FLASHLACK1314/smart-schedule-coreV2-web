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

// 驼峰命名转蛇形命名
function camelToSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnakeCase)
  }

  const result: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // 将驼峰转为蛇形：courseUuid -> course_uuid
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      result[snakeKey] = camelToSnakeCase(obj[key])
    }
  }
  return result
}

// 蛇形命名转驼峰命名
function snakeToCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamelCase)
  }

  const result: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // 将蛇形转为驼峰：course_uuid -> courseUuid
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = snakeToCamelCase(obj[key])
    }
  }
  return result
}

// 请求拦截器：添加 token 并转换字段名
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = token
    }

    // 转换请求数据：驼峰命名 -> 蛇形命名
    if (config.data && typeof config.data === 'object') {
      config.data = camelToSnakeCase(config.data)
    }

    // 转换 URL 参数：驼峰命名 -> 蛇形命名
    if (config.params && typeof config.params === 'object') {
      config.params = camelToSnakeCase(config.params)
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
