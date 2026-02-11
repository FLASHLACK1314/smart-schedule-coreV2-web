<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCourseTypePage, addCourseType, updateCourseType, deleteCourseType } from '@/api/courseType'
import type { CourseTypeInfoDTO, AddCourseTypeVO } from '@/api/types'
import { useMessage } from '@/composables/useMessage'

const router = useRouter()
const { success, error } = useMessage()

// 响应式数据
const courseTypes = ref<CourseTypeInfoDTO[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

// 分页数据
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

// 当前编辑的课程类型
const currentCourseType = ref<AddCourseTypeVO>({
  course_type_uuid: '',
  course_type_name: '',
})

// 计算属性：显示的课程类型列表
const displayCourseTypes = computed(() => courseTypes.value)

// 获取课程类型列表
const fetchCourseTypes = async (params?: { course_type_name?: string }) => {
  loading.value = true
  try {
    const response = await getCourseTypePage({
      page: currentPage.value,
      size: pageSize.value,
      ...params,
    })
    courseTypes.value = response.records
    total.value = response.total
  } catch (err) {
    console.error('获取课程类型列表失败:', err)
    error('获取课程类型列表失败: ' + (err as Error).message)
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
    fetchCourseTypes({
      course_type_name: newKeyword || undefined,
    })
  }, 500)
})

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  currentCourseType.value = {
    course_type_uuid: '',
    course_type_name: '',
  }
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (courseType: CourseTypeInfoDTO) => {
  dialogMode.value = 'edit'
  currentCourseType.value = {
    course_type_uuid: courseType.course_type_uuid,
    course_type_name: courseType.type_name,
  }
  showDialog.value = true
}

// 保存课程类型
const saveCourseType = async () => {
  // 表单验证
  if (!currentCourseType.value.course_type_name.trim()) {
    error('请输入课程类型名称')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      await addCourseType(currentCourseType.value)
      success('添加课程类型成功')
    } else {
      await updateCourseType(currentCourseType.value)
      success('更新课程类型成功')
    }
    showDialog.value = false
    await fetchCourseTypes({
      course_type_name: searchKeyword.value || undefined,
    })
  } catch (err) {
    console.error('保存课程类型失败:', err)
    error('保存课程类型失败: ' + (err as Error).message)
  }
}

// 删除课程类型
const deleteType = async (courseTypeUuid: string, typeName: string) => {
  if (!confirm(`确定要删除课程类型"${typeName}"吗？\n\n注意：如果该课程类型下有课程，删除操作将失败。`)) return

  try {
    await deleteCourseType(courseTypeUuid)
    success('删除课程类型成功')
    await fetchCourseTypes({
      course_type_name: searchKeyword.value || undefined,
    })
  } catch (err) {
    console.error('删除课程类型失败:', err)
    error('删除课程类型失败: ' + (err as Error).message)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 页面加载时获取数据
onMounted(async () => {
  await fetchCourseTypes()
})
</script>

<template>
  <div class="course-type-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">🏷️</span>
          <span class="logo-text">课程类型管理</span>
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
            placeholder="搜索课程类型名称..."
            class="search-input"
          />
        </div>

        <button class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加课程类型
        </button>
      </div>

      <!-- 课程类型列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="courseTypes.length === 0" class="empty-state">
        <div class="empty-icon">🏷️</div>
        <h3>暂无课程类型数据</h3>
        <p>点击"添加课程类型"按钮添加第一个课程类型</p>
      </div>

      <!-- 卡片网格 -->
      <div v-else class="course-type-grid">
        <div v-for="type in displayCourseTypes" :key="type.course_type_uuid" class="course-type-card">
          <div class="card-header">
            <div class="course-type-avatar">
              {{ type.type_name.charAt(0) }}
            </div>
            <div class="course-type-info">
              <h3 class="course-type-name">{{ type.type_name }}</h3>
              <p class="course-type-description">{{ type.type_description || '暂无描述' }}</p>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-edit" @click="openEditDialog(type)">
              <span class="btn-icon">✏️</span>
              编辑
            </button>
            <button class="btn-delete" @click="deleteType(type.course_type_uuid, type.type_name)">
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
          <h3>{{ dialogMode === 'add' ? '添加课程类型' : '编辑课程类型' }}</h3>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">课程类型名称</label>
            <input
              v-model="currentCourseType.course_type_name"
              type="text"
              class="form-input"
              placeholder="请输入课程类型名称"
              maxlength="50"
            />
            <small class="form-hint">例如：必修课、选修课、实践课等</small>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveCourseType">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-type-management {
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

/* 课程类型卡片网格 */
.course-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.course-type-card {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.course-type-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(139, 195, 74, 0.15);
  border-color: rgba(139, 195, 74, 0.3);
}

.card-header {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.course-type-avatar {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #8BC34A 0%, #689F38 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.course-type-info {
  flex: 1;
}

.course-type-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.course-type-description {
  font-size: 0.9rem;
  color: #a0aec0;
  margin: 0;
}

.card-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

/* 操作按钮和卡片样式 */
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
.form-select {
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

.form-input:focus,
.form-select:focus {
  border-color: #8BC34A;
  box-shadow: 0 0 0 3px rgba(139, 195, 74, 0.1);
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

  .course-type-grid {
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

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .course-type-grid {
    grid-template-columns: 1fr;
  }

  .dialog {
    width: 95%;
    margin: 1rem;
    max-height: calc(90vh - 2rem);
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding: 1.5rem;
  }
}
</style>
