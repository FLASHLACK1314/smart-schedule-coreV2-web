<script setup lang="ts">
import type { TeacherScheduleQueryDTO, TeacherSchedule } from '@/api/dify'

defineProps<{
  data: TeacherScheduleQueryDTO
}>()

// 周次格式化（复用 ScheduleGrid 逻辑）
const formatWeeks = (weeksJson: string): string => {
  try {
    const weeks = JSON.parse(weeksJson)
    if (!Array.isArray(weeks) || weeks.length === 0) return '-'

    // 检查是否连续
    let isContinuous = true
    for (let i = 1; i < weeks.length; i++) {
      if (weeks[i] !== weeks[i - 1] + 1) {
        isContinuous = false
        break
      }
    }

    if (isContinuous) {
      return `第${weeks[0]}-${weeks[weeks.length - 1]}周`
    }

    // 不连续时，显示前几个 + 省略
    if (weeks.length > 5) {
      return `${weeks.slice(0, 3).join(',')}...等${weeks.length}周`
    }

    return `第${weeks.join(',')}周`
  } catch {
    return weeksJson
  }
}
</script>

<template>
  <div class="teacher-schedule-table">
    <!-- 错误状态 -->
    <div v-if="!data.success" class="error-state">
      <span class="error-icon">!</span>
      <span class="error-message">{{ data.errorMessage || '查询失败' }}</span>
    </div>

    <!-- 无数据状态 -->
    <div v-else-if="!data.teachers || data.teachers.length === 0" class="empty-state">
      <span class="empty-icon">-</span>
      <span class="empty-message">未查询到课表数据</span>
    </div>

    <!-- 教师课表列表 -->
    <div v-else class="teacher-list">
      <div v-for="teacher in data.teachers" :key="teacher.teacherUuid" class="teacher-block">
        <!-- 教师信息头部 -->
        <div class="teacher-header">
          <div class="teacher-info">
            <span class="teacher-name">{{ teacher.teacherName }}</span>
            <span class="teacher-num">{{ teacher.teacherNum }}</span>
          </div>
          <div class="filter-badge">
            {{ teacher.filterDescription }}
            <span class="schedule-count">{{ teacher.scheduleCount }} 条排课</span>
          </div>
        </div>

        <!-- 课表表格 -->
        <div class="schedule-table-wrapper">
          <table class="schedule-table">
            <thead>
              <tr>
                <th>课程名称</th>
                <th>教室</th>
                <th>星期</th>
                <th>节次</th>
                <th>周次</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="schedule in teacher.schedules" :key="schedule.scheduleUuid">
                <td class="course-name">{{ schedule.courseName }}</td>
                <td>{{ schedule.classroomName }}</td>
                <td>{{ schedule.dayOfWeekStr }}</td>
                <td>第{{ schedule.sectionStart }}-{{ schedule.sectionEnd }}节</td>
                <td class="weeks">{{ formatWeeks(schedule.weeksJson) }}</td>
              </tr>
              <tr v-if="teacher.schedules.length === 0">
                <td colspan="5" class="no-data">无排课记录</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.teacher-schedule-table {
  width: 100%;
}

/* 错误状态 */
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 12px;
}

.error-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 82, 82, 0.2);
  color: #ff5252;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

.empty-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(160, 174, 192, 0.2);
  color: #a0aec0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.error-message,
.empty-message {
  color: #a0aec0;
  font-size: 14px;
}

.error-state {
  background: rgba(255, 82, 82, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 82, 82, 0.2);
}

.empty-state {
  background: rgba(160, 174, 192, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* 教师块 */
.teacher-block {
  margin-bottom: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.teacher-block:last-child {
  margin-bottom: 0;
}

/* 教师头部 */
.teacher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 212, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.teacher-name {
  font-weight: 600;
  color: #fff;
  font-size: 14px;
}

.teacher-num {
  color: #a0aec0;
  font-size: 12px;
}

.filter-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: rgba(124, 58, 237, 0.2);
  border-radius: 12px;
  color: #a78bfa;
  font-size: 12px;
}

.schedule-count {
  color: #a0aec0;
  font-size: 11px;
}

/* 课表表格 */
.schedule-table-wrapper {
  overflow-x: auto;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.schedule-table th {
  padding: 10px 12px;
  text-align: left;
  background: rgba(0, 0, 0, 0.3);
  color: #00d4ff;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
}

.schedule-table td {
  padding: 10px 12px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.schedule-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.schedule-table tbody tr:last-child td {
  border-bottom: none;
}

.course-name {
  font-weight: 500;
  color: #fff;
}

.weeks {
  color: #a78bfa;
  font-size: 12px;
}

.no-data {
  text-align: center;
  color: #a0aec0;
  padding: 16px !important;
}

/* 响应式 */
@media (max-width: 480px) {
  .teacher-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .schedule-table {
    font-size: 12px;
  }

  .schedule-table th,
  .schedule-table td {
    padding: 8px;
  }
}
</style>
