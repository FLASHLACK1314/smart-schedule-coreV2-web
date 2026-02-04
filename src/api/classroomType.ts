/**
 * 教室类型管理相关 API
 */
import request from './index'
import type {
  ClassroomTypeInfoDTO,
  ClassroomTypePageQuery,
  PageDTO,
} from './types'

/**
 * 教室类型分页查询
 * @param params 分页查询参数
 * @returns 教室类型分页数据
 */
export function getClassroomTypePage(params: ClassroomTypePageQuery): Promise<PageDTO<ClassroomTypeInfoDTO>> {
  return request({
    url: '/v1/classroomType/getPage',
    method: 'get',
    params,
  })
}

/**
 * 获取单个教室类型信息
 * @param classroomTypeUuid 教室类型UUID
 * @returns 教室类型信息
 */
export function getClassroomType(classroomTypeUuid: string): Promise<ClassroomTypeInfoDTO> {
  return request({
    url: '/v1/classroomType/get',
    method: 'get',
    params: { classroom_type_uuid: classroomTypeUuid },
  })
}
