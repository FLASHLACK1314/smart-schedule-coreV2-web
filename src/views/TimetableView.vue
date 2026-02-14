<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import SearchSelect from '@/components/SearchSelect.vue'
import {
  getTeacherTimetable,
  getStudentTimetable,
  getClassTimetable,
  getClassroomTimetable,
} from '@/api/timetable'
import { getSemesterPage } from '@/api/semester'
import { getTeacherPage } from '@/api/teacher'
import { getStudentPage } from '@/api/student'
import { getClassPage } from '@/api/class'
import { getClassroomPage } from '@/api/classroom'
import type {
  TimetableType,
  TimetableCellDTO,
  SemesterInfoDTO,
  TeacherInfoDTO,
  StudentInfoDTO,
  ClassInfoDTO,
  ClassroomInfoDTO,
} from '@/api/types'
import { useMessage } from '@/composables/useMessage'

const router = useRouter()
const { success, error, warning, info } = useMessage()

// ========== 常量定义 ==========
const MAX_SECTIONS = 12 // 最大节次
const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// ========== 组件状态 ==========
// Tab 类型
const activeTab = ref<TimetableType>('teacher')

// 查询条件
const selectedSemesterUuid = ref<string>('')
const selectedTeacherUuid = ref<string>('')
const selectedStudentUuid = ref<string>('')
const selectedClassUuid = ref<string>('')
const selectedClassroomUuid = ref<string>('')

// 周次筛选
const selectedWeek = ref<number>(0) // 0 表示全部周次
const currentSemesterWeeks = ref<number>(20) // 当前学期的周数，默认20

// 数据状态
const timetableData = ref<TimetableCellDTO[]>([])
const loading = ref(false)

// 学期列表
const semesters = ref<SemesterInfoDTO[]>([])

// 选中项显示
const selectedSemesterName = ref<string>('')
const selectedTeacherName = ref<string>('')
const selectedStudentName = ref<string>('')
const selectedClassName = ref<string>('')
const selectedClassroomName = ref<string>('')

// 详情弹窗
const showDetailDialog = ref(false)
const selectedCell = ref<TimetableCellDTO | null>(null)

// ========== 工具函数 ==========
// 解析周次 JSON
const parseWeeksJson = (weeksJson: string): number[] => {
  try {
    return JSON.parse(weeksJson)
  } catch {
    return []
  }
}

// 检查课程是否在指定周次
const isWeekInSchedule = (weeksJson: string, week: number): boolean => {
  const weeks = parseWeeksJson(weeksJson)
  return weeks.includes(week)
}

