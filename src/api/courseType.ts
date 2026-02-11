/**
 * 课程类型管理相关 API
 */
import request from './index'
import type {
  CourseTypeInfoDTO,
  AddCourseTypeVO,
  CourseTypePageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询课程类型列表
 */
export function getCourseTypePage(params: CourseTypePageQuery): Promise<PageDTO<CourseTypeInfoDTO>> {
  return request({
    url: '/v1/courseType/getPage',
    method: 'get',
    params,
  })
}

/**
 * 添加课程类型
 */
export function addCourseType(data: AddCourseTypeVO): Promise<void> {
  return request({
    url: '/v1/courseType/add',
    method: 'post',
    data,
  })
}

/**
 * 更新课程类型
 */
export function updateCourseType(data: AddCourseTypeVO): Promise<void> {
  return request({
    url: '/v1/courseType/update',
    method: 'put',
    data,
  })
}

/**
 * 删除课程类型
 */
export function deleteCourseType(courseTypeUuid: string): Promise<void> {
  return request({
    url: '/v1/courseType/delete',
    method: 'delete',
    params: {
      course_type_uuid: courseTypeUuid,
    },
  })
}
