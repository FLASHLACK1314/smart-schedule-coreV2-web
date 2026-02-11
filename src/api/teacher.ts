/**
 * 教师管理相关 API
 */
import request from './index'
import type {
  TeacherInfoDTO,
  AddTeacherVO,
  TeacherPageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询教师列表
 * @param params 查询参数
 * @returns 教师分页数据
 */
export function getTeacherPage(params: TeacherPageQuery): Promise<PageDTO<TeacherInfoDTO>> {
  return request({
    url: '/v1/teacher/getPage',
    method: 'get',
    params,
  })
}

/**
 * 获取单个教师详情
 * @param teacherUuid 教师UUID
 * @returns 教师信息
 */
export function getTeacherInfo(teacherUuid: string): Promise<TeacherInfoDTO> {
  return request({
    url: '/v1/teacher/get',
    method: 'get',
    params: {
      teacher_uuid: teacherUuid,
    },
  })
}

/**
 * 添加教师
 * @param data 教师信息（密码必填）
 * @returns void
 */
export function addTeacher(data: AddTeacherVO): Promise<void> {
  return request({
    url: '/v1/teacher/add',
    method: 'post',
    data,
  })
}

/**
 * 更新教师信息
 * @param data 教师信息（密码可选）
 * @returns void
 */
export function updateTeacher(data: AddTeacherVO): Promise<void> {
  return request({
    url: '/v1/teacher/update',
    method: 'put',
    data,
  })
}

/**
 * 删除教师
 * @param teacherUuid 教师UUID
 * @returns void
 */
export function deleteTeacher(teacherUuid: string): Promise<void> {
  return request({
    url: '/v1/teacher/delete',
    method: 'delete',
    params: {
      teacher_uuid: teacherUuid,
    },
  })
}
