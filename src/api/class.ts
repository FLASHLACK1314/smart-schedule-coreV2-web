/**
 * 班级管理相关 API
 */
import request from './index'
import type {
  ClassInfoDTO,
  AddClassVO,
  ClassPageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询班级列表
 */
export function getClassPage(params: ClassPageQuery): Promise<PageDTO<ClassInfoDTO>> {
  return request({
    url: '/v1/class/getPage',
    method: 'get',
    params,
  })
}

/**
 * 添加班级
 */
export function addClass(data: AddClassVO): Promise<void> {
  return request({
    url: '/v1/class/add',
    method: 'post',
    data,  // 注意：此接口使用 RequestBody
  })
}

/**
 * 更新班级
 */
export function updateClass(data: AddClassVO): Promise<void> {
  return request({
    url: '/v1/class/update',
    method: 'put',
    data,  // 注意：此接口使用 RequestBody
  })
}

/**
 * 删除班级
 */
export function deleteClass(classUuid: string): Promise<void> {
  return request({
    url: '/v1/class/delete',
    method: 'delete',
    params: {
      class_uuid: classUuid,
    },
  })
}
