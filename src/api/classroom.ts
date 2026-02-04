/**
 * 教室管理相关 API
 */
import request from './index'
import type {
  ClassroomInfoDTO,
  AddClassroomVO,
  ClassroomPageQuery,
  PageDTO,
} from './types'

/**
 * 获取教室信息
 * @param classroomUuid 教室UUID（可选，不传则获取所有）
 * @returns 教室信息
 */
export function getClassroomInfo(classroomUuid?: string): Promise<ClassroomInfoDTO> {
  return request({
    url: '/v1/classroom/get',
    method: 'get',
    params: classroomUuid ? { classroom_uuid: classroomUuid } : {},
  })
}

/**
 * 新增教室
 * @param data 新增教室信息
 * @returns void
 */
export function addClassroom(data: AddClassroomVO): Promise<void> {
  return request({
    url: '/v1/classroom/add',
    method: 'post',
    data,
  })
}

/**
 * 教室分页查询
 * @param params 分页查询参数
 * @returns 教室分页数据
 */
export function getClassroomPage(params: ClassroomPageQuery): Promise<PageDTO<ClassroomInfoDTO>> {
  return request({
    url: '/v1/classroom/getPage',
    method: 'get',
    params,
  })
}

/**
 * 更新教室信息
 * @param data 更新教室信息
 * @returns void
 */
export function updateClassroom(data: {
  classroom_uuid: string
  building_uuid: string
  classroom_name: string
  classroom_capacity: number
  classroom_type_uuid: string
}): Promise<void> {
  return request({
    url: '/v1/classroom/update',
    method: 'put',
    params: data,
  })
}

/**
 * 删除教室
 * @param classroomUuid 教室UUID
 * @returns void
 */
export function deleteClassroom(classroomUuid: string): Promise<void> {
  return request({
    url: '/v1/classroom/delete',
    method: 'delete',
    params: { classroom_uuid: classroomUuid },
  })
}
