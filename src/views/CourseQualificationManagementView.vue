<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { UserType } from '@/api/types'
import { getCourseQualificationPage, addCourseQualification, deleteCourseQualification } from '@/api/courseQualification'
import { getCoursePage } from '@/api/course'
import { getTeacherPage } from '@/api/teacher'
import type { CourseQualificationInfoDTO, AddCourseQualificationVO } from '@/api/types'
import { useMessage } from '@/composables/useMessage'
import SearchSelect from '@/components/SearchSelect.vue'

// 选项类型
interface SelectOption {
  label: string
  value: string
  [key: string]: any
}

const router = useRouter()
const userStore = useUserStore()
const { success, error } = useMessage()

// 权限控制
const isAdmin = computed(() => {
  return userStore.userType === UserType.SYSTEM_ADMIN ||
         userStore.userType === UserType.ACADEMIC_ADMIN
})

// 响应式数据
const qualifications = ref<CourseQualificationInfoDTO[]>([])
const loading = ref(false)
const selectedCourse = ref<string>('')
const selectedTeacher = ref<string>('')
const showDialog = ref(false)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

// 当前添加的资格
const currentQualification = ref<AddCourseQualificationVO>({
  course_uuid: '',
  teacher_uuid: '',
})

// 搜索课程选项
const fetchCourseOptions = async (keyword: string): Promise<SelectOption[]> => {
  if (!keyword.trim()) return []

  try {
    // 智能判断：数字字母按编号搜索，中文按名称搜索
    const hasAlphaNumeric = /[a-zA-Z0-9]/.test(keyword)
    const response = await getCoursePage({
      page: 1,
      size: 20,
      [hasAlphaNumeric ? 'course_num' : 'course_name']: keyword
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
  if (!keyword.trim()) return []

  try {
    // 智能判断：数字字母按工号搜索，中文按姓名搜索
    const hasAlphaNumeric = /[a-zA-Z0-9]/.test(keyword)
    const response = await getTeacherPage({
      page: 1,
      size: 20,
      [hasAlphaNumeric ? 'teacher_num' : 'teacher_name']: keyword
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

// 获取资格列表
const fetchQualifications = async () => {
  loading.value = true
  try {
    const response = await getCourseQualificationPage({
      page: currentPage.value,
      size: pageSize.value,
      course_uuid: selectedCourse.value || undefined,
      teacher_uuid: selectedTeacher.value || undefined,
    })
    qualifications.value = response.records
    total.value = response.total
  } catch (err) {
    console.error('获取资格列表失败:', err)
    error('获取资格列表失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 监听课程筛选
watch(selectedCourse, () => {
  currentPage.value = 1
  fetchQualifications()
})

// 监听教师筛选
watch(selectedTeacher, () => {
  currentPage.value = 1
  fetchQualifications()
})

// 打开添加对话框
const openAddDialog = () => {
  currentQualification.value = {
    course_uuid: '',
    teacher_uuid: '',
  }
  showDialog.value = true
}

// 保存资格
const saveQualification = async () => {
  if (!currentQualification.value.course_uuid) {
    error('请选择课程')
    return
  }
  if (!currentQualification.value.teacher_uuid) {
    error('请选择教师')
    return
  }

  try {
    await addCourseQualification(currentQualification.value)
    success('添加授课资格成功')
    showDialog.value = false
    await fetchQualifications()
  } catch (err) {
    console.error('添加授课资格失败:', err)
    error('添加授课资格失败: ' + (err as Error).message)
  }
}

// 删除资格
const deleteQualification = async (uuid: string, courseName: string, teacherName: string) => {
  if (!confirm(`确定要删除"${courseName}"-"${teacherName}"的授课资格吗？`)) {
    return
  }

  try {
    await deleteCourseQualification(uuid)
    success('删除授课资格成功')
    await fetchQualifications()
  } catch (err) {
    console.error('删除授课资格失败:', err)
    error('删除授课资格失败: ' + (err as Error).message)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 页面加载时获取数据
onMounted(async () => {
  await fetchQualifications()
})
</script>

<template>
  <div class="qualification-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">🎓</span>
          <span class="logo-text">课程教师资格管理</span>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="filter-item">
          <SearchSelect
            v-model="selectedCourse"
            placeholder="搜索课程..."
            :fetch-async="fetchCourseOptions"
            class="filter-select-custom"
          />
        </div>

        <div class="filter-item">
          <SearchSelect
            v-model="selectedTeacher"
            placeholder="搜索教师..."
            :fetch-async="fetchTeacherOptions"
            class="filter-select-custom"
          />
        </div>

        <button v-if="isAdmin" class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加授课资格
        </button>
      </div>

      <!-- 资格列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="qualifications.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无授课资格数据</h3>
        <p v-if="isAdmin">点击"添加授课资格"按钮添加第一个授课资格</p>
        <p v-else>暂无数据</p>
      </div>

      <!-- 数据表格 -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>课程名称</th>
              <th>教师姓名</th>
              <th>教师职称</th>
              <th>所属学院</th>
              <th v-if="isAdmin">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="qual in qualifications" :key="qual.course_qualification_uuid">
              <td>{{ qual.course_name }}</td>
              <td>{{ qual.teacher_name }}</td>
              <td>{{ qual.teacher_title }}</td>
              <td>{{ qual.department_name }}</td>
              <td v-if="isAdmin">
                <div class="action-buttons">
                  <button class="btn-delete" @click="deleteQualification(qual.course_qualification_uuid, qual.course_name, qual.teacher_name)">
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 添加对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="showDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>添加授课资格</h3>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>课程</label>
            <SearchSelect
              v-model="currentQualification.course_uuid"
              placeholder="搜索课程..."
              :fetch-async="fetchCourseOptions"
            />
          </div>
          <div class="form-group">
            <label>教师</label>
            <SearchSelect
              v-model="currentQualification.teacher_uuid"
              placeholder="搜索教师..."
              :fetch-async="fetchTeacherOptions"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveQualification">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qualification-management {
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
  color: #a0aec0;
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
  gap: 1rem;
  margin-bottom: 2rem;
}

/* 筛选下拉框 */
.filter-select {
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

/* 筛选项容器 */
.filter-item {
  min-width: 200px;
}

.filter-select-custom {
  width: 100%;
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

.form-select:focus {
  outline: none;
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
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

  .filter-select,
  .filter-item {
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

  .filter-select,
  .filter-item {
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
