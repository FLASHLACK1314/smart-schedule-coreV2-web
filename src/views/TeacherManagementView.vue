<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getTeacherPage, addTeacher, updateTeacher, deleteTeacher as deleteTeacherApi } from '@/api/teacher'
import { getDepartmentPage } from '@/api/department'
import type { TeacherInfoDTO, AddTeacherVO } from '@/api/types'
import { useMessage } from '@/composables/useMessage'
import { formatLikeTime, parseLikeTime, serializeLikeTime, toggleTimeSlot, isTimeSlotSelected, WEEKDAY_MAP } from '@/utils/timePreference'

const router = useRouter()
const { success, error } = useMessage()

// 响应式数据
const teachers = ref<TeacherInfoDTO[]>([])
const departments = ref<{ department_uuid: string; department_name: string }[]>([])
const loading = ref(false)
const departmentsLoading = ref(false)
const searchKeyword = ref('')
const selectedDepartment = ref<string>('')
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

// 分页数据
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

// 当前编辑的教师
const currentTeacher = ref<AddTeacherVO>({
  teacher_uuid: '',
  teacher_num: '',
  teacher_name: '',
  title: '',
  department_uuid: '',
  teacher_password: '',
  max_hours_per_week: 20,
  like_time: '',
  is_active: true,
})

// 时间选择器相关状态
const showTimePicker = ref(false)
const tempTimeSelection = ref<Map<number, number[]>>(new Map())
const periods = Array.from({ length: 12 }, (_, i) => i + 1)
const weekdays = Array.from({ length: 7 }, (_, i) => i + 1)

// 获取学院列表（用于下拉选择）
const fetchDepartments = async () => {
  departmentsLoading.value = true
  try {
    const response = await getDepartmentPage({
      page: 1,
      size: 1000,
    })
    departments.value = response.records
  } catch (err) {
    console.error('获取学院列表失败:', err)
    error('获取学院列表失败: ' + (err as Error).message)
  } finally {
    departmentsLoading.value = false
  }
}

// 获取教师列表
const fetchTeachers = async (params?: { teacher_name?: string; teacher_num?: string; department_uuid?: string }) => {
  loading.value = true
  try {
    const response = await getTeacherPage({
      page: currentPage.value,
      size: pageSize.value,
      ...params,
    })
    teachers.value = response.records
    total.value = response.total
  } catch (err) {
    console.error('获取教师列表失败:', err)
    error('获取教师列表失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 计算属性：显示的教师列表
const displayTeachers = computed(() => teachers.value)

// 搜索防抖
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchKeyword, (newKeyword) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    if (newKeyword) {
      // 智能判断：数字字母优先按工号搜索，中文按姓名搜索
      const hasAlphaNumeric = /[a-zA-Z0-9]/.test(newKeyword)

      fetchTeachers(
        hasAlphaNumeric
          ? { teacher_num: newKeyword, department_uuid: selectedDepartment.value || undefined }
          : { teacher_name: newKeyword, department_uuid: selectedDepartment.value || undefined }
      )
    } else {
      // 清空搜索时重新加载全部数据
      fetchTeachers({ department_uuid: selectedDepartment.value || undefined })
    }
  }, 500)
})

// 监听学院筛选
watch(selectedDepartment, (newDeptUuid) => {
  fetchTeachers({
    teacher_name: searchKeyword.value || undefined,
    department_uuid: newDeptUuid || undefined,
  })
})

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  currentTeacher.value = {
    teacher_uuid: '',
    teacher_num: '',
    teacher_name: '',
    title: '',
    department_uuid: '',
    teacher_password: '',
    max_hours_per_week: 20,
    like_time: '',
    is_active: true,
  }
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (teacher: TeacherInfoDTO) => {
  dialogMode.value = 'edit'
  currentTeacher.value = {
    teacher_uuid: teacher.teacher_uuid,
    teacher_num: teacher.teacher_num,
    teacher_name: teacher.teacher_name,
    title: teacher.title,
    department_uuid: teacher.department_info.department_uuid,
    teacher_password: '',
    max_hours_per_week: teacher.max_hours_per_week,
    like_time: teacher.like_time,
    is_active: teacher.is_active,
  }
  showDialog.value = true
}

