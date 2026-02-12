/**
 * 学生管理相关 API
 */
import request from './index'
import type {
  StudentInfoDTO,
  AddStudentVO,
  UpdateStudentVO,
  StudentPageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询学生列表
 * @param params 查询参数
 * @returns 学生分页数据
 */
export function getStudentPage(params: StudentPageQuery): Promise<PageDTO<StudentInfoDTO>> {
  return request({
    url: '/v1/student/getPage',
    method: 'get',
    params,
  })
}

/**
 * 获取单个学生详情
 * @param studentUuid 学生UUID
 * @returns 学生信息
 */
export function getStudent(studentUuid: string): Promise<StudentInfoDTO> {
  return request({
    url: '/v1/student/get',
    method: 'get',
    params: {
      student_uuid: studentUuid,
    },
  })
}

/**
 * 添加学生
 * @param data 学生信息
 * @returns void
 */
export function addStudent(data: AddStudentVO): Promise<void> {
  return request({
    url: '/v1/student/add',
    method: 'post',
    data,  // 使用 RequestBody，驼峰命名
  })
}

/**
 * 更新学生信息
 * @param data 学生信息
 * @returns void
 */
export function updateStudent(data: UpdateStudentVO): Promise<void> {
  return request({
    url: '/v1/student/update',
    method: 'put',
    data,  // 使用 RequestBody，驼峰命名
  })
}

/**
 * 删除学生
 * @param studentUuid 学生UUID
 * @returns void
 */
export function deleteStudent(studentUuid: string): Promise<void> {
  return request({
    url: '/v1/student/delete',
    method: 'delete',
    params: {
      student_uuid: studentUuid,
    },
  })
}
