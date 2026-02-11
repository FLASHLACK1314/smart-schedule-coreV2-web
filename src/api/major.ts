/**
 * 专业管理相关 API
 */
import request from './index'
import type {
  MajorInfoDTO,
  AddMajorVO,
  MajorPageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询专业列表
 * @param params 查询参数
 * @returns 专业分页数据
 */
export function getMajorPage(params: MajorPageQuery): Promise<PageDTO<MajorInfoDTO>> {
  return request({
    url: '/v1/major/getPage',
    method: 'get',
    params,
  })
}

/**
 * 添加专业
 * @param data 专业信息
 * @returns void
 */
export function addMajor(data: AddMajorVO): Promise<void> {
  return request({
    url: '/v1/major/add',
    method: 'post',
    params: {
      department_uuid: data.department_uuid,
      major_num: data.major_num,
      major_name: data.major_name,
    },
  })
}

/**
 * 更新专业
 * @param data 专业信息
 * @returns void
 */
export function updateMajor(data: AddMajorVO): Promise<void> {
  return request({
    url: '/v1/major/update',
    method: 'put',
    params: {
      major_uuid: data.major_uuid,
      department_uuid: data.department_uuid,
      major_num: data.major_num,
      major_name: data.major_name,
    },
  })
}

/**
 * 删除专业
 * @param majorUuid 专业UUID
 * @returns void
 */
export function deleteMajor(majorUuid: string): Promise<void> {
  return request({
    url: '/v1/major/delete',
    method: 'delete',
    params: {
      major_uuid: majorUuid,
    },
  })
}
