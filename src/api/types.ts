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
  course_credit: number // 支持小数
  course_hours?: number // 课程学时（整数）
}

// 添加/更新课程请求
export interface AddCourseVO {
  course_uuid?: string // 更新时需要
  course_num: string // 课程编号（唯一）
  course_name: string
  course_type_uuid: string
  course_credit: number // 支持小数
  course_hours: number // 课程学时（整数）
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

// 添加学生请求体（蛇形命名 - RequestBody）
export interface AddStudentVO {
  student_id: string
  student_name: string
  class_uuid: string
  student_password: string
}

// 更新学生请求体（蛇形命名 - RequestBody）
export interface UpdateStudentVO {
  student_uuid: string
  student_id: string
  student_name: string
  class_uuid: string
  student_password?: string  // 可选，留空则不更新密码
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

// 添加/更新教务管理员请求（蛇形命名）
export interface AddAcademicAdminVO {
  academic_uuid?: string      // 更新时需要
  academic_num: string        // 教务工号
  academic_name: string       // 教务名称
  department_uuid: string     // 所属学院UUID
  academic_password?: string  // 密码（添加必填，更新可选）
}

// 教务管理员分页查询参数（查询参数 - 蛇形命名）
export interface AcademicAdminPageQuery {
  page: number
  size: number
  academic_name?: string     // 教务名称（模糊查询）
  academic_num?: string      // 教务工号（模糊查询）
  department_uuid?: string   // 学院UUID（精确查询）
}

// ========== 学期相关类型 ==========

// 学期信息
export interface SemesterInfoDTO {
  semester_uuid: string
  semester_name: string
  semester_weeks: number // 学期周数
  start_date: string // 学期开始日期,格式: YYYY-MM-DD
  end_date: string // 学期结束日期,格式: YYYY-MM-DD
}

// 学期分页查询参数
export interface SemesterPageQuery {
  page: number
  size: number
  semester_name?: string
}

// ========== 教学班相关类型 ==========

// 教学班信息 DTO（蛇形命名 - 后端返回）
export interface TeachingClassInfoDTO {
  teaching_class_uuid: string
  course_name: string
  teacher_name: string
  semester_name: string
  teaching_class_name: string
  teaching_class_hours?: number // 教学班总学时（可选）
  weekly_sessions?: number      // 每周上课次数
  sections_per_session?: number // 每次上课节次数
  scheduled_status?: number     // 排课状态：0-未排课, 1-已排课
  scheduled_hours?: number      // 已排课学时
}

// 添加/更新教学班请求（蛇形命名）
export interface AddTeachingClassVO {
  teaching_class_uuid?: string  // 更新时需要
  course_uuid: string
  teacher_uuid: string
  semester_uuid: string
  teaching_class_name: string
  weekly_sessions?: number      // 每周上课次数，默认 1
  sections_per_session?: number // 每次上课节次数，默认 2
}

// 教学班分页查询参数（蛇形命名）
export interface TeachingClassPageQuery {
  page: number
  size: number
  course_uuid?: string
  teacher_uuid?: string
  semester_uuid?: string
  scheduled_status?: number // 排课状态筛选：0-未排课, 1-已排课
}

// ========== 教学班-行政班关联相关类型 ==========

// 教学班-行政班关联信息 DTO（蛇形命名 - 后端返回）
export interface TeachingClassClassInfoDTO {
  teaching_class_class_uuid: string
  teaching_class_uuid: string
  teaching_class_name: string
  course_uuid: string
  course_name: string
  teacher_uuid: string
  teacher_name: string
  class_uuid: string
  class_name: string
  major_uuid: string
  major_name: string
  department_uuid: string
  department_name: string
}

// 添加关联请求（蛇形命名 - 请求体）
export interface AddTeachingClassClassVO {
  teaching_class_uuid: string
  class_uuid: string
}

// 关联分页查询参数（蛇形命名 - 查询参数）
export interface TeachingClassClassPageQuery {
  page: number
  size: number
  teaching_class_uuid?: string
  class_uuid?: string
}

// ========== 课表相关类型 ==========

/**
 * 查询方式枚举
 */
export type TimetableType = 'teacher' | 'student' | 'class' | 'classroom'

/**
 * 课表单元格数据（后端返回，蛇形命名）
 */
export interface TimetableCellDTO {
  schedule_uuid: string
  semester_name: string
  teaching_class_name: string
  course_name: string
  teacher_name: string
  classroom_name: string
  day_of_week: number      // 1-7
  section_start: number    // 起始节次
  section_end: number      // 结束节次
  weeks_json: string       // JSON字符串 "[1,2,3,4,5]"
  credit_hours?: number    // 排课学时（可选）
  status: number           // 0-预览/1-正式
  updated_at: string
}

/**
 * 教师课表查询参数（蛇形命名）
 */
export interface TeacherTimetableQuery {
  teacher_uuid: string
  semester_uuid: string
}

/**
 * 学生课表查询参数（蛇形命名）
 */
export interface StudentTimetableQuery {
  student_uuid: string
  semester_uuid: string
}

/**
 * 班级课表查询参数（蛇形命名）
 */
export interface ClassTimetableQuery {
  class_uuid: string
  semester_uuid: string
}

/**
 * 教室课表查询参数（蛇形命名）
 */
export interface ClassroomTimetableQuery {
  classroom_uuid: string
  semester_uuid: string
}

// ========== 排课管理相关类型 ==========

/**
 * 排课信息 DTO（复用 TimetableCellDTO 结构）
 */
export type ScheduleInfoDTO = TimetableCellDTO

/**
 * 添加/更新排课请求体（蛇形命名）
 */
export interface AddScheduleVO {
  schedule_uuid?: string  // 更新时必填
  semester_uuid: string
  teaching_class_uuid: string
  classroom_uuid: string
  day_of_week: number      // 1-7
  section_start: number
  section_end: number
  weeks_json: string       // JSON 字符串 "[1,2,3,4,5]"
  status: number           // 0-预览/1-正式
}

/**
 * 排课分页查询参数（蛇形命名）
 */
export interface SchedulePageQuery {
  page: number
  size: number
  semester_uuid?: string
  teaching_class_uuid?: string
  classroom_uuid?: string
  teacher_uuid?: string
  day_of_week?: number
  status?: number
}

// ========== 智能排课相关类型 ==========

/**
 * 排课模式
 */
export type ScheduleMode = 'TEACHING_CLASS' | 'ADMIN_CLASS'

/**
 * 教师选择策略
 */
export type TeacherSelectionStrategy = 'balanced' | 'random' | 'first'

/**
 * 课程-行政班级配置（行政班模式使用）
 */
export interface CourseClassConfig {
  course_uuid: string
  teacher_uuid?: string
  class_uuids: string[]
  weekly_sessions?: number
  sections_per_session?: number
  class_name_prefix?: string
}

/**
 * 执行排课请求（蛇形命名）
 * 支持两种模式：
 * - 教学班模式：使用 teaching_class_uuids
 * - 行政班模式：使用 course_class_mapping 和 teacher_assignment
 */
export interface AutoScheduleVO {
  mode?: ScheduleMode                             // 排课模式，默认 TEACHING_CLASS
  semester_uuid: string                           // 学期UUID（必填）

