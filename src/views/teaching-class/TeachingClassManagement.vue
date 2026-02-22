<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getTeachingClassPage, addTeachingClass, updateTeachingClass, deleteTeachingClass as deleteTeachingClassApi } from '@/api/teachingClass'
import { getCoursePage } from '@/api/course'
import { getTeacherPage } from '@/api/teacher'
import { getSemesterPage } from '@/api/semester'
import type { TeachingClassInfoDTO, AddTeachingClassVO } from '@/api/types'
import type { CourseInfoDTO } from '@/api/types'
import type { TeacherInfoDTO } from '@/api/types'
import type { SemesterInfoDTO } from '@/api/types'
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

// 权限控制：只有 SYSTEM_ADMIN 和 ACADEMIC_ADMIN 可以管理教学班
const canManageTeachingClass = computed(() => {
  const userType = userStore.userType
  return userType === 'SYSTEM_ADMIN' || userType === 'ACADEMIC_ADMIN'
})

// 响应式数据
const teachingClasses = ref<TeachingClassInfoDTO[]>([])
// 保留用于编辑时查找 UUID 的数据
const courses = ref<CourseInfoDTO[]>([])
const teachers = ref<TeacherInfoDTO[]>([])
const semesters = ref<SemesterInfoDTO[]>([])
const loading = ref(false)

// 筛选条件
const filterCourse = ref<string>('')
const filterTeacher = ref<string>('')
const filterSemester = ref<string>('')

// 对话框相关
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

// 分页数据
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

// 当前编辑的教学班
const formData = ref<AddTeachingClassVO>({
  teaching_class_uuid: '',
  course_uuid: '',
  teacher_uuid: '',
  semester_uuid: '',
  teaching_class_name: '',
})

// 编辑时的初始选项（用于 SearchSelect 回显）
const initialCourseOption = ref<SelectOption | null>(null)
const initialTeacherOption = ref<SelectOption | null>(null)
const initialSemesterOption = ref<SelectOption | null>(null)

// 搜索课程选项
const fetchCourseOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const hasAlphaNumeric = /[a-zA-Z0-9]/.test(keyword)
    const response = await getCoursePage({
      page: 1,
      size: 20,
      ...(keyword.trim() ? { [hasAlphaNumeric ? 'course_num' : 'course_name']: keyword } : {})
    })

    return response.records.map(course => ({
      label: `${course.course_name} (${course.course_num})`,
      value: course.course_uuid,
      course_num: course.course_num,
      course_name: course.course_name
    }))
  } catch (err) {
    console.error('搜索课程失败:', err)
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

    return response.records.map(teacher => ({
      label: `${teacher.teacher_name} (${teacher.teacher_num})`,
      value: teacher.teacher_uuid,
      teacher_num: teacher.teacher_num,
      teacher_name: teacher.teacher_name
    }))
  } catch (err) {
    console.error('搜索教师失败:', err)
    return []
  }
}

// 搜索学期选项
const fetchSemesterOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const response = await getSemesterPage({
      page: 1,
      size: 20,
      ...(keyword.trim() ? { semester_name: keyword } : {})
    })

    return response.records.map(semester => ({
      label: semester.semester_name,
      value: semester.semester_uuid,
      semester_name: semester.semester_name
    }))
  } catch (err) {
    console.error('搜索学期失败:', err)
    return []
  }
}

// 预加载数据（仅用于编辑时查找 UUID）
const preloadDataForEdit = async () => {
  try {
    const [courseRes, teacherRes, semesterRes] = await Promise.all([
      getCoursePage({ page: 1, size: 1000 }),
      getTeacherPage({ page: 1, size: 1000 }),
      getSemesterPage({ page: 1, size: 1000 })
    ])
    courses.value = courseRes.records
    teachers.value = teacherRes.records
    semesters.value = semesterRes.records
  } catch (err) {
    console.error('预加载数据失败:', err)
  }
}

