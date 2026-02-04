/**
 * 教学楼管理相关 API
 */
import request from './index'
import type {
  BuildingInfoDTO,
  BuildingPageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询教学楼列表
 * @param params 查询参数
 * @returns 教学楼分页数据
 */
export function getBuildingPage(params: BuildingPageQuery): Promise<PageDTO<BuildingInfoDTO>> {
  return request({
    url: '/v1/building/getPage',
    method: 'get',
    params,
  })
}

/**
 * 获取单个教学楼详情
 * @param buildingUuid 教学楼UUID
 * @returns 教学楼信息
 */
export function getBuildingInfo(buildingUuid: string): Promise<BuildingInfoDTO> {
  return request({
    url: '/v1/building/get',
    method: 'get',
    params: {
      building_uuid: buildingUuid,
    },
  })
}

/**
 * 新增教学楼
 * @param buildingNum 教学楼编号
 * @param buildingName 教学楼名称
 * @returns void
 */
export function addBuilding(buildingNum: string, buildingName: string): Promise<void> {
  return request({
    url: '/v1/building/add',
    method: 'post',
    params: {
      building_num: buildingNum,
      building_name: buildingName,
    },
  })
}

/**
 * 更新教学楼信息
 * @param buildingUuid 教学楼UUID
 * @param buildingNum 教学楼编号
 * @param buildingName 教学楼名称
 * @returns void
 */
export function updateBuilding(
  buildingUuid: string,
  buildingNum: string,
  buildingName: string
): Promise<void> {
  return request({
    url: '/v1/building/update',
    method: 'put',
    params: {
      building_uuid: buildingUuid,
      building_num: buildingNum,
      building_name: buildingName,
    },
  })
}

/**
 * 删除教学楼
 * @param buildingUuid 教学楼UUID
 * @returns void
 */
export function deleteBuilding(buildingUuid: string): Promise<void> {
  return request({
    url: '/v1/building/delete',
    method: 'delete',
    params: {
      building_uuid: buildingUuid,
    },
  })
}