  // 教学班模式参数
  teaching_class_uuids?: string[]                 // 待排课的教学班UUID列表（教学班模式必填）
  weekly_sessions_config?: Record<string, number> // 每周上课次数配置（可选）

  // 行政班模式参数（新版 API）
  course_class_mapping?: Record<string, string[]> // 课程UUID -> 行政班UUID列表的映射
  teacher_assignment?: Record<string, string>     // 课程UUID -> 教师UUID的映射（可选）
  auto_split_class?: boolean                      // 是否启用自动分班（行政班模式使用）
  max_students_per_class?: number                 // 单班最大人数（行政班模式使用，默认60）
  teacher_selection_strategy?: TeacherSelectionStrategy // 教师选择策略（默认balanced）

  // 兼容旧版 API（保留向后兼容）
  course_class_configs?: CourseClassConfig[]      // 课程-行政班级配置列表（旧版）

  // 资源范围参数
  building_uuids?: string[]                       // 可用教学楼UUID列表（可选）
  classroom_type_uuids?: string[]                 // 可用教室类型UUID列表（可选）

  // 算法参数
  population_size?: number                        // 种群大小（默认100）
  max_generations?: number                        // 迭代次数（默认500）
  crossover_rate?: number                         // 交叉概率（默认0.8）
  mutation_rate?: number                          // 变异概率（默认0.2）
  elite_size?: number                             // 精英保留数量（默认10）
  schedule_mode?: 0 | 1                           // 排课模式：0-预览模式，1-正式模式（默认0）
}

/**
 * 课程安排
 */
export interface CourseAppointment {
  teaching_class_uuid: string
  teaching_class_name: string
  course_uuid: string
  course_name: string
  teacher_uuid: string
  teacher_name: string
  classroom_uuid: string
  classroom_name: string
  day_of_week: number        // 1-7
  section_start: number
  section_end: number
  weeks_json: string         // JSON字符串数组
  status: number             // 0-预览/1-正式
}

/**
 * 时间槽信息（API 返回的嵌套结构）
 */
export interface TimeSlotDTO {
  day_of_week: number
  section_start: number
  section_end: number
  weeks: number[]
  unique_id?: string
  total_hours?: number
}

/**
 * 排课结果项（新版 API 返回的排课数据）
 */
export interface ScheduleItem {
  teaching_class_uuid: string
  teaching_class_name: string
  course_uuid: string
  course_name: string
  course_total_hours?: number   // 课程总学时
  teacher_uuid: string
  teacher_name: string
  classroom_uuid: string
  classroom_name: string
  classroom_capacity?: number   // 教室容量
  classroom_type_uuid?: string  // 教室类型UUID
  course_type_uuid?: string     // 课程类型UUID
  class_uuids?: string[]        // 行政班UUID列表
  total_students?: number       // 学生总数
  time_slot: TimeSlotDTO        // 时间槽信息（嵌套对象）
  // 以下字段用于兼容平铺结构
  day_of_week?: number          // 1-7（兼容平铺结构）
  section_start?: number
  section_end?: number
  weeks?: number[]              // 周次数组
  credit_hours?: number         // 排课学时
  status?: number               // 0-预览/1-正式
}

/**
 * 冲突报告
 */
export interface ConflictReport {
  teacher_conflicts: ConflictItem[]
  classroom_conflicts: ConflictItem[]
  class_conflicts: ConflictItem[]
}

/**
 * 冲突项
 */
export interface ConflictItem {
  conflict_type: string
  description: string
  affected_teaching_classes: string[]
}

/**
 * 排课统计信息（蛇形命名）
 */
export interface ScheduleStatistics {
  total_teaching_classes: number    // 总教学班数
  scheduled_teaching_classes: number // 已排课数量
  total_sessions: number            // 总排课次数
  total_hours: number               // 总学时
  average_fitness: number           // 平均适应度
}

/**
 * 自动排课结果（蛇形命名）
 */
export interface AutoScheduleResult {
  is_success: boolean                        // 排课是否成功（兼容旧字段名）
  success?: boolean                          // 排课是否成功（新字段名）
  semester_uuid: string
  schedule_map: Record<string, ScheduleItem[]> // 教学班UUID -> 排课项列表（新版使用 ScheduleItem）
  fitness: number                            // 总体适应度分数
  hard_conflicts: number                     // 硬约束冲突数量
  soft_conflicts: number                     // 软约束冲突数量
  unscheduled_teaching_classes: string[]     // 未完成排课的教学班列表
  conflict_report: ConflictReport            // 冲突报告
  statistics: ScheduleStatistics             // 排课统计信息
}
