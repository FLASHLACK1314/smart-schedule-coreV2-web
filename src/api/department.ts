/**
 * 学院管理相关 API
 */
import request from './index'
import type {
  DepartmentInfoDTO,
  DepartmentPageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询学院列表
 * @param params 查询参数
 * @returns 学院分页数据
 */
export function getDepartmentPage(params: DepartmentPageQuery): Promise<PageDTO<DepartmentInfoDTO>> {
  return request({
    url: '/v1/department/getPage',
    method: 'get',
    params,
  })
}

/**
 * 获取单个学院详情
 * @param departmentUuid 学院UUID
 * @returns 学院信息
 */
export function getDepartmentInfo(departmentUuid: string): Promise<DepartmentInfoDTO> {
  return request({
    url: '/v1/department/get',
    method: 'get',
    params: {
      department_uuid: departmentUuid,
    },
  })
}

/**
 * 添加学院
 * @param departmentName 学院名称
 */
export function addDepartment(departmentName: string): Promise<void> {
  return request({
    url: '/v1/department/add',
    method: 'post',
    data: {
      department_name: departmentName,
    },
  })
}

/**
 * 更新学院信息
 * @param departmentUuid 学院UUID
 * @param departmentName 学院名称
 */
export function updateDepartment(departmentUuid: string, departmentName: string): Promise<void> {
  return request({
    url: '/v1/department/update',
    method: 'put',
    data: {
      department_uuid: departmentUuid,
      department_name: departmentName,
    },
  })
}

/**
 * 删除学院
 * @param departmentUuid 学院UUID
 */
export function deleteDepartment(departmentUuid: string): Promise<void> {
  return request({
    url: '/v1/department/delete',
    method: 'delete',
    params: {
      department_uuid: departmentUuid,
    },
  })
}
