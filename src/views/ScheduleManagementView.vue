<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getSchedulePage,
  addSchedule,
  updateSchedule,
  deleteSchedule as deleteScheduleApi,
} from '@/api/schedule'
import { getSemesterPage } from '@/api/semester'
import { getTeachingClassPage } from '@/api/teachingClass'
import { getClassroomPage } from '@/api/classroom'
import { getTeacherPage } from '@/api/teacher'
import type {
  ScheduleInfoDTO,
  AddScheduleVO,
  SemesterInfoDTO,
  TeachingClassInfoDTO,
  ClassroomInfoDTO,
  TeacherInfoDTO,
} from '@/api/types'
import { useMessage } from '@/composables/useMessage'
import { useUserStore } from '@/stores/user'
import SearchSelect from '@/components/SearchSelect.vue'

// 选项类型
interface SelectOption {
  label: string
  value: string
  [key: string]: any
}

const router = useRouter()
const { success, error } = useMessage()
const userStore = useUserStore()

// 权限控制
const canManage = computed(() => {
  const userType = userStore.userType
  return userType === 'SYSTEM_ADMIN' || userType === 'ACADEMIC_ADMIN'
})

// 响应式数据
const schedules = ref<ScheduleInfoDTO[]>([])
const semesters = ref<SemesterInfoDTO[]>([])
const teachingClasses = ref<TeachingClassInfoDTO[]>([])
const classrooms = ref<ClassroomInfoDTO[]>([])
const teachers = ref<TeacherInfoDTO[]>([])
const loading = ref(false)

// 筛选条件
const filterSemester = ref<string>('')
const filterTeachingClass = ref<string>('')
const filterClassroom = ref<string>('')
const filterTeacher = ref<string>('')
const filterDayOfWeek = ref<number | undefined>()
const filterStatus = ref<number | undefined>()

// 对话框相关
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

// 分页数据
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 表单数据
const formData = ref<AddScheduleVO>({
  semester_uuid: '',
  teaching_class_uuid: '',
  classroom_uuid: '',
  day_of_week: 1,
  section_start: 1,
  section_end: 2,
  weeks_json: '[]',
  is_locked: false,
  status: 0,
})

// 周次输入（用户友好的格式）
const weeksInput = ref('')

// 编辑时的初始选项
const initialSemesterOption = ref<SelectOption | null>(null)
const initialTeachingClassOption = ref<SelectOption | null>(null)
const initialClassroomOption = ref<SelectOption | null>(null)

// 星期选项
const dayOfWeekOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
]

// 状态选项
const statusOptions = [
  { label: '预览', value: 0 },
  { label: '正式', value: 1 },
]

// 搜索学期选项
const fetchSemesterOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const response = await getSemesterPage({
      page: 1,
      size: 20,
      // 空关键词时不传搜索参数
      ...(keyword.trim() ? { semester_name: keyword } : {})
    })
    return response.records.map((s) => ({
      label: s.semester_name,
      value: s.semester_uuid,
      semester_name: s.semester_name,
    }))
  } catch (err) {
    console.error('搜索学期失败:', err)
    return []
  }
}

// 搜索教学班选项
const fetchTeachingClassOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const response = await getTeachingClassPage({
      page: 1,
      size: 20,
    })
    // 前端过滤（因为后端可能不支持按名称搜索）
    const filtered = response.records.filter((tc) =>
      tc.teaching_class_name.includes(keyword)
    )
    return filtered.map((tc) => ({
      label: `${tc.teaching_class_name} - ${tc.course_name} - ${tc.teacher_name}`,
      value: tc.teaching_class_uuid,
      teaching_class_name: tc.teaching_class_name,
      course_name: tc.course_name,
      teacher_name: tc.teacher_name,
    }))
  } catch (err) {
    console.error('搜索教学班失败:', err)
    return []
  }
}

