/**
 * 教师授课偏好时间工具函数
 * 处理 JSON 字符串格式（后端）与中文描述（前端显示）的双向转换
 */

// 周几映射
export const WEEKDAY_MAP: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

/**
 * JSON → 中文描述（用于卡片显示）
 * @example formatLikeTime('{"1": [3,4]}') // "周一第3-4节"
 */
export function formatLikeTime(jsonStr: string): string {
  if (!jsonStr || jsonStr.trim() === '') return '未设置'

  try {
    const data = JSON.parse(jsonStr) as Record<number, number[]>
    if (Object.keys(data).length === 0) return '未设置'

    // 按周几排序并构建描述
    const sortedEntries = Object.entries(data)
      .filter(([_, periods]) => periods && periods.length > 0)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))

    if (sortedEntries.length === 0) return '未设置'

    const descriptions = sortedEntries.map(([day, periods]) => {
      const weekday = WEEKDAY_MAP[parseInt(day)] || `周${day}`
      const sortedPeriods = [...periods].sort((a, b) => a - b)
      const groups = groupConsecutiveNumbers(sortedPeriods)

      const periodDesc = groups
        .map((group) => {
          return group.length === 1 ? `第${group[0]}节` : `第${group[0]}-${group[group.length - 1]}节`
        })
        .join('、')

      return `${weekday}${periodDesc}`
    })

    return descriptions.join('、')
  } catch {
    return jsonStr // 解析失败返回原始字符串
  }
}

/**
 * JSON → Map（用于编辑器初始化）
 */
export function parseLikeTime(jsonStr: string): Map<number, number[]> {
  const map = new Map<number, number[]>()
  if (!jsonStr || jsonStr.trim() === '') return map

  try {
    const data = JSON.parse(jsonStr) as Record<number, number[]>
    for (const [day, periods] of Object.entries(data)) {
      const dayNum = parseInt(day)
      if (periods && Array.isArray(periods) && periods.length > 0) {
        map.set(dayNum, periods)
      }
    }
  } catch {}

  return map
}

/**
 * Map → JSON（用于保存）
 */
export function serializeLikeTime(selection: Map<number, number[]>): string {
  const obj: Record<number, number[]> = {}
  for (const [day, periods] of selection.entries()) {
    if (periods && periods.length > 0) {
      obj[day] = [...periods].sort((a, b) => a - b)
    }
  }
  return JSON.stringify(obj)
}

/**
 * 切换时间段选中状态
 */
export function toggleTimeSlot(
  selection: Map<number, number[]>,
  day: number,
  period: number
): Map<number, number[]> {
  const newMap = new Map(selection)
  const currentPeriods = newMap.get(day) || []
  const index = currentPeriods.indexOf(period)

  if (index > -1) {
    // 取消选中
    const updated = [...currentPeriods]
    updated.splice(index, 1)
    if (updated.length === 0) {
      newMap.delete(day)
    } else {
      newMap.set(day, updated)
    }
  } else {
    // 添加选中
    newMap.set(day, [...currentPeriods, period])
  }

  return newMap
}

/**
 * 检查时间段是否被选中
 */
export function isTimeSlotSelected(
  selection: Map<number, number[]>,
  day: number,
  period: number
): boolean {
  const periods = selection.get(day)
  return periods ? periods.includes(period) : false
}

/**
 * 辅助函数：分组连续数字
 * @example groupConsecutiveNumbers([1,2,3,5,6,8]) // [[1,2,3], [5,6], [8]]
 */
function groupConsecutiveNumbers(nums: number[]): number[][] {
  if (nums.length === 0) return []
  const groups: number[][] = []
  const first = nums[0]! // 数组长度 > 0，所以访问安全
  let currentGroup: number[] = [first]

  for (let i = 1; i < nums.length; i++) {
    const prev = nums[i - 1]! // 索引 i-1 总是 < i < nums.length
    const curr = nums[i]! // 索引 i 总是 < nums.length
    if (curr === prev + 1) {
      currentGroup.push(curr)
    } else {
      groups.push(currentGroup)
      currentGroup = [curr]
    }
  }
  groups.push(currentGroup)
  return groups
}
