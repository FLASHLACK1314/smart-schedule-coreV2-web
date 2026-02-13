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