// 搜索教室选项
const fetchClassroomOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const response = await getClassroomPage({
      page: 1,
      size: 20,
      classroom_name: keyword,
    })
    return response.records.map((c) => ({
      label: `${c.classroom_name} (${c.building_name})`,
      value: c.classroom_uuid,
      classroom_name: c.classroom_name,
      building_name: c.building_name,
    }))
  } catch (err) {
    console.error('搜索教室失败:', err)
    return []
  }
}

// 搜索教师选项
const fetchTeacherOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const hasAlphaNumeric = /[a-zA-Z0-9]/.test(keyword)
    const response = await getTeacherPage({
      page: 1,
      size: 20,
      ...(keyword.trim() ? { [hasAlphaNumeric ? 'teacher_num' : 'teacher_name']: keyword } : {})
    })
    return response.records.map((t) => ({
      label: `${t.teacher_name} (${t.teacher_num})`,
      value: t.teacher_uuid,
      teacher_name: t.teacher_name,
      teacher_num: t.teacher_num,
    }))
  } catch (err) {
    console.error('搜索教师失败:', err)
    return []
  }
}

// 预加载数据（仅用于编辑时查找 UUID）
const preloadDataForEdit = async () => {
  try {
    const [semesterRes, tcRes, classroomRes] = await Promise.all([
      getSemesterPage({ page: 1, size: 1000 }),
      getTeachingClassPage({ page: 1, size: 1000 }),
      getClassroomPage({ page: 1, size: 1000 }),
    ])
    semesters.value = semesterRes.records
    teachingClasses.value = tcRes.records
    classrooms.value = classroomRes.records
  } catch (err) {
    console.error('预加载数据失败:', err)
  }
}

