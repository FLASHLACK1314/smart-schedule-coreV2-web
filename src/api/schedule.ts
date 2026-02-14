/**
 * 排课管理相关 API
 */
import request from './index'
import type {
  ScheduleInfoDTO,
  AddScheduleVO,
  SchedulePageQuery,
  PageDTO,
} from './types'

/**
 * 分页查询排课列表
 * @param params 查询参数（蛇形命名）
 * @returns 排课分页数据
 */
export function getSchedulePage(params: SchedulePageQuery): Promise<PageDTO<ScheduleInfoDTO>> {
  return request({
    url: '/v1/schedule/getPage',
    method: 'get',
    params,
  })
}

/**
 * 添加排课
 * @param data 排课信息（蛇形命名）
 * @returns 排课UUID
 */
export function addSchedule(data: AddScheduleVO): Promise<string> {
  return request({
    url: '/v1/schedule/add',
    method: 'post',
    data,
  })
}

/**
 * 获取排课详情
 * @param scheduleUuid 排课UUID
 * @returns 排课信息
 */
export function getSchedule(scheduleUuid: string): Promise<ScheduleInfoDTO> {
  return request({
    url: '/v1/schedule/get',
    method: 'get',
    params: { schedule_uuid: scheduleUuid },
  })
}

/**
 * 更新排课
 * @param data 排课信息（蛇形命名，需包含 schedule_uuid）
 * @returns void
 */
export function updateSchedule(data: AddScheduleVO): Promise<void> {
  return request({
    url: '/v1/schedule/update',
    method: 'put',
    data,
  })
}

/**
 * 删除排课
 * @param scheduleUuid 排课UUID
 * @returns void
 */
export function deleteSchedule(scheduleUuid: string): Promise<void> {
  return request({
    url: '/v1/schedule/delete',
    method: 'delete',
    params: { schedule_uuid: scheduleUuid },
  })
}
