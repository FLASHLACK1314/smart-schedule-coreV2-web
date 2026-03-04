<script setup lang="ts">
import { ref, computed } from 'vue'

// Props 定义
interface Props {
  appointments: CourseAppointment[]
}

interface CourseAppointment {
  teaching_class_uuid: string
  teaching_class_name: string
  course_uuid: string
  course_name: string
  teacher_uuid: string
  teacher_name: string
  classroom_uuid: string
  classroom_name: string
  day_of_week: number
  section_start: number
  section_end: number
  weeks_json: string
}

const props = defineProps<Props>()

// 周次格式化
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

    if (weeks.length > 5) {
      return `${weeks.slice(0, 3).join(',')}...等${weeks.length}周`
    }

    return `第${weeks.join(',')}周`
  } catch {
    return weeksJson
  }
}

// 周次映射
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 节次映射
const sections = ['1-2', '3-4', '5-6', '7-8', '9-10', '11-12']

// 根据 section_start 获取对应的节次索引（1-12 映射到 1-6）
const getSectionIndex = (sectionStart: number): number => {
  // section_start 1,2 -> 索引 1 (1-2节)
  // section_start 3,4 -> 索引 2 (3-4节)
  // section_start 5,6 -> 索引 3 (5-6节)
  // 以此类推
  return Math.ceil(sectionStart / 2)
}

// 从节次字符串获取索引（'1-2' -> 1, '3-4' -> 2）
const getSectionIndexFromString = (sectionStr: string): number => {
  return sections.indexOf(sectionStr) + 1
}

// 构建课表网格数据
const scheduleGrid = computed(() => {
  const grid: Record<number, Record<number, CourseAppointment[]>> = {}

  // 初始化网格
  for (let day = 1; day <= 7; day++) {
    grid[day] = {}
    for (let section = 1; section <= 6; section++) {
      grid[day]![section] = []
    }
  }

  // 填充数据
  props.appointments.forEach(appointment => {
    const day = appointment.day_of_week
    const sectionIndex = getSectionIndex(appointment.section_start)

    if (grid[day] && grid[day][sectionIndex] !== undefined) {
      grid[day]![sectionIndex]!.push(appointment)
    }
  })

  return grid
})

// 处理单元格点击
const handleCellClick = (day: number, section: number, appointments: CourseAppointment[] | undefined) => {
  if (!appointments || appointments.length === 0) return

  // 可以在这里显示详细信息弹窗
  console.log('点击单元格:', { day, section, appointments })
}
</script>

<template>
  <div class="schedule-grid">
    <!-- 表头 -->
    <div class="grid-header">
      <div class="corner-cell"></div>
      <div
        v-for="day in weekDays"
        :key="day"
        class="day-header"
      >
        {{ day }}
      </div>
    </div>

    <!-- 网格内容 -->
    <div class="grid-body">
      <div
        v-for="section in sections"
        :key="section"
        class="section-row"
      >
        <div class="section-header">{{ section }}</div>
        <div
          v-for="(day, dayIndex) in 7"
          :key="`${dayIndex + 1}-${section}`"
          class="grid-cell"
          :class="{
            'has-content': (scheduleGrid[dayIndex + 1]?.[getSectionIndexFromString(section)] ?? []).length > 0,
            'multiple-content': (scheduleGrid[dayIndex + 1]?.[getSectionIndexFromString(section)] ?? []).length > 1
          }"
          @click="handleCellClick(dayIndex + 1, getSectionIndexFromString(section), scheduleGrid[dayIndex + 1]?.[getSectionIndexFromString(section)])"
        >
          <div
            v-if="(scheduleGrid[dayIndex + 1]?.[getSectionIndexFromString(section)] ?? []).length > 0"
            class="course-cards"
          >
            <div
              v-for="(appointment, index) in (scheduleGrid[dayIndex + 1]![getSectionIndexFromString(section)] ?? [])"
              :key="`${appointment.teaching_class_uuid}-${index}`"
              class="course-card"
            >
              <div class="course-name">{{ appointment.course_name }}</div>
              <div class="course-info">
                <span class="teacher">{{ appointment.teacher_name }}</span>
                <span class="separator">·</span>
                <span class="classroom">{{ appointment.classroom_name }}</span>
              </div>
              <div class="weeks">{{ formatWeeks(appointment.weeks_json) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-grid {
  width: 100%;
  background: rgba(30, 30, 50, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

/* 表头 */
.grid-header {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  background: rgba(0, 212, 255, 0.1);
  border-bottom: 2px solid rgba(0, 212, 255, 0.2);
}

.corner-cell {
  background: rgba(0, 212, 255, 0.05);
  padding: 1rem;
  font-weight: 600;
  color: #a0aec0;
  text-align: center;
}

.day-header {
  padding: 1rem;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

/* 网格内容 */
.grid-body {
  display: grid;
  grid-template-rows: repeat(6, 1fr);
}

.section-row {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section-row:last-child {
  border-bottom: none;
}

.section-header {
  background: rgba(0, 212, 255, 0.05);
  padding: 1rem;
  font-weight: 600;
  color: #a0aec0;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

/* 单元格 */
.grid-cell {
  min-height: 100px;
  padding: 0.75rem;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  cursor: default;
}

.grid-cell:hover {
  background: rgba(255, 255, 255, 0.02);
}

.grid-cell.has-content {
  cursor: pointer;
}

.grid-cell.has-content:hover {
  background: rgba(0, 212, 255, 0.05);
}

.grid-cell.multiple-content {
  background: rgba(255, 100, 100, 0.05);
}

.grid-cell.multiple-content:hover {
  background: rgba(255, 100, 100, 0.1);
}

/* 课程卡片 */
.course-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.course-card {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.3s ease;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.4);
}

.course-name {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.course-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #a0aec0;
  margin-bottom: 0.5rem;
}

.separator {
  opacity: 0.5;
}

.weeks {
  font-size: 0.8rem;
  color: #7c3aed;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .grid-header,
  .section-row {
    grid-template-columns: 60px repeat(7, 1fr);
  }

  .corner-cell,
  .section-header {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }

  .day-header {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }

  .grid-cell {
    min-height: 80px;
    padding: 0.5rem;
  }

  .course-card {
    padding: 0.5rem;
  }

  .course-name {
    font-size: 0.85rem;
  }

  .course-info {
    font-size: 0.75rem;
  }

  .weeks {
    font-size: 0.7rem;
  }
}

@media (max-width: 768px) {
  .schedule-grid {
    overflow-x: auto;
  }

  .grid-header,
  .section-row {
    min-width: 600px;
  }
}
</style>
