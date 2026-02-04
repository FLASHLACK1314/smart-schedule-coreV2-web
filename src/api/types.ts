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
  student_uuid: string
  student_id: string
  student_name: string
  class_uuid: string
  class_name?: string // 行政班级名称
}

// 教师用户信息
export interface TeacherUserInfoDTO {
  teacher_uuid: string
  teacher_num: string
  teacher_name: string
  title: string
  max_hours_per_week: number
  is_active: boolean
  like_time: string
  department_uuid?: string // 所属学院UUID
  department_name?: string // 学院名称
}

// 教务管理员用户信息
export interface AcademicAdminUserInfoDTO {
  academic_uuid: string
  department_uuid: string
  academic_num: string
  academic_name: string
  college_name?: string // 学院名称
}

// 系统管理员用户信息
export interface SystemAdminUserInfoDTO {
  admin_uuid: string
  admin_username: string
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

// 修改密码请求
export interface ChangePasswordVO {
  new_password: string
  confirm_password: string
}

// ========== 教学楼相关类型 ==========

// 教学楼信息
export interface BuildingInfoDTO {
  building_uuid: string
  building_num: string
  building_name: string
}

// 分页查询响应
export interface PageDTO<T> {
  total: number
  page: number
  size: number
  records: T[]
}

// 教学楼分页查询参数
export interface BuildingPageQuery {
  page: number
  size: number
  building_num?: string
  building_name?: string
}

// ========== 教室相关类型 ==========

// 教室信息
export interface ClassroomInfoDTO {
  classroom_uuid: string
  building_name: string
  classroom_name: string
  capacity: number
  type_name: string
  type_description: string
}

// 新增教室请求
export interface AddClassroomVO {
  building_uuid: string
  classroom_name: string
  capacity: number
  classroom_type_uuid: string
}

// 教室分页查询参数
export interface ClassroomPageQuery {
  page: number
  size: number
  building_uuid?: string
  classroom_name?: string
  classroom_capacity?: string
  classroom_type_uuid?: string
}

// ========== 教室类型相关类型 ==========

// 教室类型信息
export interface ClassroomTypeInfoDTO {
  classroom_type_uuid: string
  type_name: string
  type_description: string
}

// 教室类型分页查询参数
export interface ClassroomTypePageQuery {
  page: number
  size: number
  classroom_type_name?: string
}