// 获取排课列表
const fetchSchedules = async () => {
  loading.value = true
  try {
    const response = await getSchedulePage({
      page: currentPage.value,
      size: pageSize.value,
      semester_uuid: filterSemester.value || undefined,
      teaching_class_uuid: filterTeachingClass.value || undefined,
      classroom_uuid: filterClassroom.value || undefined,
      teacher_uuid: filterTeacher.value || undefined,
      day_of_week: filterDayOfWeek.value,
      status: filterStatus.value,
    })
    schedules.value = response.records
    total.value = response.total
  } catch (err) {
    console.error('获取排课列表失败:', err)
    error('获取排课列表失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 监听筛选条件变化
watch(
  [
    filterSemester,
    filterTeachingClass,
    filterClassroom,
    filterTeacher,
    filterDayOfWeek,
    filterStatus,
  ],
  () => {
    currentPage.value = 1
    fetchSchedules()
  }
)

// 解析周次输入
const parseWeeksInput = (input: string): number[] => {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .map((s) => {
      const num = parseInt(s, 10)
      if (isNaN(num) || num < 1) {
        throw new Error('Invalid week number')
      }
      return num
    })
}

// 显示周次
const displayWeeks = (weeksJson: string): string => {
  try {
    const weeks = JSON.parse(weeksJson)
    if (Array.isArray(weeks) && weeks.length > 0) {
      return weeks.join(',')
    }
    return '-'
  } catch {
    return '-'
  }
}

// 显示星期
const displayDayOfWeek = (day: number): string => {
  const option = dayOfWeekOptions.find((o) => o.value === day)
  return option?.label || '-'
}

// 显示状态
const displayStatus = (status: number): string => {
  return status === 0 ? '预览' : '正式'
}

// 状态徽章类
const statusBadgeClass = (status: number): string => {
  return status === 0 ? 'status-preview' : 'status-official'
}

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  formData.value = {
    semester_uuid: '',
    teaching_class_uuid: '',
    classroom_uuid: '',
    day_of_week: 1,
    section_start: 1,
    section_end: 2,
    weeks_json: '[]',
    is_locked: false,
    status: 0,
  }
  weeksInput.value = ''
  initialSemesterOption.value = null
  initialTeachingClassOption.value = null
  initialClassroomOption.value = null
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = async (schedule: ScheduleInfoDTO) => {
  if (schedule.is_locked) {
    error('该排课记录已锁定，无法编辑')
    return
  }

  dialogMode.value = 'edit'

  // 确保预加载数据已加载
  if (
    semesters.value.length === 0 ||
    teachingClasses.value.length === 0 ||
    classrooms.value.length === 0
  ) {
    await preloadDataForEdit()
  }

  // 查找对应的选项
  const semester = semesters.value.find(
    (s) => s.semester_name === schedule.semester_name
  )
  const teachingClass = teachingClasses.value.find(
    (tc) => tc.teaching_class_name === schedule.teaching_class_name
  )
  const classroom = classrooms.value.find(
    (c) => c.classroom_name === schedule.classroom_name
  )

  // 设置表单数据
  formData.value = {
    schedule_uuid: schedule.schedule_uuid,
    semester_uuid: semester?.semester_uuid || '',
    teaching_class_uuid: teachingClass?.teaching_class_uuid || '',
    classroom_uuid: classroom?.classroom_uuid || '',
    day_of_week: schedule.day_of_week,
    section_start: schedule.section_start,
    section_end: schedule.section_end,
    weeks_json: schedule.weeks_json,
    is_locked: schedule.is_locked,
    status: schedule.status,
  }

  // 解析周次用于显示
  weeksInput.value = displayWeeks(schedule.weeks_json)

  // 设置初始选项
  if (semester) {
    initialSemesterOption.value = {
      label: semester.semester_name,
      value: semester.semester_uuid,
    }
  }
  if (teachingClass) {
    initialTeachingClassOption.value = {
      label: `${teachingClass.teaching_class_name} - ${teachingClass.course_name} - ${teachingClass.teacher_name}`,
      value: teachingClass.teaching_class_uuid,
    }
  }
  if (classroom) {
    initialClassroomOption.value = {
      label: `${classroom.classroom_name} (${classroom.building_name})`,
      value: classroom.classroom_uuid,
    }
  }

  showDialog.value = true
}

// 保存排课
const saveSchedule = async () => {
  // 表单验证
  if (!formData.value.semester_uuid) {
    error('请选择学期')
    return
  }
  if (!formData.value.teaching_class_uuid) {
    error('请选择教学班')
    return
  }
  if (!formData.value.classroom_uuid) {
    error('请选择教室')
    return
  }
  if (formData.value.section_start > formData.value.section_end) {
    error('起始节次不能大于结束节次')
    return
  }
  if (!weeksInput.value.trim()) {
    error('请输入上课周次')
    return
  }

  // 验证并转换周次
  try {
    const weeks = parseWeeksInput(weeksInput.value)
    formData.value.weeks_json = JSON.stringify(weeks)
  } catch (err) {
    error('周次格式错误，请输入如：1,2,3,4,5')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      await addSchedule(formData.value)
      success('添加成功')
    } else {
      await updateSchedule(formData.value)
      success('更新成功')
    }
    showDialog.value = false
    await fetchSchedules()
  } catch (err) {
    console.error('保存失败:', err)
    error('保存失败: ' + (err as Error).message)
  }
}

// 删除排课
const deleteSchedule = async (schedule: ScheduleInfoDTO) => {
  if (schedule.is_locked) {
    error('该排课记录已锁定，无法删除')
    return
  }
  if (!confirm(`确定要删除该排课记录吗？\n${schedule.teaching_class_name} - ${schedule.course_name}`)) {
    return
  }

  try {
    await deleteScheduleApi(schedule.schedule_uuid)
    success('删除成功')
    await fetchSchedules()
  } catch (err) {
    console.error('删除失败:', err)
    error('删除失败: ' + (err as Error).message)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 初始化加载
fetchSchedules()
</script>

<template>
  <div class="schedule-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">📅</span>
          <span class="logo-text">排课管理</span>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="filter-group">
          <div class="filter-item">
            <SearchSelect
              v-model="filterSemester"
              placeholder="搜索学期..."
              :fetch-async="fetchSemesterOptions"
              load-on-focus
              class="filter-select-custom"
            />
          </div>

          <div class="filter-item">
            <SearchSelect
              v-model="filterTeachingClass"
              placeholder="搜索教学班..."
              :fetch-async="fetchTeachingClassOptions"
              load-on-focus
              class="filter-select-custom"
            />
          </div>

          <div class="filter-item">
            <SearchSelect
              v-model="filterClassroom"
              placeholder="搜索教室..."
              :fetch-async="fetchClassroomOptions"
              load-on-focus
              class="filter-select-custom"
            />
          </div>

          <div class="filter-item">
            <SearchSelect
              v-model="filterTeacher"
              placeholder="搜索教师..."
              :fetch-async="fetchTeacherOptions"
              load-on-focus
              class="filter-select-custom"
            />
          </div>

          <div class="filter-item">
            <select v-model="filterDayOfWeek" class="filter-select">
              <option :value="undefined">全部星期</option>
              <option v-for="opt in dayOfWeekOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="filter-item">
            <select v-model="filterStatus" class="filter-select">
              <option :value="undefined">全部状态</option>
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <button v-if="canManage" class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加排课
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="schedules.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无排课数据</h3>
        <p v-if="canManage">点击"添加排课"按钮添加第一条排课记录</p>
      </div>

      <!-- 数据表格 -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>学期</th>
              <th>教学班</th>
              <th>课程</th>
              <th>教师</th>
              <th>教室</th>
              <th>星期</th>
              <th>节次</th>
              <th>周次</th>
              <th>学时</th>
              <th>状态</th>
              <th>锁定</th>
              <th v-if="canManage">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="schedule in schedules" :key="schedule.schedule_uuid">
              <td>{{ schedule.semester_name }}</td>
              <td>{{ schedule.teaching_class_name }}</td>
              <td>{{ schedule.course_name }}</td>
              <td>{{ schedule.teacher_name }}</td>
              <td>{{ schedule.classroom_name }}</td>
              <td>{{ displayDayOfWeek(schedule.day_of_week) }}</td>
              <td>{{ schedule.section_start }}-{{ schedule.section_end }}节</td>
              <td>{{ displayWeeks(schedule.weeks_json) }}</td>
              <td>{{ schedule.credit_hours ?? '-' }}</td>
              <td>
                <span :class="['status-badge', statusBadgeClass(schedule.status)]">
                  {{ displayStatus(schedule.status) }}
                </span>
              </td>
              <td>
                <span v-if="schedule.is_locked" class="lock-badge">🔒 已锁定</span>
                <span v-else class="unlock-badge">🔓 未锁定</span>
              </td>
              <td v-if="canManage">
                <div class="action-buttons">
                  <button
                    class="btn-edit"
                    :disabled="schedule.is_locked"
                    @click="openEditDialog(schedule)"
                  >
                    编辑
                  </button>
                  <button
                    class="btn-delete"
                    :disabled="schedule.is_locked"
                    @click="deleteSchedule(schedule)"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="showDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '添加排课' : '编辑排课' }}</h3>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>学期 *</label>
            <SearchSelect
              v-model="formData.semester_uuid"
              placeholder="搜索学期..."
              :fetch-async="fetchSemesterOptions"
              :initial-option="initialSemesterOption"
              load-on-focus
            />
          </div>

          <div class="form-group">
            <label>教学班 *</label>
            <SearchSelect
              v-model="formData.teaching_class_uuid"
              placeholder="搜索教学班..."
              :fetch-async="fetchTeachingClassOptions"
              :initial-option="initialTeachingClassOption"
              load-on-focus
            />
          </div>

          <div class="form-group">
            <label>教室 *</label>
            <SearchSelect
              v-model="formData.classroom_uuid"
              placeholder="搜索教室..."
              :fetch-async="fetchClassroomOptions"
              :initial-option="initialClassroomOption"
              load-on-focus
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>星期 *</label>
              <select v-model.number="formData.day_of_week" class="form-select">
                <option v-for="opt in dayOfWeekOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>起始节次 *</label>
              <input
                v-model.number="formData.section_start"
                type="number"
                class="form-input"
                min="1"
                max="20"
              />
            </div>

            <div class="form-group">
              <label>结束节次 *</label>
              <input
                v-model.number="formData.section_end"
                type="number"
                class="form-input"
                min="1"
                max="20"
              />
            </div>
          </div>

          <div class="form-group">
            <label>上课周次 *</label>
            <input
              v-model="weeksInput"
              type="text"
              class="form-input"
              placeholder="例如：1,2,3,4,5"
            />
            <small class="form-hint">请输入上课周次，用逗号分隔，例如：1,2,3,4,5</small>
          </div>

          <div class="form-group">
            <label>状态 *</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" :value="0" v-model.number="formData.status" />
                <span>预览</span>
              </label>
              <label class="radio-label">
                <input type="radio" :value="1" v-model.number="formData.status" />
                <span>正式</span>
              </label>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveSchedule">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-management {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
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
  padding: 1rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.navbar-logo:hover {
  transform: translateX(-5px);
}

.back-icon {
  font-size: 1.5rem;
  color: #00d4ff;
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

/* 主要内容区域 */
.main-content {
  padding: 2rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  flex-wrap: wrap;
}

.filter-item {
  min-width: 180px;
  flex: 1;
}

.filter-select-custom {
  width: 100%;
}

.filter-select {
  width: 100%;
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

.filter-select:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.filter-select option {
  background: #1a1a2e;
  color: #ffffff;
}

/* 按钮样式 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #a0aec0;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00d4ff;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

/* 表格容器 */
.table-container {
  background: rgba(30, 30, 50, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
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
  font-size: 0.95rem;
  white-space: nowrap;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
}

.data-table tbody tr {
  transition: all 0.3s ease;
}

.data-table tbody tr:hover {
  background: rgba(0, 212, 255, 0.05);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* 状态徽章 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-preview {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.status-official {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

/* 锁定标记 */
.lock-badge {
  color: #f44336;
  font-size: 0.85rem;
}

.unlock-badge {
  color: #4caf50;
  font-size: 0.85rem;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-edit {
  padding: 0.4rem 0.8rem;
  background: rgba(33, 150, 243, 0.2);
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 6px;
  color: #2196f3;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit:hover:not(:disabled) {
  background: rgba(33, 150, 243, 0.3);
  transform: translateY(-1px);
}

.btn-edit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-delete {
  padding: 0.4rem 0.8rem;
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 6px;
  color: #f44336;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-delete:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.3);
  transform: translateY(-1px);
}

.btn-delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 对话框 */
.dialog-overlay {
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(40, 40, 70, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-close {
  background: transparent;
  border: none;
  color: #a0aec0;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-close:hover {
  color: #ffffff;
  transform: rotate(90deg);
}

.dialog-body {
  padding: 1.5rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 表单样式 */
.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-hint {
  display: block;
  color: #a0aec0;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.form-input:disabled,
.form-select:disabled {
  background: rgba(30, 30, 50, 0.4);
  color: #a0aec0;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #a0aec0;
}

.form-select option {
  background: #1a1a2e;
  color: #ffffff;
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  gap: 1.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e0e0e0;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #00d4ff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .navbar-content,
  .main-content {
    padding: 1rem 2rem;
  }

  .form-row {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .navbar-content,
  .main-content {
    padding: 1rem 1.5rem;
  }

  .logo-text {
    font-size: 1rem;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
  }

  .filter-item {
    min-width: 100%;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .action-buttons {
    flex-direction: column;
  }

  .dialog {
    width: 95%;
    margin: 1rem;
  }

  .data-table {
    font-size: 0.85rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>
