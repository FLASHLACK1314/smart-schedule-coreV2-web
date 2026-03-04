<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AutoScheduleResult, ScheduleItem } from '@/api/types'
import ScheduleGrid from '@/components/ScheduleGrid.vue'
import ConflictReport from './ConflictReport.vue'

// Props
interface Props {
  result: AutoScheduleResult
}

const props = defineProps<Props>()

// 视图模式
const viewMode = ref<'grid' | 'list'>('grid')

// 从 schedule_map 转换出的课程安排数组
const scheduleList = computed<ScheduleItem[]>(() => {
  console.log('[ResultPreview] props.result:', props.result)
  console.log('[ResultPreview] schedule_map:', props.result?.schedule_map)
  console.log('[ResultPreview] schedule_map keys:', props.result?.schedule_map ? Object.keys(props.result.schedule_map) : [])

  const list: ScheduleItem[] = []
  if (props.result.schedule_map) {
    Object.values(props.result.schedule_map).forEach(items => {
      console.log('[ResultPreview] Processing items:', items)
      if (Array.isArray(items)) {
        list.push(...items)
      }
    })
  }

  console.log('[ResultPreview] Final scheduleList:', list)
  console.log('[ResultPreview] scheduleList length:', list.length)
  return list
})

// 排课状态
const scheduleStatus = computed<'success' | 'partial' | 'failed'>(() => {
  if (!props.result) return 'failed'
  const stats = props.result.statistics
  if (stats.scheduled_teaching_classes === 0) return 'failed'
  if (stats.scheduled_teaching_classes === stats.total_teaching_classes) return 'success'
  return 'partial'
})

// 状态文本
const statusText = computed(() => {
  switch (scheduleStatus.value) {
    case 'success': return '排课成功'
    case 'partial': return '部分成功'
    case 'failed': return '排课失败'
  }
})

// 周次格式化
const formatWeeks = (weeks: number[] | undefined): string => {
  if (!weeks || weeks.length === 0) return '-'

  // 检查是否连续
  let isContinuous = true
  for (let i = 1; i < weeks.length; i++) {
    const prevWeek = weeks[i - 1]
    const currWeek = weeks[i]
    if (prevWeek === undefined || currWeek === undefined || currWeek !== prevWeek + 1) {
      isContinuous = false
      break
    }
  }

  const firstWeek = weeks[0]
  const lastWeek = weeks[weeks.length - 1]
  if (isContinuous && firstWeek !== undefined && lastWeek !== undefined) {
    return `第${firstWeek}-${lastWeek}周`
  }

  if (weeks.length > 5) {
    return `${weeks.slice(0, 3).join(',')}...等${weeks.length}周`
  }

  return `第${weeks.join(',')}周`
}

// 从 time_slot 中提取时间信息的辅助函数
const getTimeSlot = (item: ScheduleItem) => {
  const timeSlot = item.time_slot || {
    day_of_week: item.day_of_week ?? 1,
    section_start: item.section_start ?? 1,
    section_end: item.section_end ?? 2,
    weeks: item.weeks ?? []
  }

  console.log('[ResultPreview] getTimeSlot input:', item)
  console.log('[ResultPreview] getTimeSlot output:', timeSlot)

  return timeSlot
}

// 为 ScheduleGrid 转换数据格式
const gridAppointments = computed(() => {
  console.log('[ResultPreview] scheduleList.value:', scheduleList.value)
  console.log('[ResultPreview] scheduleList.value.length:', scheduleList.value.length)

  const result = scheduleList.value.map(item => {
    // 从 time_slot 中提取时间信息（支持嵌套和平铺两种结构）
    const timeSlot = getTimeSlot(item)
    const dayOfWeek = timeSlot.day_of_week ?? item.day_of_week ?? 1
    const sectionStart = timeSlot.section_start ?? item.section_start ?? 1
    const sectionEnd = timeSlot.section_end ?? item.section_end ?? 2
    const weeks = timeSlot.weeks ?? item.weeks ?? []

    const converted = {
      ...item,
      day_of_week: dayOfWeek,
      section_start: sectionStart,
      section_end: sectionEnd,
      weeks: weeks,
      weeks_json: JSON.stringify(weeks)
    }
    console.log('[ResultPreview] Converted item:', converted)
    return converted
  })

  console.log('[ResultPreview] Total grid appointments:', result.length)
  console.log('[ResultPreview] gridAppointments result:', result)
  return result
})
</script>