// 保存教师
const saveTeacher = async () => {
  // 表单验证
  if (!currentTeacher.value.teacher_num.trim()) {
    error('请输入教师工号')
    return
  }
  if (!currentTeacher.value.teacher_name.trim()) {
    error('请输入教师姓名')
    return
  }
  if (!currentTeacher.value.title.trim()) {
    error('请选择职称')
    return
  }
  if (!currentTeacher.value.department_uuid) {
    error('请选择所属学院')
    return
  }
  if (dialogMode.value === 'add' && !currentTeacher.value.teacher_password?.trim()) {
    error('请输入密码')
    return
  }
  if (currentTeacher.value.max_hours_per_week < 0 || currentTeacher.value.max_hours_per_week > 40) {
    error('每周课时应在 0-40 之间')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      await addTeacher(currentTeacher.value)
      success('添加教师成功')
    } else {
      await updateTeacher(currentTeacher.value)
      success('更新教师成功')
    }
    showDialog.value = false
    await fetchTeachers()
  } catch (err) {
    console.error('保存教师失败:', err)
    error('保存教师失败: ' + (err as Error).message)
  }
}

// 删除教师
const deleteTeacher = async (teacher_uuid: string, teacher_name: string) => {
  if (!confirm(`确定要删除教师"${teacher_name}"吗？`)) return

  try {
    await deleteTeacherApi(teacher_uuid)
    success('删除教师成功')
    await fetchTeachers()
  } catch (err) {
    console.error('删除教师失败:', err)
    error('删除教师失败: ' + (err as Error).message)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 格式化状态显示
const formatStatus = (isActive: boolean) => {
  return isActive ? '在职' : '离职'
}

// 格式化状态样式
const getStatusClass = (isActive: boolean) => {
  return isActive ? 'status-active' : 'status-inactive'
}

// 时间选择器相关函数
const openTimePicker = () => {
  tempTimeSelection.value = parseLikeTime(currentTeacher.value.like_time)
  showTimePicker.value = true
}

const handleToggleTimeSlot = (day: number, period: number) => {
  tempTimeSelection.value = toggleTimeSlot(tempTimeSelection.value, day, period)
}

const confirmTimeSelection = () => {
  currentTeacher.value.like_time = serializeLikeTime(tempTimeSelection.value)
  showTimePicker.value = false
}

const cancelTimeSelection = () => {
  showTimePicker.value = false
  tempTimeSelection.value = new Map()
}

const clearTimeSelection = () => {
  tempTimeSelection.value = new Map()
}

// 计算当前选择的时间描述
const currentTimeDescription = computed(() => {
  return formatLikeTime(serializeLikeTime(tempTimeSelection.value))
})

// 页面加载时获取数据
onMounted(() => {
  fetchDepartments()
  fetchTeachers()
})
</script>

<template>
  <div class="teacher-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">👨‍🏫</span>
          <span class="logo-text">教师管理</span>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索教师姓名或工号..."
            class="search-input"
          />
        </div>

        <select v-model="selectedDepartment" class="department-select">
          <option value="">全部学院</option>
          <option v-for="dept in departments" :key="dept.department_uuid" :value="dept.department_uuid">
            {{ dept.department_name }}
          </option>
        </select>

        <button class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加教师
        </button>
      </div>

      <!-- 教师列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="displayTeachers.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无教师数据</h3>
        <p>点击"添加教师"按钮添加第一位教师</p>
      </div>

      <div v-else class="teacher-grid">
        <div v-for="teacher in displayTeachers" :key="teacher.teacher_uuid" class="teacher-card">
          <div class="card-header">
            <div class="teacher-avatar">
              {{ teacher.teacher_name.charAt(0) }}
            </div>
            <div class="teacher-info">
              <h3 class="teacher-name">{{ teacher.teacher_name }}</h3>
              <p class="teacher-title">{{ teacher.title }}</p>
            </div>
            <div :class="['status-badge', getStatusClass(teacher.is_active)]">
              {{ formatStatus(teacher.is_active) }}
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="info-label">工号</span>
              <span class="info-value">{{ teacher.teacher_num }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">所属学院</span>
              <span class="info-value">{{ teacher.department_info.department_name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">周课时</span>
              <span class="info-value">{{ teacher.max_hours_per_week }} 课时</span>
            </div>
            <div class="info-row">
              <span class="info-label">偏好时间</span>
              <span class="info-value">{{ formatLikeTime(teacher.like_time) }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-edit" @click="openEditDialog(teacher)">
              <span class="btn-icon">✏️</span>
              编辑
            </button>
            <button class="btn-delete" @click="deleteTeacher(teacher.teacher_uuid, teacher.teacher_name)">
              <span class="btn-icon">🗑️</span>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="showDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h2>{{ dialogMode === 'add' ? '添加教师' : '编辑教师' }}</h2>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">工号 *</label>
            <input
              v-model="currentTeacher.teacher_num"
              type="text"
              class="form-input"
              placeholder="请输入工号"
              :disabled="dialogMode === 'edit'"
            />
            <small v-if="dialogMode === 'edit'" class="form-hint">工号不可修改</small>
          </div>

          <div class="form-group">
            <label class="form-label">姓名 *</label>
            <input v-model="currentTeacher.teacher_name" type="text" class="form-input" placeholder="请输入姓名" />
          </div>

          <div class="form-group">
            <label class="form-label">职称 *</label>
            <select v-model="currentTeacher.title" class="form-input">
              <option value="">请选择职称</option>
              <option value="教授">教授</option>
              <option value="副教授">副教授</option>
              <option value="讲师">讲师</option>
              <option value="助教">助教</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">所属学院 *</label>
            <select v-model="currentTeacher.department_uuid" class="form-input">
              <option value="">请选择学院</option>
              <option v-for="dept in departments" :key="dept.department_uuid" :value="dept.department_uuid">
                {{ dept.department_name }}
              </option>
            </select>
          </div>

          <div v-if="dialogMode === 'add'" class="form-group">
            <label class="form-label">密码 *</label>
            <input v-model="currentTeacher.teacher_password" type="password" class="form-input" placeholder="请输入密码" />
          </div>

          <div class="form-group">
            <label class="form-label">每周最大课时 *</label>
            <input v-model.number="currentTeacher.max_hours_per_week" type="number" class="form-input" min="0" max="40" />
          </div>

          <div class="form-group">
            <label class="form-label">授课偏好时间</label>
            <div class="time-selector-trigger" @click="openTimePicker">
              <span class="time-display">{{ formatLikeTime(currentTeacher.like_time) }}</span>
              <span class="time-selector-arrow">▾</span>
            </div>
            <small class="form-hint">点击选择教师偏好的授课时间</small>
          </div>

          <div class="form-group">
            <label class="form-label">状态</label>
            <label class="checkbox-label">
              <input v-model="currentTeacher.is_active" type="checkbox" />
              <span>在职</span>
            </label>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveTeacher">保存</button>
        </div>
      </div>
    </div>

    <!-- 时间选择器对话框 -->
    <div v-if="showTimePicker" class="time-picker-overlay" @click.self="cancelTimeSelection">
      <div class="time-picker-dialog">
        <div class="time-picker-header">
          <h2>选择授课偏好时间</h2>
          <button class="dialog-close" @click="cancelTimeSelection">×</button>
        </div>

        <div class="time-picker-body">
          <!-- 操作提示 -->
          <div class="time-picker-hint">
            <span class="hint-icon">💡</span>
            <span>点击网格选择或取消时间段，可多选</span>
            <button class="btn-clear" @click="clearTimeSelection">清空全部</button>
          </div>

          <!-- 时间网格：7天×12节 -->
          <div class="time-grid">
            <!-- 表头：节次 -->
            <div class="grid-header">
              <div class="grid-corner"></div>
              <div v-for="period in periods" :key="period" class="grid-period-header">
                {{ period }}
              </div>
            </div>

            <!-- 表体：周几 -->
            <div v-for="day in weekdays" :key="day" class="grid-row">
              <div class="grid-day-header">
                {{ WEEKDAY_MAP[day] }}
              </div>
              <div
                v-for="period in periods"
                :key="`${day}-${period}`"
                :class="['grid-cell', {
                  'grid-cell-selected': isTimeSlotSelected(tempTimeSelection, day, period)
                }]"
                @click="handleToggleTimeSlot(day, period)"
              >
                {{ isTimeSlotSelected(tempTimeSelection, day, period) ? '✓' : '' }}
              </div>
            </div>
          </div>

          <!-- 预览当前选择 -->
          <div class="selection-preview">
            <span class="preview-label">已选择：</span>
            <span class="preview-value">{{ currentTimeDescription }}</span>
          </div>
        </div>

        <div class="time-picker-footer">
          <button class="btn-secondary" @click="cancelTimeSelection">取消</button>
          <button class="btn-primary" @click="confirmTimeSelection">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.teacher-management {
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
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(30, 30, 50, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1rem;
}

.search-icon {
  font-size: 1.2rem;
  margin-right: 0.75rem;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
}

.search-input::placeholder {
  color: rgba(160, 174, 192, 0.6);
}

.department-select {
  min-width: 200px;
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
}

.department-select:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.department-select option {
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
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-icon {
  font-size: 1rem;
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

/* 教师卡片网格 */
.teacher-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.teacher-card {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.teacher-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 212, 255, 0.15);
  border-color: rgba(0, 212, 255, 0.3);
}

.card-header {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.teacher-avatar {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.teacher-info {
  flex: 1;
}

.teacher-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.teacher-title {
  font-size: 0.95rem;
  color: #a0aec0;
}

.status-badge {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-active {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-inactive {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.card-body {
  padding: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #a0aec0;
}

.info-value {
  color: #ffffff;
  font-weight: 500;
  text-align: right;
}

.card-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.btn-edit,
.btn-delete {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.2);
  border-color: rgba(33, 150, 243, 0.5);
}

.btn-delete {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.btn-delete:hover {
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.5);
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
  padding: 2rem;
}

.dialog {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.dialog-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #ffffff;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-close:hover {
  background: rgba(244, 67, 54, 0.3);
  transform: rotate(90deg);
}

.dialog-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-hint {
  display: block;
  color: #a0aec0;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

.form-input:disabled {
  background: rgba(30, 30, 50, 0.4);
  color: #a0aec0;
  cursor: not-allowed;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffffff;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .navbar-content,
  .main-content {
    padding: 1rem 2rem;
  }

  .teacher-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .navbar-content,
  .main-content {
    padding: 1rem 1.5rem;
  }

  .action-bar {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .department-select {
    width: 100%;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .teacher-grid {
    grid-template-columns: 1fr;
  }

  .dialog {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding: 1.5rem;
  }
}

/* 时间选择器触发器 */
.time-selector-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.time-selector-trigger:hover {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.time-display {
  color: #ffffff;
  font-size: 1rem;
}

.time-selector-arrow {
  color: #a0aec0;
  font-size: 0.875rem;
  transition: transform 0.3s ease;
}

.time-selector-trigger:hover .time-selector-arrow {
  transform: rotate(180deg);
  color: #00d4ff;
}

/* 时间选择器对话框 */
.time-picker-overlay {
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
  z-index: 2000;
  padding: 2rem;
}

.time-picker-dialog {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.time-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.time-picker-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.time-picker-body {
  padding: 2rem;
}

.time-picker-hint {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.hint-icon {
  font-size: 1.25rem;
}

.time-picker-hint span:nth-child(2) {
  flex: 1;
  color: #a0aec0;
  font-size: 0.95rem;
}

.btn-clear {
  padding: 0.5rem 1rem;
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-clear:hover {
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.5);
}

/* 时间网格 */
.time-grid {
  display: grid;
  grid-template-columns: 80px repeat(12, 1fr);
  gap: 6px;
  margin-bottom: 1.5rem;
}

.grid-header {
  display: contents;
}

.grid-corner {
  grid-column: 1;
}

.grid-period-header {
  text-align: center;
  padding: 0.5rem;
  color: #a0aec0;
  font-size: 0.875rem;
  font-weight: 500;
}

.grid-row {
  display: contents;
}

.grid-day-header {
  grid-column: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
}

.grid-cell {
  aspect-ratio: 1;
  min-width: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: #a0aec0;
  user-select: none;
}

.grid-cell:hover {
  transform: scale(1.05);
  border-color: #00d4ff;
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
}

.grid-cell-selected {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-color: transparent;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.grid-cell-selected:hover {
  box-shadow: 0 6px 16px rgba(0, 212, 255, 0.5);
}

/* 选择预览 */
.selection-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.preview-label {
  color: #a0aec0;
  font-size: 0.95rem;
  font-weight: 500;
}

.preview-value {
  flex: 1;
  color: #00d4ff;
  font-size: 0.95rem;
  font-weight: 500;
}

.time-picker-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 时间选择器响应式 */
@media (max-width: 1200px) {
  .time-grid {
    gap: 4px;
  }

  .grid-cell {
    min-width: 32px;
    min-height: 32px;
    font-size: 0.8rem;
  }

  .grid-day-header,
  .grid-period-header {
    font-size: 0.75rem;
    padding: 0.4rem;
  }
}

@media (max-width: 768px) {
  .time-picker-dialog {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }

  .time-picker-header,
  .time-picker-body,
  .time-picker-footer {
    padding: 1.5rem;
  }

  .time-grid {
    overflow-x: auto;
    padding-bottom: 1rem;
  }

  .time-picker-hint {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .time-picker-hint span:nth-child(2) {
    width: 100%;
  }

  .btn-clear {
    width: 100%;
  }

  .selection-preview {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .time-picker-footer {
    flex-direction: column-reverse;
  }

  .time-picker-footer button {
    width: 100%;
  }
}

</style>
