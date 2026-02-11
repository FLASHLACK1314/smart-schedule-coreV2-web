/**
 * 课程管理相关 API
 */
import request from './index'
import type {
  CourseInfoDTO,
  AddCourseVO,
  CoursePageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询课程列表
 */
export function getCoursePage(params: CoursePageQuery): Promise<PageDTO<CourseInfoDTO>> {
  return request({
    url: '/v1/course/getPage',
    method: 'get',
    params,
  })
}

/**
 * 添加课程
 */
export function addCourse(data: AddCourseVO): Promise<void> {
  return request({
    url: '/v1/course/add',
    method: 'post',
    data,  // 注意：此接口使用 RequestBody
  })
}

/**
 * 更新课程
 */
export function updateCourse(data: AddCourseVO): Promise<void> {
  return request({
    url: '/v1/course/update',
    method: 'put',
    data,  // 注意：此接口使用 RequestBody
  })
}

/**
 * 删除课程
 */
export function deleteCourse(courseUuid: string): Promise<void> {
  return request({
    url: '/v1/course/delete',
    method: 'delete',
    params: {
      course_uuid: courseUuid,
    },
  })
}
