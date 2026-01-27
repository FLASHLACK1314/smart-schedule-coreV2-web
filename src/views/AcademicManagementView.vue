<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 教务管理员数据类型定义
interface AcademicAdmin {
  academic_uuid: string
  academic_num: string
  academic_name: string
  department_uuid: string
  department_name?: string
  email?: string
  phone?: string
  is_active: boolean
  hire_date?: string
  position?: string
  permissions?: string[]
}

// 响应式数据
const academics = ref<AcademicAdmin[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentAcademic = ref<AcademicAdmin>({
  academic_uuid: '',
  academic_num: '',
  academic_name: '',
  department_uuid: '',
  department_name: '',
  email: '',
  phone: '',
  is_active: true,
  hire_date: '',
  position: '',
  permissions: [],
})

// 计算属性：过滤后的教务管理员列表
const filteredAcademics = computed(() => {
  if (!searchKeyword.value) return academics.value
  const keyword = searchKeyword.value.toLowerCase()
  return academics.value.filter(
    (academic) =>
      academic.academic_name.toLowerCase().includes(keyword) ||
      academic.academic_num.toLowerCase().includes(keyword) ||
      (academic.department_name && academic.department_name.toLowerCase().includes(keyword)),
  )
})

// 获取教务管理员列表
const fetchAcademics = async () => {
  loading.value = true
  try {
    // TODO: 替换为实际的 API 调用
    // 模拟数据
    academics.value = [
      {
        academic_uuid: '1',
        academic_num: 'A2023001',
        academic_name: '张主任',
        department_uuid: 'dept1',
        department_name: '教务处',
        email: 'zhang@academic.edu',
        phone: '13800001111',
        is_active: true,
        hire_date: '2020-03-01',
        position: '教务处主任',
        permissions: ['排课管理', '课程管理', '教师管理', '教室管理', '班级管理'],
      },
      {
        academic_uuid: '2',
        academic_num: 'A2023002',
        academic_name: '李副主任',
        department_uuid: 'dept1',
        department_name: '教务处',
        email: 'li@academic.edu',
        phone: '13800002222',
        is_active: true,
        hire_date: '2021-05-15',
        position: '教务处副主任',
        permissions: ['排课管理', '课程管理', '教师管理'],
      },
      {
        academic_uuid: '3',
        academic_num: 'A2023003',
        academic_name: '王老师',
        department_uuid: 'dept2',
        department_name: '各学院教务科',
        email: 'wang@academic.edu',
        phone: '13800003333',
        is_active: true,
        hire_date: '2022-09-01',
        position: '教务员',
        permissions: ['课程管理', '教室管理'],
      },
      {
        academic_uuid: '4',
        academic_num: 'A2020004',
        academic_name: '赵老师',
        department_uuid: 'dept1',
        department_name: '教务处',
        email: 'zhao@academic.edu',
        phone: '13800004444',
        is_active: false,
        hire_date: '2019-03-01',
        position: '教务员',
        permissions: ['课程管理'],
      },
    ]
  } catch (error) {
    console.error('获取教务管理员列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  currentAcademic.value = {
    academic_uuid: '',
    academic_num: '',
    academic_name: '',
    department_uuid: '',
    department_name: '',
    email: '',
    phone: '',
    is_active: true,
    hire_date: '',
    position: '',
    permissions: [],
  }
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (academic: AcademicAdmin) => {
  dialogMode.value = 'edit'
  currentAcademic.value = { ...academic }
  showDialog.value = true
}

// 保存教务管理员
const saveAcademic = async () => {
  try {
    // TODO: 替换为实际的 API 调用
    if (dialogMode.value === 'add') {
      console.log('添加教务管理员:', currentAcademic.value)
    } else {
      console.log('更新教务管理员:', currentAcademic.value)
    }
    showDialog.value = false
    await fetchAcademics()
  } catch (error) {
    console.error('保存教务管理员失败:', error)
  }
}

// 删除教务管理员
const deleteAcademic = async (academic_uuid: string) => {
  if (!confirm('确定要删除该教务管理员吗？')) return

  try {
    // TODO: 替换为实际的 API 调用
    console.log('删除教务管理员:', academic_uuid)
    await fetchAcademics()
  } catch (error) {
    console.error('删除教务管理员失败:', error)
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
</script>

<template>
  <div class="academic-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">📋</span>
          <span class="logo-text">教务管理</span>
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
            placeholder="搜索教务人员姓名、工号或部门..."
            class="search-input"
          />
        </div>
        <button class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加教务人员
        </button>
      </div>

      <!-- 教务管理员列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredAcademics.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无教务人员数据</h3>
        <p>点击"添加教务人员"按钮添加第一位教务人员</p>
      </div>

      <div v-else class="academic-grid">
        <div v-for="academic in filteredAcademics" :key="academic.academic_uuid" class="academic-card">
          <div class="card-header">
            <div class="academic-avatar">
              {{ academic.academic_name.charAt(0) }}
            </div>
            <div class="academic-info">
              <h3 class="academic-name">{{ academic.academic_name }}</h3>
              <p class="academic-position">{{ academic.position || '未设置职位' }}</p>
            </div>
            <div :class="['status-badge', getStatusClass(academic.is_active)]">
              {{ formatStatus(academic.is_active) }}
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="info-label">工号</span>
              <span class="info-value">{{ academic.academic_num }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">部门</span>
              <span class="info-value">{{ academic.department_name || '未设置' }}</span>
            </div>
            <div v-if="academic.email" class="info-row">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ academic.email }}</span>
            </div>
            <div v-if="academic.phone" class="info-row">
              <span class="info-label">电话</span>
              <span class="info-value">{{ academic.phone }}</span>
            </div>
            <div v-if="academic.hire_date" class="info-row">
              <span class="info-label">入职日期</span>
              <span class="info-value">{{ academic.hire_date }}</span>
            </div>

            <div v-if="academic.permissions && academic.permissions.length > 0" class="permissions-section">
              <div class="info-label" style="margin-bottom: 0.5rem">权限</div>
              <div class="permissions-tags">
                <span v-for="permission in academic.permissions" :key="permission" class="permission-tag">
                  {{ permission }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-edit" @click="openEditDialog(academic)">
              <span class="btn-icon">✏️</span>
              编辑
            </button>
            <button class="btn-delete" @click="deleteAcademic(academic.academic_uuid)">
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
          <h2>{{ dialogMode === 'add' ? '添加教务人员' : '编辑教务人员' }}</h2>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">工号 *</label>
            <input v-model="currentAcademic.academic_num" type="text" class="form-input" placeholder="请输入工号" />
          </div>

          <div class="form-group">
            <label class="form-label">姓名 *</label>
            <input v-model="currentAcademic.academic_name" type="text" class="form-input" placeholder="请输入姓名" />
          </div>

          <div class="form-group">
            <label class="form-label">部门 *</label>
            <input v-model="currentAcademic.department_name" type="text" class="form-input" placeholder="请输入部门" />
          </div>

          <div class="form-group">
            <label class="form-label">职位</label>
            <select v-model="currentAcademic.position" class="form-input">
              <option value="">请选择职位</option>
              <option value="教务处主任">教务处主任</option>
              <option value="教务处副主任">教务处副主任</option>
              <option value="教务员">教务员</option>
              <option value="教学秘书">教学秘书</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">入职日期</label>
            <input v-model="currentAcademic.hire_date" type="date" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input v-model="currentAcademic.email" type="email" class="form-input" placeholder="请输入邮箱" />
          </div>

          <div class="form-group">
            <label class="form-label">电话</label>
            <input v-model="currentAcademic.phone" type="tel" class="form-input" placeholder="请输入电话" />
          </div>

          <div class="form-group">
            <label class="form-label">权限</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :checked="currentAcademic.permissions?.includes('排课管理')"
                  @change="
                    (e) => {
                      const target = e.target as HTMLInputElement
                      if (target.checked) {
                        currentAcademic.permissions = [...(currentAcademic.permissions || []), '排课管理']
                      } else {
                        currentAcademic.permissions = currentAcademic.permissions?.filter((p) => p !== '排课管理') || []
                      }
                    }
                  "
                />
                <span>排课管理</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :checked="currentAcademic.permissions?.includes('课程管理')"
                  @change="
                    (e) => {
                      const target = e.target as HTMLInputElement
                      if (target.checked) {
                        currentAcademic.permissions = [...(currentAcademic.permissions || []), '课程管理']
                      } else {
                        currentAcademic.permissions = currentAcademic.permissions?.filter((p) => p !== '课程管理') || []
                      }
                    }
                  "
                />
                <span>课程管理</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :checked="currentAcademic.permissions?.includes('教师管理')"
                  @change="
                    (e) => {
                      const target = e.target as HTMLInputElement
                      if (target.checked) {
                        currentAcademic.permissions = [...(currentAcademic.permissions || []), '教师管理']
                      } else {
                        currentAcademic.permissions = currentAcademic.permissions?.filter((p) => p !== '教师管理') || []
                      }
                    }
                  "
                />
                <span>教师管理</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :checked="currentAcademic.permissions?.includes('教室管理')"
                  @change="
                    (e) => {
                      const target = e.target as HTMLInputElement
                      if (target.checked) {
                        currentAcademic.permissions = [...(currentAcademic.permissions || []), '教室管理']
                      } else {
                        currentAcademic.permissions = currentAcademic.permissions?.filter((p) => p !== '教室管理') || []
                      }
                    }
                  "
                />
                <span>教室管理</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :checked="currentAcademic.permissions?.includes('班级管理')"
                  @change="
                    (e) => {
                      const target = e.target as HTMLInputElement
                      if (target.checked) {
                        currentAcademic.permissions = [...(currentAcademic.permissions || []), '班级管理']
                      } else {
                        currentAcademic.permissions = currentAcademic.permissions?.filter((p) => p !== '班级管理') || []
                      }
                    }
                  "
                />
                <span>班级管理</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">状态</label>
            <label class="checkbox-label">
              <input v-model="currentAcademic.is_active" type="checkbox" />
              <span>在职</span>
            </label>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveAcademic">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.academic-management {
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

/* 教务管理员卡片网格 */
.academic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.academic-card {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.academic-card:hover {
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

.academic-avatar {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.academic-info {
  flex: 1;
}

.academic-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.academic-position {
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

.permissions-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.permissions-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.permission-tag {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  background: rgba(233, 30, 99, 0.15);
  border: 1px solid rgba(233, 30, 99, 0.3);
  border-radius: 20px;
  font-size: 0.85rem;
  color: #e91e63;
  font-weight: 500;
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

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffffff;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
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

  .academic-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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

  .academic-grid {
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
