/**
 * 教学班-行政班关联管理相关 API
 */
import request from './index'
import type { TeachingClassClassInfoDTO, AddTeachingClassClassVO, TeachingClassClassPageQuery, PageDTO } from './types'

/**
 * 分页查询教学班-行政班关联列表
 * @param params 查询参数（蛇形命名）
 * @returns 关联分页数据
 */
export function getTeachingClassClassPage(params: TeachingClassClassPageQuery): Promise<PageDTO<TeachingClassClassInfoDTO>> {
  return request({
    url: '/v1/teachingClassClass/getPage',
    method: 'get',
    params,
  })
}

/**
 * 添加教学班-行政班关联
 * @param data 关联信息（蛇形命名）
 * @returns void
 */
export function addTeachingClassClass(data: AddTeachingClassClassVO): Promise<void> {
  return request({
    url: '/v1/teachingClassClass/add',
    method: 'post',
    data,
  })
}

/**
 * 删除教学班-行政班关联
 * @param teachingClassClassUuid 关联UUID
 * @returns void
 */
export function deleteTeachingClassClass(teachingClassClassUuid: string): Promise<void> {
  return request({
    url: '/v1/teachingClassClass/delete',
    method: 'delete',
    params: { teaching_class_class_uuid: teachingClassClassUuid },
  })
}
