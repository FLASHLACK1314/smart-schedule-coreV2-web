<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCoursePage, addCourse, updateCourse, deleteCourse as deleteCourseApi } from '@/api/course'
import { getCourseTypePage } from '@/api/courseType'
import type { CourseInfoDTO, AddCourseVO, CourseTypeInfoDTO } from '@/api/types'
import { useMessage } from '@/composables/useMessage'

const router = useRouter()
const { success, error } = useMessage()

// 响应式数据
const courses = ref<CourseInfoDTO[]>([])
const courseTypes = ref<CourseTypeInfoDTO[]>([])
const loading = ref(false)
const courseTypesLoading = ref(false)
const searchKeyword = ref('')
const selectedCourseType = ref<string>('')
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

// 分页数据
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

// 当前编辑的课程
const currentCourse = ref<AddCourseVO>({
  course_uuid: '',
  course_num: '',
  course_name: '',
  course_type_uuid: '',
  course_credit: 0,
})

// 获取课程类型列表（用于下拉选择）
const fetchCourseTypes = async () => {
  courseTypesLoading.value = true
  try {
    const response = await getCourseTypePage({
      page: 1,
      size: 1000,
    })
    courseTypes.value = response.records
  } catch (err) {
    console.error('获取课程类型列表失败:', err)
    error('获取课程类型列表失败: ' + (err as Error).message)
  } finally {
    courseTypesLoading.value = false
  }
}

// 获取课程列表
const fetchCourses = async (params?: { course_name?: string; course_num?: string; course_type_uuid?: string }) => {
  loading.value = true
  try {
    const response = await getCoursePage({
      page: currentPage.value,
      size: pageSize.value,
      ...params,
    })
    courses.value = response.records
    total.value = response.total
  } catch (err) {
    console.error('获取课程列表失败:', err)
    error('获取课程列表失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 搜索防抖
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchKeyword, (newKeyword) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    fetchCourses({
      course_name: newKeyword || undefined,
      course_num: newKeyword || undefined,
      course_type_uuid: selectedCourseType.value || undefined,
    })
  }, 500)
})

// 监听课程类型筛选
watch(selectedCourseType, (newCourseTypeUuid) => {
  fetchCourses({
    course_name: searchKeyword.value || undefined,
    course_num: searchKeyword.value || undefined,
    course_type_uuid: newCourseTypeUuid || undefined,
  })
})

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  currentCourse.value = {
    course_uuid: '',
    course_num: '',
    course_name: '',
    course_type_uuid: '',
    course_credit: 0,
  }
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (course: CourseInfoDTO) => {
  dialogMode.value = 'edit'
  currentCourse.value = {
    course_uuid: course.course_uuid,
    course_num: course.course_num,
    course_name: course.course_name,
    course_type_uuid: course.course_type_uuid,
    course_credit: course.course_credit,
  }
  showDialog.value = true
}

// 保存课程
const saveCourse = async () => {
  // 表单验证
  if (!currentCourse.value.course_num.trim()) {
    error('请输入课程编号')
    return
  }
  if (!currentCourse.value.course_name.trim()) {
    error('请输入课程名称')
    return
  }
  if (!currentCourse.value.course_type_uuid) {
    error('请选择课程类型')
    return
  }
  if (currentCourse.value.course_credit <= 0) {
    error('请输入有效的课程学分')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      await addCourse(currentCourse.value)
      success('添加课程成功')
    } else {
      await updateCourse(currentCourse.value)
      success('更新课程成功')
    }
    showDialog.value = false
    await fetchCourses({
      course_name: searchKeyword.value || undefined,
      course_num: searchKeyword.value || undefined,
      course_type_uuid: selectedCourseType.value || undefined,
    })
  } catch (err) {
    console.error('保存课程失败:', err)
    error('保存课程失败: ' + (err as Error).message)
  }
}

// 删除课程
const deleteCourse = async (courseUuid: string, courseName: string) => {
  if (!confirm(`确定要删除课程"${courseName}"吗？\n\n注意：如果该课程下有教学班或课程资格，删除操作将失败。`)) return

  try {
    await deleteCourseApi(courseUuid)
    success('删除课程成功')
    await fetchCourses({
      course_name: searchKeyword.value || undefined,
      course_num: searchKeyword.value || undefined,
      course_type_uuid: selectedCourseType.value || undefined,
    })
  } catch (err) {
    console.error('删除课程失败:', err)
    error('删除课程失败: ' + (err as Error).message)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 页面加载时获取数据
onMounted(async () => {
  // 先加载课程类型列表
  await fetchCourseTypes()
  // 再加载课程列表
  await fetchCourses()
})
</script>

<template>
  <div class="course-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">📖</span>
          <span class="logo-text">课程管理</span>
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
            placeholder="搜索课程编号或名称..."
            class="search-input"
          />
        </div>

        <select v-model="selectedCourseType" class="filter-select" :disabled="courseTypesLoading">
          <option value="">全部课程类型</option>
          <option v-for="courseType in courseTypes" :key="courseType.course_type_uuid" :value="courseType.course_type_uuid">
            {{ courseType.type_name }}
          </option>
        </select>

        <button class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加课程
        </button>
      </div>

      <!-- 课程列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="courses.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无课程数据</h3>
        <p>点击"添加课程"按钮添加第一个课程</p>
      </div>

      <!-- 数据表格 -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>课程编号</th>
              <th>课程名称</th>
              <th>课程类型</th>
              <th>课程学分</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in courses" :key="course.course_uuid">
              <td>{{ course.course_num }}</td>
              <td>{{ course.course_name }}</td>
              <td>{{ course.course_type_name }}</td>
              <td>{{ course.course_credit }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-edit" @click="openEditDialog(course)">编辑</button>
                  <button class="btn-delete" @click="deleteCourse(course.course_uuid, course.course_name)">
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
          <h3>{{ dialogMode === 'add' ? '添加课程' : '编辑课程' }}</h3>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>课程编号</label>
            <input
              v-model="currentCourse.course_num"
              type="text"
              class="form-input"
              placeholder="请输入课程编号（唯一）"
            />
          </div>
          <div class="form-group">
            <label>课程名称</label>
            <input
              v-model="currentCourse.course_name"
              type="text"
              class="form-input"
              placeholder="请输入课程名称"
            />
          </div>
          <div class="form-group">
            <label>课程类型</label>
            <select v-model="currentCourse.course_type_uuid" class="form-select">
              <option value="">请选择课程类型</option>
              <option v-for="courseType in courseTypes" :key="courseType.course_type_uuid" :value="courseType.course_type_uuid">
                {{ courseType.type_name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>课程学分</label>
            <input
              v-model.number="currentCourse.course_credit"
              type="number"
              step="0.5"
              min="0.5"
              max="10"
              class="form-input"
              placeholder="请输入课程学分"
            />
            <small class="form-hint">支持小数，如 1.5、2.0 等</small>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveCourse">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-management {
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
  font-size: 1.5;
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

.search-box:focus-within {
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.search-icon {
  font-size: 1.2rem;
  margin-right: 0.75rem;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 1rem;
}

.search-input::placeholder {
  color: #a0aec0;
}

/* 筛选下拉框 */
.filter-select {
  min-width: 180px;
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

.form-input:disabled {
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

  .search-box {
    min-width: 200px;
  }

  .filter-select {
    min-width: 140px;
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

  .search-box {
    width: 100%;
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
