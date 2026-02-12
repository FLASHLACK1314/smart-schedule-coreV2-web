/**
 * 课程-教师资格关联管理相关 API
 */
import request from './index'
import type {
  CourseQualificationInfoDTO,
  AddCourseQualificationVO,
  CourseQualificationPageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询课程-教师资格关联列表
 * @param params 查询参数
 * @returns 课程教师资格分页数据
 */
export function getCourseQualificationPage(
  params: CourseQualificationPageQuery
): Promise<PageDTO<CourseQualificationInfoDTO>> {
  return request({
    url: '/v1/courseQualification/getPage',
    method: 'get',
    params,
  })
}

/**
 * 添加课程-教师资格关联
 * @param data 课程教师资格信息
 * @returns void
 */
export function addCourseQualification(
  data: AddCourseQualificationVO
): Promise<void> {
  return request({
    url: '/v1/courseQualification/add',
    method: 'post',
    data,
  })
}

/**
 * 删除课程-教师资格关联
 * @param qualificationUuid 资格关联UUID
 * @returns void
 */
export function deleteCourseQualification(
  qualificationUuid: string
): Promise<void> {
  return request({
    url: '/v1/courseQualification/delete',
    method: 'delete',
    params: {
      qualification_uuid: qualificationUuid,
    },
  })
}
