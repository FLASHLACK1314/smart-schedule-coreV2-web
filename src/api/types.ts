/**
 * API 类型定义
 */

// 通用响应结构
export interface BaseResponse<T> {
  output: 'Success' | 'OperationFailed'
  code: number
  message: string
  data: T
  error_message?: string
}

// 用户类型枚举
export enum UserType {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ACADEMIC_ADMIN = 'ACADEMIC_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

// 登录请求
export interface LoginVO {
  user_type: string // STUDENT, TEACHER, ACADEMIC_ADMIN, SYSTEM_ADMIN
  user_name: string
  password: string
}

// 学生用户信息
export interface StudentUserInfoDTO {
  studentUuid: string
  studentId: string
  studentName: string
  classUuid: string
}

// 教师用户信息
export interface TeacherUserInfoDTO {
  teacherUuid: string
  teacherNum: string
  teacherName: string
  title: string
  maxHoursPerWeek: number
  isActive: boolean
  likeTime: string
}

// 教务管理员用户信息
export interface AcademicAdminUserInfoDTO {
  academicUuid: string
  departmentUuid: string
  academicNum: string
  academicName: string
}

// 系统管理员用户信息
export interface SystemAdminUserInfoDTO {
  adminUuid: string
  adminUsername: string
}

// 登录响应
export interface GetUserLoginDTO {
  user_type: string
  token: string
  student_info?: StudentUserInfoDTO
  teacher_info?: TeacherUserInfoDTO
  academic_admin_info?: AcademicAdminUserInfoDTO
  system_admin_info?: SystemAdminUserInfoDTO
}
