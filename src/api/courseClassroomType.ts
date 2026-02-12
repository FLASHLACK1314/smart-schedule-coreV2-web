/**
 * 课程类型-教室类型关联管理相关 API
 */
import request from './index'
import type {
  CourseClassroomTypeInfoDTO,
  AddCourseClassroomTypeVO,
  CourseClassroomTypePageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询课程类型-教室类型关联列表
 */
export function getCourseClassroomTypePage(params: CourseClassroomTypePageQuery): Promise<PageDTO<CourseClassroomTypeInfoDTO>> {
  return request({
    url: '/v1/courseClassroomType/getPage',
    method: 'get',
    params,
  })
}

/**
 * 添加课程类型-教室类型关联
 */
export function addCourseClassroomType(data: AddCourseClassroomTypeVO): Promise<void> {
  return request({
    url: '/v1/courseClassroomType/add',
    method: 'post',
    data,
  })
}

/**
 * 删除课程类型-教室类型关联
 */
export function deleteCourseClassroomType(relationUuid: string): Promise<void> {
  return request({
    url: '/v1/courseClassroomType/delete',
    method: 'delete',
    params: {
      relation_uuid: relationUuid,
    },
  })
}
