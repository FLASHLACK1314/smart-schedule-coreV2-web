<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 教师数据类型定义
interface Teacher {
  teacher_uuid: string
  teacher_num: string
  teacher_name: string
  title: string
  max_hours_per_week: number
  is_active: boolean
  like_time: string
  department?: string
  email?: string
  phone?: string
}

// 响应式数据
const teachers = ref<Teacher[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentTeacher = ref<Teacher>({
  teacher_uuid: '',
  teacher_num: '',
  teacher_name: '',
  title: '',
  max_hours_per_week: 20,
  is_active: true,
  like_time: '',
  department: '',
  email: '',
  phone: '',
})

// 计算属性：过滤后的教师列表
const filteredTeachers = computed(() => {
  if (!searchKeyword.value) return teachers.value
  const keyword = searchKeyword.value.toLowerCase()
  return teachers.value.filter(
    (teacher) =>
      teacher.teacher_name.toLowerCase().includes(keyword) ||
      teacher.teacher_num.toLowerCase().includes(keyword) ||
      teacher.title.toLowerCase().includes(keyword),
  )
})

// 获取教师列表
const fetchTeachers = async () => {
  loading.value = true
  try {
    // TODO: 替换为实际的 API 调用
    teachers.value = []
  } catch (error) {
    console.error('获取教师列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  currentTeacher.value = {
    teacher_uuid: '',
    teacher_num: '',
    teacher_name: '',
    title: '',
    max_hours_per_week: 20,
    is_active: true,
    like_time: '',
    department: '',
    email: '',
    phone: '',
  }
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (teacher: Teacher) => {
  dialogMode.value = 'edit'
  currentTeacher.value = { ...teacher }
  showDialog.value = true
}

// 保存教师
const saveTeacher = async () => {
  try {
    // TODO: 替换为实际的 API 调用
    if (dialogMode.value === 'add') {
      console.log('添加教师:', currentTeacher.value)
    } else {
      console.log('更新教师:', currentTeacher.value)
    }
    showDialog.value = false
    await fetchTeachers()
  } catch (error) {
    console.error('保存教师失败:', error)
  }
}

// 删除教师
const deleteTeacher = async (teacher_uuid: string) => {
  if (!confirm('确定要删除该教师吗？')) return

  try {
    // TODO: 替换为实际的 API 调用
    console.log('删除教师:', teacher_uuid)
    await fetchTeachers()
  } catch (error) {
    console.error('删除教师失败:', error)
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

// 页面加载时获取数据
onMounted(() => {
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
            placeholder="搜索教师姓名、工号或职称..."
            class="search-input"
          />
        </div>
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

      <div v-else-if="filteredTeachers.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无教师数据</h3>
        <p>点击"添加教师"按钮添加第一位教师</p>
      </div>

      <div v-else class="teacher-grid">
        <div v-for="teacher in filteredTeachers" :key="teacher.teacher_uuid" class="teacher-card">
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
              <span class="info-label">部门</span>
              <span class="info-value">{{ teacher.department || '未设置' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">周课时</span>
              <span class="info-value">{{ teacher.max_hours_per_week }} 课时</span>
            </div>
            <div class="info-row">
              <span class="info-label">偏好时间</span>
              <span class="info-value">{{ teacher.like_time || '未设置' }}</span>
            </div>
            <div v-if="teacher.email" class="info-row">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ teacher.email }}</span>
            </div>
            <div v-if="teacher.phone" class="info-row">
              <span class="info-label">电话</span>
              <span class="info-value">{{ teacher.phone }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-edit" @click="openEditDialog(teacher)">
              <span class="btn-icon">✏️</span>
              编辑
            </button>
            <button class="btn-delete" @click="deleteTeacher(teacher.teacher_uuid)">
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
            <input v-model="currentTeacher.teacher_num" type="text" class="form-input" placeholder="请输入工号" />
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
            <label class="form-label">部门</label>
            <input v-model="currentTeacher.department" type="text" class="form-input" placeholder="请输入部门" />
          </div>

          <div class="form-group">
            <label class="form-label">每周最大课时 *</label>
            <input v-model.number="currentTeacher.max_hours_per_week" type="number" class="form-input" min="0" max="40" />
          </div>

          <div class="form-group">
            <label class="form-label">授课偏好时间</label>
            <textarea v-model="currentTeacher.like_time" class="form-textarea" placeholder="例如：周一、周三、周五上午" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input v-model="currentTeacher.email" type="email" class="form-input" placeholder="请输入邮箱" />
          </div>

          <div class="form-group">
            <label class="form-label">电话</label>
            <input v-model="currentTeacher.phone" type="tel" class="form-input" placeholder="请输入电话" />
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
</style>
