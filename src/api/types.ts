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

// ========== 学院相关类型 ==========

// 学院信息
export interface DepartmentInfoDTO {
  department_uuid: string
  department_name: string
}

// 添加/更新学院请求
export interface AddDepartmentVO {
  department_uuid?: string
  department_name: string
}

// 学院分页查询参数
export interface DepartmentPageQuery {
  page: number
  size: number
  department_name?: string
}

// ========== 教师相关类型 ==========

// 教师信息
export interface TeacherInfoDTO {
  teacher_uuid: string
  teacher_num: string
  teacher_name: string
  title: string
  max_hours_per_week: number
  like_time: string
  is_active: boolean
  department_info: DepartmentInfoDTO
}

// 添加/更新教师请求
export interface AddTeacherVO {
  teacher_uuid?: string
  teacher_num: string
  teacher_name: string
  title: string
  department_uuid: string
  teacher_password?: string
  max_hours_per_week: number
  like_time: string
  is_active: boolean
}

// 教师分页查询参数
export interface TeacherPageQuery {
  page: number
  size: number
  teacher_name?: string
  teacher_num?: string
  department_uuid?: string
}

// ========== 专业相关类型 ==========

// 专业信息
export interface MajorInfoDTO {
  major_uuid: string
  department_uuid: string
  department_name: string
  major_num: string
  major_name: string
}

// 添加/更新专业请求
export interface AddMajorVO {
  major_uuid?: string  // 更新时需要
  department_uuid: string
  major_num: string
  major_name: string
}

// 专业分页查询参数
export interface MajorPageQuery {
  page: number
  size: number
  department_uuid?: string  // 学院UUID（精确查询）
  major_num?: string        // 专业编号（模糊查询）
  major_name?: string       // 专业名称（模糊查询）
}

// ========== 班级相关类型 ==========

// 班级信息（后端返回的 major_info 是嵌套对象）
export interface ClassInfoDTO {
  class_uuid: string
  class_name: string
  major_info: MajorInfoDTO  // 复用已有的专业类型
}

// 添加/更新班级请求
export interface AddClassVO {
  class_uuid?: string  // 更新时需要
  major_uuid: string
  class_name: string
}

// 班级分页查询参数
export interface ClassPageQuery {
  page: number
  size: number
  class_name?: string       // 班级名称（模糊查询）
  major_uuid?: string       // 专业UUID（精确查询）
  department_uuid?: string  // 学院UUID（精确查询）
}

// ========== 课程类型相关类型 ==========

// 课程类型信息
export interface CourseTypeInfoDTO {
  course_type_uuid: string
  type_name: string
  type_description: string
}

// 添加/更新课程类型请求
export interface AddCourseTypeVO {
  course_type_uuid?: string  // 更新时需要
  course_type_name: string
}

// 课程类型分页查询参数
export interface CourseTypePageQuery {
  page: number
  size: number
  course_type_name?: string  // 课程类型名称（模糊查询）
}

// ========== 课程相关类型 ==========

// 课程信息
export interface CourseInfoDTO {
  course_uuid: string
  course_num: string
  course_name: string
  course_type_uuid: string
  course_type_name: string
  course_credit: number  // 支持小数
}

// 添加/更新课程请求
export interface AddCourseVO {
  course_uuid?: string     // 更新时需要
  course_num: string       // 课程编号（唯一）
  course_name: string
  course_type_uuid: string
  course_credit: number    // 支持小数
}

// 课程分页查询参数
export interface CoursePageQuery {
  page: number
  size: number
  course_name?: string      // 课程名称（模糊查询）
  course_num?: string       // 课程编号（模糊查询）
  course_type_uuid?: string // 课程类型UUID（精确查询）
}

// ========== 课程类型-教室类型关联相关类型 ==========

// 关联信息
export interface CourseClassroomTypeInfoDTO {
  relation_uuid: string
  course_type_uuid: string
  course_type_name: string
  classroom_type_uuid: string
  classroom_type_name: string
}

// 添加关联请求
export interface AddCourseClassroomTypeVO {
  course_type_uuid: string
  classroom_type_uuid: string
}

// 关联分页查询参数
export interface CourseClassroomTypePageQuery {
  page: number
  size: number
  course_type_uuid?: string
  classroom_type_uuid?: string
}

// ========== 课程-教师资格关联相关类型 ==========

// 课程教师资格信息
export interface CourseQualificationInfoDTO {
  course_qualification_uuid: string  // 关联关系UUID
  course_uuid: string               // 课程UUID
  course_name: string               // 课程名称
  teacher_uuid: string              // 教师UUID
  teacher_name: string              // 教师姓名
  teacher_title: string             // 教师职称
  department_uuid: string           // 学院UUID
  department_name: string           // 学院名称
}

// 添加课程教师资格请求
export interface AddCourseQualificationVO {
  course_uuid: string   // 课程UUID（下划线命名）
  teacher_uuid: string  // 教师UUID（下划线命名）
}

// 课程教师资格分页查询参数
export interface CourseQualificationPageQuery {
  page: number
  size: number
  course_uuid?: string   // 课程UUID筛选
  teacher_uuid?: string  // 教师UUID筛选
}

// ========== 学生相关类型 ==========

// 学生班级信息（嵌套结构，蛇形命名）
export interface StudentClassInfoDTO {
  class_uuid: string
  class_name: string
  major_info: StudentMajorInfoDTO
}

// 学生专业信息（嵌嵌套结构，蛇形命名）
export interface StudentMajorInfoDTO {
  major_uuid: string
  department_uuid: string
  department_name: string
  major_num: string
  major_name: string
}

// 学生信息 DTO（蛇形命名）
export interface StudentInfoDTO {
  student_uuid: string
  student_id: string
  student_name: string
  class_info: StudentClassInfoDTO
}

// 添加学生请求体（驼峰命名 - RequestBody）
export interface AddStudentVO {
  studentId: string
  studentName: string
  classUuid: string
  studentPassword: string
}

// 更新学生请求体（驼峰命名 - RequestBody）
export interface UpdateStudentVO {
  studentUuid: string
  studentId: string
  studentName: string
  classUuid: string
  studentPassword?: string  // 可选，留空则不更新密码
}

// 学生分页查询参数（蛇形命名 - Query）
export interface StudentPageQuery {
  page: number
  size: number
  student_id?: string      // 学号（精确匹配）
  student_name?: string    // 姓名（模糊匹配）
  class_uuid?: string      // 班级UUID
  major_uuid?: string      // 专业UUID
  department_uuid?: string // 学院UUID
}

// ========== 教务管理员相关类型 ==========

// 教务管理员信息（响应数据 - 蛇形命名）
export interface AcademicAdminInfoDTO {
  academic_uuid: string
  academic_num: string
  academic_name: string
  department_info: DepartmentInfoDTO
}

// 添加/更新教务管理员请求（请求体 - 驼峰命名）
export interface AddAcademicAdminVO {
  academicUuid?: string      // 更新时需要
  academicNum: string        // 教务工号
  academicName: string       // 教务名称
  departmentUuid: string     // 所属学院UUID
  academicPassword?: string  // 密码（添加必填，更新可选）
}

// 教务管理员分页查询参数（查询参数 - 蛇形命名）
export interface AcademicAdminPageQuery {
  page: number
  size: number
  academic_name?: string     // 教务名称（模糊查询）
  academic_num?: string      // 教务工号（模糊查询）
  department_uuid?: string   // 学院UUID（精确查询）
}
