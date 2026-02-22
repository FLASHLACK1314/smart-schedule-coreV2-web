/**
 * 学期管理相关 API
 */
import request from './index'
import type { SemesterInfoDTO, SemesterPageQuery, PageDTO } from './types'

/**
 * 分页查询学期列表
 * @param params 查询参数
 * @returns 学期分页数据
 */
export function getSemesterPage(params: SemesterPageQuery): Promise<PageDTO<SemesterInfoDTO>> {
  return request({
    url: '/v1/semester/getPage',
    method: 'get',
    params,
  })
}

/**
 * 获取单个学期信息
 * @param semesterUuid 学期UUID
 * @returns 学期信息
 */
export function getSemester(semesterUuid: string): Promise<SemesterInfoDTO> {
  return request({
    url: '/v1/semester/get',
    method: 'get',
    params: { semester_uuid: semesterUuid },
  })
}

/**
 * 新增学期
 * @param data 学期数据
 * @returns void
 */
export function addSemester(data: {
  semester_name: string
  semester_weeks: number
  start_date: string
  end_date: string
}): Promise<void> {
  return request({
    url: '/v1/semester/add',
    method: 'post',
    params: data,
  })
}

/**
 * 更新学期信息
 * @param data 学期数据
 * @returns void
 */
export function updateSemester(data: {
  semester_uuid: string
  semester_name: string
  semester_weeks: number
  start_date: string
  end_date: string
}): Promise<void> {
  return request({
    url: '/v1/semester/update',
    method: 'put',
    params: data,
  })
}

/**
 * 删除学期
 * @param semesterUuid 学期UUID
 * @returns void
 */
export function deleteSemester(semesterUuid: string): Promise<void> {
  return request({
    url: '/v1/semester/delete',
    method: 'delete',
    params: { semester_uuid: semesterUuid },
  })
}
