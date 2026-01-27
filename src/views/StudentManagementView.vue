<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 学生数据类型定义
interface Student {
  student_uuid: string
  student_id: string
  student_name: string
  class_uuid: string
  class_name?: string
  grade?: string
  gender?: string
  email?: string
  phone?: string
  enrollment_date?: string
  status?: 'active' | 'inactive' | 'graduated'
}

// 响应式数据
const students = ref<Student[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentStudent = ref<Student>({
  student_uuid: '',
  student_id: '',
  student_name: '',
  class_uuid: '',
  class_name: '',
  grade: '',
  gender: '',
  email: '',
  phone: '',
  enrollment_date: '',
  status: 'active',
})

// 计算属性：过滤后的学生列表
const filteredStudents = computed(() => {
  if (!searchKeyword.value) return students.value
  const keyword = searchKeyword.value.toLowerCase()
  return students.value.filter(
    (student) =>
      student.student_name.toLowerCase().includes(keyword) ||
      student.student_id.toLowerCase().includes(keyword) ||
      (student.class_name && student.class_name.toLowerCase().includes(keyword)),
  )
})

// 获取学生列表
const fetchStudents = async () => {
  loading.value = true
  try {
    // TODO: 替换为实际的 API 调用
    // 模拟数据
    students.value = [
      {
        student_uuid: '1',
        student_id: 'S2023001',
        student_name: '张三',
        class_uuid: 'class1',
        class_name: '计算机科学与技术 2101 班',
        grade: '2021级',
        gender: '男',
        email: 'zhangsan@university.edu',
        phone: '13900001111',
        enrollment_date: '2021-09-01',
        status: 'active',
      },
      {
        student_uuid: '2',
        student_id: 'S2023002',
        student_name: '李四',
        class_uuid: 'class1',
        class_name: '计算机科学与技术 2101 班',
        grade: '2021级',
        gender: '女',
        email: 'lisi@university.edu',
        phone: '13900002222',
        enrollment_date: '2021-09-01',
        status: 'active',
      },
      {
        student_uuid: '3',
        student_id: 'S2023003',
        student_name: '王五',
        class_uuid: 'class2',
        class_name: '软件工程 2101 班',
        grade: '2021级',
        gender: '男',
        email: 'wangwu@university.edu',
        phone: '13900003333',
        enrollment_date: '2021-09-01',
        status: 'inactive',
      },
      {
        student_uuid: '4',
        student_id: 'S2020004',
        student_name: '赵六',
        class_uuid: 'class3',
        class_name: '计算机科学与技术 2001 班',
        grade: '2020级',
        gender: '女',
        email: 'zhaoliu@university.edu',
        phone: '13900004444',
        enrollment_date: '2020-09-01',
        status: 'graduated',
      },
    ]
  } catch (error) {
    console.error('获取学生列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  currentStudent.value = {
    student_uuid: '',
    student_id: '',
    student_name: '',
    class_uuid: '',
    class_name: '',
    grade: '',
    gender: '',
    email: '',
    phone: '',
    enrollment_date: '',
    status: 'active',
  }
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (student: Student) => {
  dialogMode.value = 'edit'
  currentStudent.value = { ...student }
  showDialog.value = true
}

// 保存学生
const saveStudent = async () => {
  try {
    // TODO: 替换为实际的 API 调用
    if (dialogMode.value === 'add') {
      console.log('添加学生:', currentStudent.value)
    } else {
      console.log('更新学生:', currentStudent.value)
    }
    showDialog.value = false
    await fetchStudents()
  } catch (error) {
    console.error('保存学生失败:', error)
  }
}

// 删除学生
const deleteStudent = async (student_uuid: string) => {
  if (!confirm('确定要删除该学生吗？')) return

  try {
    // TODO: 替换为实际的 API 调用
    console.log('删除学生:', student_uuid)
    await fetchStudents()
  } catch (error) {
    console.error('删除学生失败:', error)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 格式化状态显示
const formatStatus = (status?: string) => {
  const statusMap = {
    active: '在读',
    inactive: '休学',
    graduated: '毕业',
  }
  return statusMap[status as keyof typeof statusMap] || '未知'
}

// 格式化状态样式
const getStatusClass = (status?: string) => {
  return `status-${status || 'unknown'}`
}
</script>

<template>
  <div class="student-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">🎓</span>
          <span class="logo-text">学生管理</span>
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
            placeholder="搜索学生姓名、学号或班级..."
            class="search-input"
          />
        </div>
        <button class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加学生
        </button>
      </div>

      <!-- 学生列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredStudents.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无学生数据</h3>
        <p>点击"添加学生"按钮添加第一位学生</p>
      </div>

      <div v-else class="student-list">
        <div class="list-header">
          <div class="header-cell">学号</div>
          <div class="header-cell">姓名</div>
          <div class="header-cell">性别</div>
          <div class="header-cell">班级</div>
          <div class="header-cell">年级</div>
          <div class="header-cell">状态</div>
          <div class="header-cell">联系方式</div>
          <div class="header-cell">操作</div>
        </div>

        <div v-for="student in filteredStudents" :key="student.student_uuid" class="student-row">
          <div class="data-cell student-id">{{ student.student_id }}</div>
          <div class="data-cell student-name">
            <div class="student-avatar">{{ student.student_name.charAt(0) }}</div>
            <span>{{ student.student_name }}</span>
          </div>
          <div class="data-cell">{{ student.gender || '-' }}</div>
          <div class="data-cell">{{ student.class_name || '-' }}</div>
          <div class="data-cell">{{ student.grade || '-' }}</div>
          <div class="data-cell">
            <span :class="['status-badge', getStatusClass(student.status)]">
              {{ formatStatus(student.status) }}
            </span>
          </div>
          <div class="data-cell contact-info">
            <div v-if="student.email" class="contact-item">📧 {{ student.email }}</div>
            <div v-if="student.phone" class="contact-item">📱 {{ student.phone }}</div>
            <div v-if="!student.email && !student.phone">-</div>
          </div>
          <div class="data-cell actions">
            <button class="btn-edit" @click="openEditDialog(student)">
              <span class="btn-icon">✏️</span>
            </button>
            <button class="btn-delete" @click="deleteStudent(student.student_uuid)">
              <span class="btn-icon">🗑️</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="showDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h2>{{ dialogMode === 'add' ? '添加学生' : '编辑学生' }}</h2>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">学号 *</label>
            <input v-model="currentStudent.student_id" type="text" class="form-input" placeholder="请输入学号" />
          </div>

          <div class="form-group">
            <label class="form-label">姓名 *</label>
            <input v-model="currentStudent.student_name" type="text" class="form-input" placeholder="请输入姓名" />
          </div>

          <div class="form-group">
            <label class="form-label">性别</label>
            <select v-model="currentStudent.gender" class="form-input">
              <option value="">请选择性别</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">班级 *</label>
            <input v-model="currentStudent.class_name" type="text" class="form-input" placeholder="请输入班级" />
          </div>

          <div class="form-group">
            <label class="form-label">年级</label>
            <input v-model="currentStudent.grade" type="text" class="form-input" placeholder="例如：2021级" />
          </div>

          <div class="form-group">
            <label class="form-label">入学日期</label>
            <input v-model="currentStudent.enrollment_date" type="date" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input v-model="currentStudent.email" type="email" class="form-input" placeholder="请输入邮箱" />
          </div>

          <div class="form-group">
            <label class="form-label">电话</label>
            <input v-model="currentStudent.phone" type="tel" class="form-input" placeholder="请输入电话" />
          </div>

          <div class="form-group">
            <label class="form-label">状态</label>
            <select v-model="currentStudent.status" class="form-input">
              <option value="active">在读</option>
              <option value="inactive">休学</option>
              <option value="graduated">毕业</option>
            </select>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveStudent">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.student-management {
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

/* 学生列表（表格样式） */
.student-list {
  background: rgba(30, 30, 50, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 140px 180px 80px 1fr 100px 100px 200px 120px;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-cell {
  color: #a0aec0;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.student-row {
  display: grid;
  grid-template-columns: 140px 180px 80px 1fr 100px 100px 200px 120px;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  align-items: center;
}

.student-row:hover {
  background: rgba(0, 212, 255, 0.05);
}

.student-row:last-child {
  border-bottom: none;
}

.data-cell {
  color: #ffffff;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-id {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #00d4ff;
}

.student-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #a0aec0;
}

.contact-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-active {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-inactive {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.status-graduated {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.status-unknown {
  background: rgba(158, 158, 158, 0.2);
  color: #9e9e9e;
  border: 1px solid rgba(158, 158, 158, 0.3);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit,
.btn-delete {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.3);
  transform: scale(1.1);
}

.btn-delete {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.btn-delete:hover {
  background: rgba(244, 67, 54, 0.3);
  transform: scale(1.1);
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

.form-input {
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

.form-input:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
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

  /* 移动端使用卡片布局 */
  .list-header {
    display: none;
  }

  .student-row {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
    position: relative;
  }

  .student-name {
    font-size: 1.1rem;
    font-weight: 600;
  }

  .student-avatar {
    width: 48px;
    height: 48px;
    font-size: 1.2rem;
  }

  .data-cell {
    white-space: normal;
  }

  .data-cell::before {
    content: attr(data-label);
    font-weight: 600;
    margin-right: 0.5rem;
    color: #a0aec0;
  }

  .contact-info {
    font-size: 0.9rem;
  }

  .actions {
    position: absolute;
    top: 1rem;
    right: 1rem;
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
