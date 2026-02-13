/**
 * 教学班管理相关 API
 */
import request from './index'
import type { TeachingClassInfoDTO, AddTeachingClassVO, TeachingClassPageQuery, PageDTO } from './types'

/**
 * 分页查询教学班列表
 * @param params 查询参数（蛇形命名）
 * @returns 教学分页数据
 */
export function getTeachingClassPage(params: TeachingClassPageQuery): Promise<PageDTO<TeachingClassInfoDTO>> {
  return request({
    url: '/v1/teachingClass/getPage',
    method: 'get',
    params,
  })
}

/**
 * 获取单个教学班详情
 * @param teachingClassUuid 教学班UUID
 * @returns 教学班信息
 */
export function getTeachingClass(teachingClassUuid: string): Promise<TeachingClassInfoDTO> {
  return request({
    url: '/v1/teachingClass/get',
    method: 'get',
    params: { teaching_class_uuid: teachingClassUuid },
  })
}

/**
 * 添加教学班
 * @param data 教学班信息（驼峰命名）
 * @returns 教学班UUID
 */
export function addTeachingClass(data: AddTeachingClassVO): Promise<string> {
  return request({
    url: '/v1/teachingClass/add',
    method: 'post',
    data,
  })
}

/**
 * 更新教学班信息
 * @param data 教学班信息（驼峰命名，需包含 teachingClassUuid）
 * @returns void
 */
export function updateTeachingClass(data: AddTeachingClassVO): Promise<void> {
  return request({
    url: '/v1/teachingClass/update',
    method: 'put',
    data,
  })
}

/**
 * 删除教学班
 * @param teachingClassUuid 教学班UUID
 * @returns void
 */
export function deleteTeachingClass(teachingClassUuid: string): Promise<void> {
  return request({
    url: '/v1/teachingClass/delete',
    method: 'delete',
    params: { teaching_class_uuid: teachingClassUuid },
  })
}