<template>
  <div class="result-preview">
    <!-- 状态标题 -->
    <div class="preview-header">
      <h2>排课结果预览</h2>
      <span :class="['status-badge', scheduleStatus]">
        {{ statusText }}
      </span>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ result.statistics.total_teaching_classes }}</div>
          <div class="stat-label">总教学班</div>
        </div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ result.statistics.scheduled_teaching_classes }}</div>
          <div class="stat-label">已排课</div>
        </div>
      </div>

      <div class="stat-card error">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-value">{{ result.statistics.total_teaching_classes - result.statistics.scheduled_teaching_classes }}</div>
          <div class="stat-label">未排课</div>
        </div>
      </div>

      <div class="stat-card" :class="{ warning: result.hard_conflicts + result.soft_conflicts > 0 }">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-value">{{ result.hard_conflicts + result.soft_conflicts }}</div>
          <div class="stat-label">冲突数</div>
        </div>
      </div>
    </div>

    <!-- 适应度展示 -->
    <div class="fitness-section">
      <div class="fitness-label">适应度分数</div>
      <div class="fitness-bar">
        <div class="fitness-fill" :style="{ width: `${Math.min(result.fitness * 100, 100)}%` }"></div>
      </div>
      <div class="fitness-value">{{ (result.fitness * 100).toFixed(1) }}%</div>
    </div>

    <!-- 冲突报告 -->
    <ConflictReport
      :conflict-report="result.conflict_report"
      :hard-conflicts="result.hard_conflicts"
      :soft-conflicts="result.soft_conflicts"
    />

    <!-- 排课详情 -->
    <div v-if="scheduleList.length > 0" class="schedules-section">
      <div class="section-header">
        <h3>排课详情 ({{ scheduleList.length }} 条)</h3>
        <div class="view-mode-tabs">
          <button
            type="button"
            :class="['tab-btn', { active: viewMode === 'grid' }]"
            @click="viewMode = 'grid'"
          >
            课表视图
          </button>
          <button
            type="button"
            :class="['tab-btn', { active: viewMode === 'list' }]"
            @click="viewMode = 'list'"
          >
            列表视图
          </button>
        </div>
      </div>

      <!-- 课表网格视图 -->
      <div v-if="viewMode === 'grid'" class="schedule-grid-wrapper">
        <ScheduleGrid :appointments="gridAppointments" />
      </div>

      <!-- 列表视图 -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>教学班</th>
              <th>课程</th>
              <th>教师</th>
              <th>教室</th>
              <th>星期</th>
              <th>节次</th>
              <th>周次</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="schedule in scheduleList" :key="schedule.teaching_class_uuid + getTimeSlot(schedule).unique_id">
              <td>{{ schedule.teaching_class_name }}</td>
              <td>{{ schedule.course_name }}</td>
              <td>{{ schedule.teacher_name }}</td>
              <td>{{ schedule.classroom_name }}</td>
              <td>周{{ getTimeSlot(schedule).day_of_week }}</td>
              <td>{{ getTimeSlot(schedule).section_start }}-{{ getTimeSlot(schedule).section_end }}</td>
              <td>{{ formatWeeks(getTimeSlot(schedule).weeks) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-preview {
  width: 100%;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.preview-header h2 {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.status-badge {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-badge.success {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.status-badge.partial {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.status-badge.failed {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(30, 30, 50, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card.success {
  border-color: rgba(76, 175, 80, 0.3);
  background: rgba(76, 175, 80, 0.1);
}

.stat-card.error {
  border-color: rgba(244, 67, 54, 0.3);
  background: rgba(244, 67, 54, 0.1);
}

.stat-card.warning {
  border-color: rgba(255, 152, 0, 0.3);
  background: rgba(255, 152, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
}

.stat-label {
  color: #a0aec0;
  font-size: 0.9rem;
}

/* 适应度展示 */
.fitness-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  background: rgba(30, 30, 50, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.fitness-label {
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

.fitness-bar {
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.fitness-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff 0%, #7c3aed 100%);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.fitness-value {
  color: #00d4ff;
  font-size: 1rem;
  font-weight: 600;
  min-width: 60px;
  text-align: right;
}

/* 排课详情 */
.schedules-section {
  background: rgba(30, 30, 50, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header h3 {
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.view-mode-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.tab-btn.active {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-color: #00d4ff;
  color: white;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: rgba(0, 212, 255, 0.1);
  border-bottom: 2px solid rgba(0, 212, 255, 0.2);
}

.data-table th {
  padding: 1rem;
  text-align: left;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.9rem;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
  font-size: 0.9rem;
}

.data-table tbody tr:hover {
  background: rgba(0, 212, 255, 0.05);
}

.schedule-grid-wrapper {
  overflow-x: auto;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .view-mode-tabs {
    width: 100%;
  }

  .tab-btn {
    flex: 1;
    text-align: center;
  }

  .fitness-section {
    flex-wrap: wrap;
  }

  .fitness-bar {
    width: 100%;
    order: 3;
  }
}
</style>
