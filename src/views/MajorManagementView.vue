<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 专业数据类型定义
interface Major {
  major_uuid: string
  major_code: string
  major_name: string
  college_name: string
  degree_type: string
  duration: number
  tuition: number
  description: string
  is_active: boolean
}

// 响应式数据
const majors = ref<Major[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentMajor = ref<Major>({
  major_uuid: '',
  major_code: '',
  major_name: '',
  college_name: '',
  degree_type: '',
  duration: 4,
  tuition: 5000,
  description: '',
  is_active: true,
})

// 学院列表选项
const collegeOptions = ref<string[]>([
  '计算机科学与技术学院',
  '软件工程学院',
  '人工智能学院',
  '信息工程学院',
])

// 学位类型选项
const degreeTypeOptions = ref<string[]>([
  '本科',
  '硕士',
  '博士',
  '专升本',
])

// 计算属性：过滤后的专业列表
const filteredMajors = computed(() => {
  if (!searchKeyword.value) return majors.value
  const keyword = searchKeyword.value.toLowerCase()
  return majors.value.filter(
    (major) =>
      major.major_name.toLowerCase().includes(keyword) ||
      major.major_code.toLowerCase().includes(keyword) ||
      major.college_name.toLowerCase().includes(keyword),
  )
})

// 获取专业列表
const fetchMajors = async () => {
  loading.value = true
  try {
    // TODO: 替换为实际的 API 调用
    // 模拟数据
    majors.value = [
      {
        major_uuid: '1',
        major_code: 'CS001',
        major_name: '计算机科学与技术',
        college_name: '计算机科学与技术学院',
        degree_type: '本科',
        duration: 4,
        tuition: 5000,
        description: '培养计算机领域高素质人才',
        is_active: true,
      },
      {
        major_uuid: '2',
        major_code: 'SE001',
        major_name: '软件工程',
        college_name: '软件工程学院',
        degree_type: '本科',
        duration: 4,
        tuition: 5500,
        description: '专注于软件工程人才培养',
        is_active: true,
      },
      {
        major_uuid: '3',
        major_code: 'AI001',
        major_name: '人工智能',
        college_name: '人工智能学院',
        degree_type: '硕士',
        duration: 3,
        tuition: 8000,
        description: '人工智能领域前沿研究',
        is_active: true,
      },
      {
        major_uuid: '4',
        major_code: 'CS002',
        major_name: '数据科学与大数据技术',
        college_name: '计算机科学与技术学院',
        degree_type: '本科',
        duration: 4,
        tuition: 5200,
        description: '大数据处理与分析',
        is_active: true,
      },
    ]
  } catch (error) {
    console.error('获取专业列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  currentMajor.value = {
    major_uuid: '',
    major_code: '',
    major_name: '',
    college_name: '',
    degree_type: '',
    duration: 4,
    tuition: 5000,
    description: '',
    is_active: true,
  }
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (major: Major) => {
  dialogMode.value = 'edit'
  currentMajor.value = { ...major }
  showDialog.value = true
}

// 保存专业
const saveMajor = async () => {
  try {
    // TODO: 替换为实际的 API 调用
    if (dialogMode.value === 'add') {
      console.log('添加专业:', currentMajor.value)
    } else {
      console.log('更新专业:', currentMajor.value)
    }
    showDialog.value = false
    await fetchMajors()
  } catch (error) {
    console.error('保存专业失败:', error)
  }
}

// 删除专业
const deleteMajor = async (major_uuid: string) => {
  if (!confirm('确定要删除该专业吗？')) return

  try {
    // TODO: 替换为实际的 API 调用
    console.log('删除专业:', major_uuid)
    await fetchMajors()
  } catch (error) {
    console.error('删除专业失败:', error)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 格式化状态显示
const formatStatus = (isActive: boolean) => {
  return isActive ? '启用' : '停用'
}

// 格式化状态样式
const getStatusClass = (isActive: boolean) => {
  return isActive ? 'status-active' : 'status-inactive'
}

// 页面加载时获取数据
onMounted(() => {
  fetchMajors()
})
</script>

<template>
  <div class="major-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">📖</span>
          <span class="logo-text">专业管理</span>
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
            placeholder="搜索专业名称、编码或所属学院..."
            class="search-input"
          />
        </div>
        <button class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加专业
        </button>
      </div>

      <!-- 数据表格 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>专业编码</th>
              <th>专业名称</th>
              <th>所属学院</th>
              <th>学位类型</th>
              <th>学制</th>
              <th>学费(元/年)</th>
              <th>描述</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody v-if="!loading && filteredMajors.length > 0">
            <tr v-for="major in filteredMajors" :key="major.major_uuid">
              <td>{{ major.major_code }}</td>
              <td>{{ major.major_name }}</td>
              <td>{{ major.college_name }}</td>
              <td>{{ major.degree_type }}</td>
              <td>{{ major.duration }}年</td>
              <td>{{ major.tuition }}</td>
              <td>{{ major.description }}</td>
              <td>
                <span :class="['status-badge', getStatusClass(major.is_active)]">
                  {{ formatStatus(major.is_active) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-edit" @click="openEditDialog(major)">编辑</button>
                  <button class="btn-delete" @click="deleteMajor(major.major_uuid)">
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="loading">
            <tr>
              <td colspan="9" class="loading-cell">加载中...</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="9" class="empty-cell">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="showDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '添加专业' : '编辑专业' }}</h3>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>专业编码</label>
            <input v-model="currentMajor.major_code" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>专业名称</label>
            <input v-model="currentMajor.major_name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>所属学院</label>
            <select v-model="currentMajor.college_name" class="form-select">
              <option value="">请选择学院</option>
              <option v-for="college in collegeOptions" :key="college" :value="college">
                {{ college }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>学位类型</label>
            <select v-model="currentMajor.degree_type" class="form-select">
              <option value="">请选择学位类型</option>
              <option v-for="type in degreeTypeOptions" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>学制(年)</label>
              <input v-model.number="currentMajor.duration" type="number" class="form-input" min="1" max="10" />
            </div>
            <div class="form-group">
              <label>学费(元/年)</label>
              <input v-model.number="currentMajor.tuition" type="number" class="form-input" min="0" step="100" />
            </div>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="currentMajor.description" class="form-textarea" rows="3" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="currentMajor.is_active" class="form-select">
              <option :value="true">启用</option>
              <option :value="false">停用</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveMajor">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.major-management {
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
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
}

.search-box {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
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
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
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

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 3rem !important;
  color: #a0aec0;
  font-size: 1rem;
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-input,
.form-select,
.form-textarea {
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
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #a0aec0;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .navbar-content,
  .main-content {
    padding: 1rem 2rem;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .table-container {
    overflow-x: auto;
  }

  .data-table {
    min-width: 1000px;
  }

  .form-row {
    grid-template-columns: 1fr;
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

  .action-buttons {
    flex-direction: column;
  }

  .dialog {
    width: 95%;
    margin: 1rem;
  }
}
</style>