// 获取教学班列表
const fetchTeachingClasses = async (params?: {
  course_uuid?: string
  teacher_uuid?: string
  semester_uuid?: string
}) => {
  loading.value = true
  try {
    const response = await getTeachingClassPage({
      page: currentPage.value,
      size: pageSize.value,
      ...params,
    })
    teachingClasses.value = response.records
    total.value = response.total
  } catch (err) {
    console.error('获取教学班列表失败:', err)
    error('获取教学班列表失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 监听课程筛选
watch(filterCourse, (newCourseUuid) => {
  fetchTeachingClasses({
    course_uuid: newCourseUuid || undefined,
    teacher_uuid: filterTeacher.value || undefined,
    semester_uuid: filterSemester.value || undefined,
  })
})

// 监听教师筛选
watch(filterTeacher, (newTeacherUuid) => {
  fetchTeachingClasses({
    course_uuid: filterCourse.value || undefined,
    teacher_uuid: newTeacherUuid || undefined,
    semester_uuid: filterSemester.value || undefined,
  })
})

// 监听学期筛选
watch(filterSemester, (newSemesterUuid) => {
  fetchTeachingClasses({
    course_uuid: filterCourse.value || undefined,
    teacher_uuid: filterTeacher.value || undefined,
    semester_uuid: newSemesterUuid || undefined,
  })
})

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  formData.value = {
    course_uuid: '',
    teacher_uuid: '',
    semester_uuid: '',
    teaching_class_name: '',
  }
  // 清空初始选项
  initialCourseOption.value = null
  initialTeacherOption.value = null
  initialSemesterOption.value = null
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = async (teachingClass: TeachingClassInfoDTO) => {
  dialogMode.value = 'edit'

  // 确保预加载数据已加载
  if (courses.value.length === 0 || teachers.value.length === 0 || semesters.value.length === 0) {
    await preloadDataForEdit()
  }

  // 根据 course_name 查找 courseUuid
  const course = courses.value.find(c => c.course_name === teachingClass.course_name)
  // 根据 teacher_name 查找 teacherUuid
  const teacher = teachers.value.find(t => t.teacher_name === teachingClass.teacher_name)
  // 根据 semester_name 查找 semesterUuid
  const semester = semesters.value.find(s => s.semester_name === teachingClass.semester_name)

  // 设置表单数据
  formData.value = {
    teaching_class_uuid: teachingClass.teaching_class_uuid,
    course_uuid: course?.course_uuid || '',
    teacher_uuid: teacher?.teacher_uuid || '',
    semester_uuid: semester?.semester_uuid || '',
    teaching_class_name: teachingClass.teaching_class_name,
  }

  // 设置初始选项（用于 SearchSelect 回显）
  if (course) {
    initialCourseOption.value = {
      label: `${course.course_name} (${course.course_num})`,
      value: course.course_uuid,
    }
  }
  if (teacher) {
    initialTeacherOption.value = {
      label: `${teacher.teacher_name} (${teacher.teacher_num})`,
      value: teacher.teacher_uuid,
    }
  }
  if (semester) {
    initialSemesterOption.value = {
      label: semester.semester_name,
      value: semester.semester_uuid,
    }
  }

  showDialog.value = true
}

// 保存教学班
const saveTeachingClass = async () => {
  // 表单验证
  if (!formData.value.teaching_class_name.trim()) {
    error('请输入教学班名称')
    return
  }
  if (!formData.value.course_uuid) {
    error('请选择课程')
    return
  }
  if (!formData.value.teacher_uuid) {
    error('请选择教师')
    return
  }
  if (!formData.value.semester_uuid) {
    error('请选择学期')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      await addTeachingClass(formData.value)
      success('添加教学班成功')
    } else {
      await updateTeachingClass(formData.value)
      success('更新教学班成功')
    }
    showDialog.value = false
    await fetchTeachingClasses({
      course_uuid: filterCourse.value || undefined,
      teacher_uuid: filterTeacher.value || undefined,
      semester_uuid: filterSemester.value || undefined,
    })
  } catch (err) {
    console.error('保存教学班失败:', err)
    error('保存教学班失败: ' + (err as Error).message)
  }
}

// 删除教学班
const deleteTeachingClass = async (teachingClassUuid: string, teachingClassName: string) => {
  if (!confirm(`确定要删除教学班"${teachingClassName}"吗？`)) return

  try {
    await deleteTeachingClassApi(teachingClassUuid)
    success('删除教学班成功')
    await fetchTeachingClasses({
      course_uuid: filterCourse.value || undefined,
      teacher_uuid: filterTeacher.value || undefined,
      semester_uuid: filterSemester.value || undefined,
    })
  } catch (err) {
    console.error('删除教学班失败:', err)
    error('删除教学班失败: ' + (err as Error).message)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 初始化加载
loading.value = true
getTeachingClassPage({
  page: currentPage.value,
  size: pageSize.value,
}).then(response => {
  teachingClasses.value = response.records
  total.value = response.total
}).catch(err => {
  console.error('获取教学班列表失败:', err)
  error('获取教学班列表失败: ' + (err as Error).message)
}).finally(() => {
  loading.value = false
})
</script>

<template>
  <div class="teaching-class-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">📚</span>
          <span class="logo-text">教学班管理</span>
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
              v-model="filterCourse"
              placeholder="搜索课程..."
              :fetch-async="fetchCourseOptions"
              :load-on-focus="true"
              class="filter-select-custom"
            />
          </div>

          <div class="filter-item">
            <SearchSelect
              v-model="filterTeacher"
              placeholder="搜索教师..."
              :fetch-async="fetchTeacherOptions"
              :load-on-focus="true"
              class="filter-select-custom"
            />
          </div>

          <div class="filter-item">
            <SearchSelect
              v-model="filterSemester"
              placeholder="搜索学期..."
              :fetch-async="fetchSemesterOptions"
              :load-on-focus="true"
              class="filter-select-custom"
            />
          </div>
        </div>

        <button v-if="canManageTeachingClass" class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加教学班
        </button>
      </div>

      <!-- 教学班列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="teachingClasses.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无教学班数据</h3>
        <p v-if="canManageTeachingClass">点击"添加教学班"按钮添加第一个教学班</p>
      </div>

      <!-- 数据表格 -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>教学班名称</th>
              <th>课程</th>
              <th>教师</th>
              <th>学期</th>
              <th>总学时</th>
              <th v-if="canManageTeachingClass">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tc in teachingClasses" :key="tc.teaching_class_uuid">
              <td>{{ tc.teaching_class_name }}</td>
              <td>{{ tc.course_name }}</td>
              <td>{{ tc.teacher_name }}</td>
              <td>{{ tc.semester_name }}</td>
              <td>{{ tc.teaching_class_hours ?? '-' }}</td>
              <td v-if="canManageTeachingClass">
                <div class="action-buttons">
                  <button class="btn-edit" @click="openEditDialog(tc)">编辑</button>
                  <button class="btn-delete" @click="deleteTeachingClass(tc.teaching_class_uuid, tc.teaching_class_name)">
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
          <h3>{{ dialogMode === 'add' ? '添加教学班' : '编辑教学班' }}</h3>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>教学班名称 *</label>
            <input
              v-model="formData.teaching_class_name"
              type="text"
              class="form-input"
              placeholder="例如：高等数学-张老师-2024级1班"
            />
            <small class="form-hint">建议格式：课程名-教师名-班级组合</small>
          </div>

          <div class="form-group">
            <label>课程 *</label>
            <SearchSelect
              v-model="formData.course_uuid"
              placeholder="搜索课程..."
              :fetch-async="fetchCourseOptions"
              :initial-option="initialCourseOption"
              :load-on-focus="true"
            />
          </div>

          <div class="form-group">
            <label>教师 *</label>
            <SearchSelect
              v-model="formData.teacher_uuid"
              placeholder="搜索教师..."
              :fetch-async="fetchTeacherOptions"
              :initial-option="initialTeacherOption"
              :load-on-focus="true"
            />
          </div>

          <div class="form-group">
            <label>学期 *</label>
            <SearchSelect
              v-model="formData.semester_uuid"
              placeholder="搜索学期..."
              :fetch-async="fetchSemesterOptions"
              :initial-option="initialSemesterOption"
              :load-on-focus="true"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveTeachingClass">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.teaching-class-management {
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
}

/* 筛选项容器 */
.filter-item {
  min-width: 200px;
  flex: 1;
}

.filter-select-custom {
  width: 100%;
}

/* 筛选下拉框 */
.filter-select {
  flex: 1;
  min-width: 200px;
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

.filter-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
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
  overflow: hidden;
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
  font-size: 0.95rem;
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

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.3);
  transform: translateY(-1px);
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

.btn-delete:hover {
  background: rgba(244, 67, 54, 0.3);
  transform: translateY(-1px);
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
  max-width: 500px;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .navbar-content,
  .main-content {
    padding: 1rem 2rem;
  }

  .action-bar {
    flex-wrap: wrap;
  }

  .filter-group {
    flex-wrap: wrap;
  }

  .filter-select {
    min-width: 180px;
  }

  .table-container {
    overflow-x: auto;
  }

  .data-table {
    min-width: 600px;
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

  .filter-select {
    width: 100%;
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
}
</style>