// 格式化周次显示（连续周次合并）
const formatWeeks = (weeksJson: string): string => {
  const weeks = parseWeeksJson(weeksJson)
  if (weeks.length === 0) return ''

  // 排序并去重
  const sortedWeeks = [...new Set(weeks)].sort((a, b) => a - b)

  const ranges: string[] = []
  let start = sortedWeeks[0]!
  let end = sortedWeeks[0]!

  for (let i = 1; i < sortedWeeks.length; i++) {
    if (sortedWeeks[i]! === end! + 1) {
      end = sortedWeeks[i]!
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`)
      start = sortedWeeks[i]!
      end = sortedWeeks[i]!
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`)

  return ranges.join(',') + '周'
}

// 获取星期名称
const getWeekdayName = (dayOfWeek: number): string => {
  return WEEKDAY_NAMES[dayOfWeek - 1] || ''
}

// ========== 数据获取函数 ==========
// 获取学期列表
const fetchSemesters = async () => {
  try {
    const response = await getSemesterPage({
      page: 1,
      size: 100,
    })
    semesters.value = response.records

    // 如果没有学期数据，提示用户
    if (semesters.value.length === 0) {
      warning('暂无学期数据，请先添加学期')
      return
    }

    // 设置默认学期：选择列表中的第一个
    if (!selectedSemesterUuid.value) {
      const latestSemester = semesters.value[0]!
      selectedSemesterUuid.value = latestSemester.semester_uuid
      selectedSemesterName.value = latestSemester.semester_name
      currentSemesterWeeks.value = latestSemester.semester_weeks || 20

      // 初始化默认教师并自动查询课表
      await initializeDefaultTeacher()
    }
  } catch (err) {
    console.error('获取学期列表失败:', err)
    error('获取学期列表失败: ' + (err as Error).message)
  }
}

// 教师搜索
const fetchTeachers = async (keyword: string) => {
  try {
    const hasAlphaNumeric = /[a-zA-Z0-9]/.test(keyword)
    const response = await getTeacherPage({
      page: 1,
      size: 20,
      // 空关键词时不传搜索参数，返回前20条
      ...(keyword.trim() ? { [hasAlphaNumeric ? 'teacher_num' : 'teacher_name']: keyword } : {})
    })
    return response.records.map((t) => ({
      label: `${t.teacher_name} (${t.teacher_num})`,
      value: t.teacher_uuid,
    }))
  } catch (err) {
    console.error('搜索教师失败:', err)
    return []
  }
}

// 初始化默认教师
const initializeDefaultTeacher = async () => {
  try {
    loading.value = true
    const teachers = await fetchTeachers('') // 空字符串获取前20条

    // 如果没有教师数据，提示用户
    if (teachers.length === 0) {
      warning('暂无教师数据，请先添加教师')
      return
    }

    // 设置默认教师：选择列表中的第一个
    if (!selectedTeacherUuid.value) {
      const firstTeacher = teachers[0]!
      selectedTeacherUuid.value = firstTeacher.value
      selectedTeacherName.value = firstTeacher.label

      // 自动触发课表查询
      await fetchTimetable()
    }
  } catch (err) {
    console.error('初始化默认教师失败:', err)
    error('初始化默认教师失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 学生搜索
const fetchStudents = async (keyword: string) => {
  const response = await getStudentPage({
    page: 1,
    size: 50,
    student_name: keyword,
  })
  return response.records.map((s) => ({
    label: `${s.student_name} (${s.student_id})`,
    value: s.student_uuid,
  }))
}

// 班级搜索
const fetchClasses = async (keyword: string) => {
  const response = await getClassPage({
    page: 1,
    size: 50,
    class_name: keyword,
  })
  return response.records.map((c) => ({
    label: c.class_name,
    value: c.class_uuid,
  }))
}

// 教室搜索
const fetchClassrooms = async (keyword: string) => {
  const response = await getClassroomPage({
    page: 1,
    size: 50,
    classroom_name: keyword,
  })
  return response.records.map((cr) => ({
    label: `${cr.classroom_name} (${cr.building_name})`,
    value: cr.classroom_uuid,
  }))
}

// 获取课表数据
const fetchTimetable = async () => {
  // 检查必要条件
  if (!selectedSemesterUuid.value) {
    error('请先选择学期')
    return
  }

  // 根据 Tab 类型检查对应的查询对象
  const targetUuid =
    activeTab.value === 'teacher'
      ? selectedTeacherUuid.value
      : activeTab.value === 'student'
        ? selectedStudentUuid.value
        : activeTab.value === 'class'
          ? selectedClassUuid.value
          : selectedClassroomUuid.value

  if (!targetUuid) {
    error(`请先选择${getTabLabel(activeTab.value)}`)
    return
  }

  loading.value = true
  try {
    let data: TimetableCellDTO[]

    if (activeTab.value === 'teacher') {
      data = await getTeacherTimetable({
        teacher_uuid: selectedTeacherUuid.value,
        semester_uuid: selectedSemesterUuid.value,
      })
    } else if (activeTab.value === 'student') {
      data = await getStudentTimetable({
        student_uuid: selectedStudentUuid.value,
        semester_uuid: selectedSemesterUuid.value,
      })
    } else if (activeTab.value === 'class') {
      data = await getClassTimetable({
        class_uuid: selectedClassUuid.value,
        semester_uuid: selectedSemesterUuid.value,
      })
    } else {
      data = await getClassroomTimetable({
        classroom_uuid: selectedClassroomUuid.value,
        semester_uuid: selectedSemesterUuid.value,
      })
    }

    timetableData.value = data
  } catch (err) {
    console.error('获取课表数据失败:', err)
    const errorMsg = (err as Error).message

    // 检查是否是 404 错误（接口暂未开放）
    if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
      error('接口暂未开放，请稍后再试')
    } else {
      error('获取课表数据失败: ' + errorMsg)
    }
    timetableData.value = []
  } finally {
    loading.value = false
  }
}

// ========== 计算属性 ==========

// 过滤后的课表数据（根据周次筛选）
const filteredTimetable = computed(() => {
  if (selectedWeek.value === 0) {
    return timetableData.value
  }

  return timetableData.value.filter((cell) =>
    isWeekInSchedule(cell.weeks_json, selectedWeek.value)
  )
})

// 课表网格数据（按"星期_节次"索引）
const timetableGrid = computed(() => {
  const grid = new Map<string, TimetableCellDTO[]>()

  // 初始化空网格
  for (let day = 1; day <= 7; day++) {
    for (let section = 1; section <= MAX_SECTIONS; section++) {
      const key = `${day}_${section}`
      grid.set(key, [])
    }
  }

  // 填充数据
  filteredTimetable.value.forEach((cell) => {
    const { day_of_week, section_start, section_end } = cell

    // 在课程的每一节都显示
    for (let section = section_start; section <= section_end; section++) {
      const key = `${day_of_week}_${section}`
      const cells = grid.get(key) || []
      cells.push(cell)
      grid.set(key, cells)
    }
  })

  return grid
})

// 获取指定单元格的数据
const getCellData = (day: number, section: number): TimetableCellDTO[] => {
  const key = `${day}_${section}`
  return timetableGrid.value.get(key) || []
}

// ========== UI 交互函数 ==========

// 获取 Tab 标签
const getTabLabel = (tab: TimetableType): string => {
  const labels = {
    teacher: '教师',
    student: '学生',
    class: '班级',
    classroom: '教室',
  }
  return labels[tab]
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 查看课程详情
const handleCellClick = (cells: TimetableCellDTO[]) => {
  if (cells.length === 0) return

  // 如果有多个课程，选择第一个
  selectedCell.value = cells[0]!
  showDetailDialog.value = true
}

// 关闭详情弹窗
const closeDetailDialog = () => {
  showDetailDialog.value = false
  selectedCell.value = null
}

// ========== 监听变化 ==========
// 当 Tab 切换时，清空查询对象
watch(activeTab, () => {
  selectedTeacherUuid.value = ''
  selectedStudentUuid.value = ''
  selectedClassUuid.value = ''
  selectedClassroomUuid.value = ''
  selectedTeacherName.value = ''
  selectedStudentName.value = ''
  selectedClassName.value = ''
  selectedClassroomName.value = ''
  timetableData.value = []
})

// ========== 初始化 ==========
fetchSemesters()
</script>

<template>
  <div class="timetable-view">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo">
          <span class="logo-icon">📅</span>
          <span class="logo-text">课表查看</span>
        </div>
        <button class="back-button" @click="goBack">
          <span class="back-icon">←</span>
          <span>返回首页</span>
        </button>
      </div>
    </nav>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 控制面板 -->
      <div class="control-panel">
        <!-- Tab 切换 -->
        <div class="tab-container">
          <button
            v-for="tab in ['teacher', 'student', 'class', 'classroom'] as TimetableType[]"
            :key="tab"
            class="tab-button"
            :class="{ active: activeTab === tab }"
            @click="activeTab = tab"
          >
            {{ getTabLabel(tab) }}课表
          </button>
        </div>

        <!-- 学期选择 -->
        <div class="filter-group">
          <label class="filter-label">学期</label>
          <SearchSelect
            v-model="selectedSemesterUuid"
            placeholder="请选择学期"
            :fetch-async="
              async (keyword: string) => {
                return semesters.map((s) => ({
                  label: s.semester_name,
                  value: s.semester_uuid,
                  semester_weeks: s.semester_weeks,
                }))
              }
            "
            :initial-option="
              selectedSemesterUuid
                ? { label: selectedSemesterName, value: selectedSemesterUuid }
                : null
            "
            load-on-focus
            @change="
              (option: any) => {
                if (option) {
                  selectedSemesterName = option.label
                  currentSemesterWeeks = option.semester_weeks || 20
                }
              }
            "
          />
        </div>

        <!-- 查询对象选择 -->
        <div class="filter-group">
          <label class="filter-label">{{ getTabLabel(activeTab) }}</label>
          <SearchSelect
            v-if="activeTab === 'teacher'"
            v-model="selectedTeacherUuid"
            placeholder="请搜索教师"
            :fetch-async="fetchTeachers"
            :initial-option="
              selectedTeacherUuid
                ? { label: selectedTeacherName, value: selectedTeacherUuid }
                : null
            "
            load-on-focus
            @change="
              (option: any) => {
                if (option) selectedTeacherName = option.label
              }
            "
          />
          <SearchSelect
            v-else-if="activeTab === 'student'"
            v-model="selectedStudentUuid"
            placeholder="请搜索学生"
            :fetch-async="fetchStudents"
            :initial-option="
              selectedStudentUuid
                ? { label: selectedStudentName, value: selectedStudentUuid }
                : null
            "
            @change="
              (option: any) => {
                if (option) selectedStudentName = option.label
              }
            "
          />
          <SearchSelect
            v-else-if="activeTab === 'class'"
            v-model="selectedClassUuid"
            placeholder="请搜索班级"
            :fetch-async="fetchClasses"
            :initial-option="
              selectedClassUuid
                ? { label: selectedClassName, value: selectedClassUuid }
                : null
            "
            @change="
              (option: any) => {
                if (option) selectedClassName = option.label
              }
            "
          />
          <SearchSelect
            v-else-if="activeTab === 'classroom'"
            v-model="selectedClassroomUuid"
            placeholder="请搜索教室"
            :fetch-async="fetchClassrooms"
            :initial-option="
              selectedClassroomUuid
                ? { label: selectedClassroomName, value: selectedClassroomUuid }
                : null
            "
            @change="
              (option: any) => {
                if (option) selectedClassroomName = option.label
              }
            "
          />
        </div>

        <!-- 周次筛选 -->
        <div class="filter-group">
          <label class="filter-label">周次</label>
          <select v-model="selectedWeek" class="week-select">
            <option :value="0">全部周次</option>
            <option v-for="week in currentSemesterWeeks" :key="week" :value="week">
              第 {{ week }} 周
            </option>
          </select>
        </div>

        <!-- 查询按钮 -->
        <button class="query-button" @click="fetchTimetable" :disabled="loading">
          <span v-if="loading" class="loading-icon"></span>
          <span>{{ loading ? '查询中...' : '查询课表' }}</span>
        </button>
      </div>

      <!-- 课表网格 -->
      <div class="timetable-container" v-if="filteredTimetable.length > 0 || loading">
        <table class="timetable-grid">
          <thead>
            <tr>
              <th class="corner-cell">节次/星期</th>
              <th v-for="day in 7" :key="day">{{ getWeekdayName(day) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="section in MAX_SECTIONS" :key="section">
              <td class="section-header">{{ section }}节</td>
              <td
                v-for="day in 7"
                :key="day"
                class="timetable-cell"
                @click="handleCellClick(getCellData(day, section))"
              >
                <div
                  v-for="cell in getCellData(day, section)"
                  :key="cell.schedule_uuid"
                  class="course-card"
                >
                  <div class="course-name">{{ cell.course_name }}</div>
                  <div class="course-info">
                    <span v-if="activeTab !== 'teacher'">{{ cell.teacher_name }}</span>
                    <span v-if="activeTab !== 'classroom'">{{ cell.classroom_name }}</span>
                  </div>
                  <div class="course-weeks">{{ formatWeeks(cell.weeks_json) }}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-state">
        <span class="empty-icon">📊</span>
        <p class="empty-text">请选择学期和查询对象，然后点击"查询课表"</p>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetailDialog && selectedCell" class="modal-overlay" @click="closeDetailDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">课程详情</h3>
          <button class="modal-close" @click="closeDetailDialog">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">课程名称</span>
            <span class="detail-value">{{ selectedCell.course_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">教学班</span>
            <span class="detail-value">{{ selectedCell.teaching_class_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">教师</span>
            <span class="detail-value">{{ selectedCell.teacher_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">教室</span>
            <span class="detail-value">{{ selectedCell.classroom_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">学期</span>
            <span class="detail-value">{{ selectedCell.semester_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">上课时间</span>
            <span class="detail-value"
              >{{ getWeekdayName(selectedCell.day_of_week) }} {{ selectedCell.section_start }}-{{
                selectedCell.section_end
              }}节</span
            >
          </div>
          <div class="detail-row">
            <span class="detail-label">上课周次</span>
            <span class="detail-value">{{ formatWeeks(selectedCell.weeks_json) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态</span>
            <span class="detail-value" :class="{ locked: selectedCell.is_locked }">
              {{ selectedCell.is_locked ? '已锁定' : '未锁定' }}
              {{ selectedCell.status === 0 ? '（预览）' : '（正式）' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">更新时间</span>
            <span class="detail-value">{{ selectedCell.updated_at }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timetable-view {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  padding-bottom: 2rem;
}

/* 顶部导航栏 */
.top-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(15, 15, 26, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  transform: translateY(-1px);
}

.back-icon {
  font-size: 1rem;
}

/* 主内容区 */
.main-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 控制面板 */
.control-panel {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-end;
}

.tab-container {
  display: flex;
  gap: 0.5rem;
  flex: 1 1 auto;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #a0aec0;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.tab-button.active {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1 1 200px;
  min-width: 200px;
}

.filter-label {
  color: #a0aec0;
  font-size: 0.9rem;
  font-weight: 500;
}

.week-select {
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.week-select:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.week-select option {
  background: #1a1a2e;
  color: #ffffff;
}

.query-button {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.query-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
}

.query-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-icon {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 课表容器 */
.timetable-container {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.timetable-grid {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.timetable-grid th,
.timetable-grid td {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  text-align: center;
}

.timetable-grid th {
  background: rgba(0, 212, 255, 0.1);
  color: #ffffff;
  font-weight: 600;
  padding: 1.25rem 1rem;
}

.corner-cell {
  background: rgba(124, 58, 237, 0.2) !important;
  font-weight: 700;
}

.section-header {
  background: rgba(0, 212, 255, 0.05);
  color: #00d4ff;
  font-weight: 600;
  min-width: 80px;
}

.timetable-cell {
  background: rgba(255, 255, 255, 0.02);
  min-width: 140px;
  height: 100px;
  vertical-align: top;
  cursor: pointer;
  transition: all 0.2s ease;
}

.timetable-cell:hover {
  background: rgba(255, 255, 255, 0.05);
}

.course-card {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
}

.course-card:last-child {
  margin-bottom: 0;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
}

.course-name {
  color: #ffffff;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  color: #a0aec0;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.course-weeks {
  color: #00d4ff;
  font-size: 0.7rem;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-text {
  color: #a0aec0;
  font-size: 1.1rem;
}

/* 详情弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #a0aec0;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border-color: rgba(244, 67, 54, 0.3);
}

.modal-body {
  padding: 2rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #a0aec0;
  font-size: 0.95rem;
  font-weight: 500;
}

.detail-value {
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: right;
  max-width: 60%;
}

.detail-value.locked {
  color: #f44336;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .control-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    width: 100%;
  }

  .tab-container {
    width: 100%;
  }

  .query-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .navbar-content {
    padding: 1rem;
  }

  .main-content {
    padding: 1rem;
  }

  .control-panel {
    padding: 1.5rem;
  }

  .timetable-container {
    padding: 1rem;
  }

  .timetable-cell {
    min-width: 100px;
    height: 80px;
    padding: 0.5rem;
  }

  .course-card {
    padding: 0.3rem;
  }

  .course-name {
    font-size: 0.8rem;
  }

  .course-info {
    font-size: 0.7rem;
  }

  .course-weeks {
    font-size: 0.6rem;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .detail-value {
    max-width: 100%;
    text-align: left;
  }
}
</style>
