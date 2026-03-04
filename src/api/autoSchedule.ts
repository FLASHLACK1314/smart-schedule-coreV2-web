import request from './index'
import type { AutoScheduleVO, AutoScheduleResult, ScheduleStatistics, ScheduleItem } from './types'

/**
 * 执行自动排课
 */
export function executeAutoSchedule(data: AutoScheduleVO): Promise<AutoScheduleResult> {
  return request({
    url: '/v1/auto-schedule/execute',
    method: 'post',
    data,
    timeout: 120000, // 排课可能需要较长时间（2分钟）
  })
}

/**
 * 保存排课方案为预览状态
 * @param semester_uuid 学期UUID
 * @param result 可选的排课结果，如果提供则保存该结果
 */
export function saveSchedulePreview(semester_uuid: string, result?: AutoScheduleResult): Promise<void> {
  return request({
    url: '/v1/auto-schedule/save-preview',
    method: 'post',
    params: { semester_uuid },
    data: result ? { result } : undefined,
  })
}

/**
 * 确认排课方案（将预览状态转为正式状态）
 */
export function confirmSchedule(semester_uuid: string): Promise<void> {
  return request({
    url: '/v1/auto-schedule/confirm',
    method: 'post',
    params: { semester_uuid },
  })
}

/**
 * 清除预览排课方案
 */
export function clearSchedulePreview(semester_uuid: string): Promise<void> {
  return request({
    url: '/v1/auto-schedule/clear-preview',
    method: 'delete',
    params: { semester_uuid },
  })
}

/**
 * 获取排课统计信息
 */
export function getScheduleStatistics(semester_uuid: string): Promise<ScheduleStatistics> {
  return request({
    url: '/v1/auto-schedule/statistics',
    method: 'get',
    params: { semester_uuid },
  })
}
