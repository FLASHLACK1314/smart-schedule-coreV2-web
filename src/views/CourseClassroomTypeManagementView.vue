<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getCourseClassroomTypePage,
  addCourseClassroomType,
  deleteCourseClassroomType,
} from '@/api/courseClassroomType'
import { getCourseTypePage } from '@/api/courseType'
import { getClassroomTypePage } from '@/api/classroomType'
import type { CourseClassroomTypeInfoDTO, CourseTypeInfoDTO, ClassroomTypeInfoDTO } from '@/api/types'
import { useMessage } from '@/composables/useMessage'

const router = useRouter()
const { success, error } = useMessage()

// 响应式数据
const relations = ref<CourseClassroomTypeInfoDTO[]>([])
const courseTypes = ref<CourseTypeInfoDTO[]>([])
const classroomTypes = ref<ClassroomTypeInfoDTO[]>([])
const loading = ref(false)
const courseTypesLoading = ref(false)
const classroomTypesLoading = ref(false)
const selectedCourseType = ref<string>('')
const selectedClassroomType = ref<string>('')
const showDialog = ref(false)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

// 当前添加的关联
const currentRelation = ref<({
  course_type_uuid: string
  classroom_type_uuid: string
})>({
  course_type_uuid: '',
  classroom_type_uuid: '',
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

// 获取教室类型列表（用于下拉选择）
const fetchClassroomTypes = async () => {
  classroomTypesLoading.value = true
  try {
    const response = await getClassroomTypePage({
      page: 1,
      size: 1000,
    })
    classroomTypes.value = response.records
  } catch (err) {
    console.error('获取教室类型列表失败:', err)
    error('获取教室类型列表失败: ' + (err as Error).message)
  } finally {
    classroomTypesLoading.value = false
  }
}

// 获取关联列表
const fetchRelations = async (params?: { course_type_uuid?: string; classroom_type_uuid?: string }) => {
  loading.value = true
  try {
    const response = await getCourseClassroomTypePage({
      page: currentPage.value,
      size: pageSize.value,
      ...params,
    })
    relations.value = response.records
    total.value = response.total
  } catch (err) {
    console.error('获取关联列表失败:', err)
    error('获取关联列表失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 监听课程类型筛选
watch(selectedCourseType, (newCourseTypeUuid) => {
  fetchRelations({
    course_type_uuid: newCourseTypeUuid || undefined,
    classroom_type_uuid: selectedClassroomType.value || undefined,
  })
})

// 监听教室类型筛选
watch(selectedClassroomType, (newClassroomTypeUuid) => {
  fetchRelations({
    course_type_uuid: selectedCourseType.value || undefined,
    classroom_type_uuid: newClassroomTypeUuid || undefined,
  })
})

// 打开添加对话框
const openAddDialog = () => {
  currentRelation.value = {
    course_type_uuid: '',
    classroom_type_uuid: '',
  }
  showDialog.value = true
}

// 保存关联
const saveRelation = async () => {
  // 表单验证
  if (!currentRelation.value.course_type_uuid) {
    error('请选择课程类型')
    return
  }
  if (!currentRelation.value.classroom_type_uuid) {
    error('请选择教室类型')
    return
  }

  try {
    await addCourseClassroomType(currentRelation.value)
    success('添加关联成功')
    showDialog.value = false
    await fetchRelations({
      course_type_uuid: selectedCourseType.value || undefined,
      classroom_type_uuid: selectedClassroomType.value || undefined,
    })
  } catch (err) {
    console.error('添加关联失败:', err)
    error('添加关联失败: ' + (err as Error).message)
  }
}

// 删除关联
const deleteRelation = async (item: CourseClassroomTypeInfoDTO) => {
  if (!confirm(`确定要删除「${item.course_type_name} - ${item.classroom_type_name}」的关联吗？`)) return

  try {
    await deleteCourseClassroomType(item.relation_uuid)
    success('删除关联成功')
    await fetchRelations({
      course_type_uuid: selectedCourseType.value || undefined,
      classroom_type_uuid: selectedClassroomType.value || undefined,
    })
  } catch (err) {
    console.error('删除关联失败:', err)
    error('删除关联失败: ' + (err as Error).message)
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
  // 再加载教室类型列表
  await fetchClassroomTypes()
  // 最后加载关联列表
  await fetchRelations()
})
</script>

<template>
  <div class="course-classroom-type-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">🔗</span>
          <span class="logo-text">课程类型-教室类型关联管理</span>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 操作栏 -->
      <div class="action-bar">
        <select v-model="selectedCourseType" class="filter-select" :disabled="courseTypesLoading">
          <option value="">全部课程类型</option>
          <option v-for="type in courseTypes" :key="type.course_type_uuid" :value="type.course_type_uuid">
            {{ type.type_name }}
          </option>
        </select>

        <select v-model="selectedClassroomType" class="filter-select" :disabled="classroomTypesLoading">
          <option value="">全部教室类型</option>
          <option v-for="type in classroomTypes" :key="type.classroom_type_uuid" :value="type.classroom_type_uuid">
            {{ type.type_name }}
          </option>
        </select>

        <button class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加关联
        </button>
      </div>

      <!-- 关联列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="relations.length === 0" class="empty-state">
        <div class="empty-icon">🔗</div>
        <h3>暂无关联数据</h3>
        <p>点击"添加关联"按钮添加第一个关联</p>
      </div>

      <!-- 数据表格 -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>课程类型</th>
              <th>教室类型</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in relations" :key="item.relation_uuid">
              <td>{{ index + 1 }}</td>
              <td>{{ item.course_type_name }}</td>
              <td>{{ item.classroom_type_name }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-delete" @click="deleteRelation(item)">删除</button>
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
          <h3>添加关联</h3>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>课程类型</label>
            <select v-model="currentRelation.course_type_uuid" class="form-select">
              <option value="">请选择课程类型</option>
              <option v-for="type in courseTypes" :key="type.course_type_uuid" :value="type.course_type_uuid">
                {{ type.type_name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>教室类型</label>
            <select v-model="currentRelation.classroom_type_uuid" class="form-select">
              <option value="">请选择教室类型</option>
              <option v-for="type in classroomTypes" :key="type.classroom_type_uuid" :value="type.classroom_type_uuid">
                {{ type.type_name }}
              </option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveRelation">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-classroom-type-management {
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

  .filter-select {
    min-width: 160px;
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
