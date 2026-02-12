/**
 * 教务管理员管理相关 API
 */
import request from './index'
import type {
  AcademicAdminInfoDTO,
  AddAcademicAdminVO,
  AcademicAdminPageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询教务管理员列表
 * @param params 查询参数
 * @returns 教务管理员分页数据
 */
export function getAcademicAdminPage(params: AcademicAdminPageQuery): Promise<PageDTO<AcademicAdminInfoDTO>> {
  return request({
    url: '/v1/academic/getPage',
    method: 'get',
    params,
  })
}

/**
 * 获取单个教务管理员详情
 * @param academicUuid 教务管理员UUID
 * @returns 教务管理员信息
 */
export function getAcademicAdminInfo(academicUuid: string): Promise<AcademicAdminInfoDTO> {
  return request({
    url: '/v1/academic/get',
    method: 'get',
    params: {
      academic_uuid: academicUuid,
    },
  })
}

/**
 * 添加教务管理员
 * @param data 教务管理员信息（密码必填）
 * @returns void
 */
export function addAcademicAdmin(data: AddAcademicAdminVO): Promise<void> {
  return request({
    url: '/v1/academic/add',
    method: 'post',
    data,
  })
}

/**
 * 更新教务管理员信息
 * @param data 教务管理员信息（密码可选）
 * @returns void
 */
export function updateAcademicAdmin(data: AddAcademicAdminVO): Promise<void> {
  return request({
    url: '/v1/academic/update',
    method: 'put',
    data,
  })
}

/**
 * 删除教务管理员
 * @param academicUuid 教务管理员UUID
 * @returns void
 */
export function deleteAcademicAdmin(academicUuid: string): Promise<void> {
  return request({
    url: '/v1/academic/delete',
    method: 'delete',
    params: {
      academic_uuid: academicUuid,
    },
  })
}
