<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAcademicAdminPage, addAcademicAdmin, updateAcademicAdmin, deleteAcademicAdmin as deleteAcademicAdminApi } from '@/api/academicAdmin'
import { getDepartmentPage } from '@/api/department'
import type { AcademicAdminInfoDTO, AddAcademicAdminVO, AcademicAdminPageQuery } from '@/api/types'
import { useMessage } from '@/composables/useMessage'

const router = useRouter()
const { success, error } = useMessage()

// 响应式数据
const academics = ref<AcademicAdminInfoDTO[]>([])
const departments = ref<{ department_uuid: string; department_name: string }[]>([])
const loading = ref(false)
const departmentsLoading = ref(false)
const searchKeyword = ref('')
const filterDepartment = ref<string>('')
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const confirmPassword = ref('')

// 分页数据
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

// 当前编辑的教务管理员
const formData = ref<AddAcademicAdminVO>({
  academic_uuid: '',
  academic_num: '',
  academic_name: '',
  department_uuid: '',
  academic_password: '',
})

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

// 获取教务管理员列表
const fetchAcademics = async (params?: Partial<AcademicAdminPageQuery>) => {
  loading.value = true
  try {
    const response = await getAcademicAdminPage({
      page: currentPage.value,
      size: pageSize.value,
      ...params,
    })
    academics.value = response.records
    total.value = response.total
  } catch (err) {
    console.error('获取教务管理员列表失败:', err)
    error('获取教务管理员列表失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 计算属性：显示的教务管理员列表
const displayAcademics = computed(() => academics.value)

// 搜索防抖
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchKeyword, (newKeyword) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    if (newKeyword) {
      // 智能判断：数字优先按工号搜索，中文按姓名搜索
      const hasAlphaNumeric = /[a-zA-Z0-9]/.test(newKeyword)

      fetchAcademics(
        hasAlphaNumeric
          ? { academic_num: newKeyword, department_uuid: filterDepartment.value || undefined }
          : { academic_name: newKeyword, department_uuid: filterDepartment.value || undefined }
      )
    } else {
      // 清空搜索时重新加载全部数据
      fetchAcademics({ department_uuid: filterDepartment.value || undefined })
    }
  }, 500)
})

// 监听学院筛选
watch(filterDepartment, (newDeptUuid) => {
  fetchAcademics({
    academic_name: searchKeyword.value || undefined,
    department_uuid: newDeptUuid || undefined,
  })
})

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  formData.value = {
    academic_uuid: '',
    academic_num: '',
    academic_name: '',
    department_uuid: '',
    academic_password: '',
  }
  confirmPassword.value = ''
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (academic: AcademicAdminInfoDTO) => {
  dialogMode.value = 'edit'
  formData.value = {
    academic_uuid: academic.academic_uuid || '',
    academic_num: academic.academic_num || '',
    academic_name: academic.academic_name || '',
    department_uuid: academic.department_info?.department_uuid || '',
    academic_password: '',
  }
  confirmPassword.value = ''
  showDialog.value = true
}

// 保存教务管理员
const saveAcademic = async () => {
  // 表单验证
  if (!formData.value.academic_num.trim()) {
    error('请输入教务工号')
    return
  }
  if (!formData.value.academic_name.trim()) {
    error('请输入教务名称')
    return
  }
  if (!formData.value.department_uuid) {
    error('请选择所属学院')
    return
  }
  if (dialogMode.value === 'add' && !formData.value.academic_password?.trim()) {
    error('请输入密码')
    return
  }
  if (dialogMode.value === 'add' && formData.value.academic_password !== confirmPassword.value) {
    error('两次输入的密码不一致')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      await addAcademicAdmin(formData.value)
      success('添加教务管理员成功')
    } else {
      await updateAcademicAdmin(formData.value)
      success('更新教务管理员成功')
    }
    showDialog.value = false
    await fetchAcademics()
  } catch (err) {
    console.error('保存教务管理员失败:', err)
    error('保存教务管理员失败: ' + (err as Error).message)
  }
}

// 删除教务管理员
const deleteAcademic = async (academic_uuid: string, academic_name: string) => {
  if (!confirm(`确定要删除教务管理员"${academic_name}"吗？`)) return

  try {
    await deleteAcademicAdminApi(academic_uuid)
    success('删除教务管理员成功')
    await fetchAcademics()
  } catch (err) {
    console.error('删除教务管理员失败:', err)
    error('删除教务管理员失败: ' + (err as Error).message)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 初始化
onMounted(() => {
  fetchDepartments()
  fetchAcademics()
})
</script>

<template>
  <div class="academic-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">📋</span>
          <span class="logo-text">教务管理员管理</span>
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
            placeholder="搜索教务管理员姓名、工号..."
            class="search-input"
          />
        </div>
        <select v-model="filterDepartment" class="filter-select">
          <option value="">所有学院</option>
          <option v-for="dept in departments" :key="dept.department_uuid" :value="dept.department_uuid">
            {{ dept.department_name }}
          </option>
        </select>
        <button class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加教务管理员
        </button>
      </div>

      <!-- 教务管理员列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="displayAcademics.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无教务管理员数据</h3>
        <p>点击"添加教务管理员"按钮添加第一位教务管理员</p>
      </div>

      <div v-else class="academic-grid">
        <div v-for="academic in displayAcademics" :key="academic.academic_uuid" class="academic-card">
          <div class="card-header">
            <div class="academic-avatar">
              {{ academic.academic_name ? academic.academic_name.charAt(0) : '?' }}
            </div>
            <div class="academic-info">
              <h3 class="academic-name">{{ academic.academic_name || '未知' }}</h3>
              <p class="academic-num">{{ academic.academic_num || '-' }}</p>
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="info-label">工号</span>
              <span class="info-value">{{ academic.academic_num || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">所属学院</span>
              <span class="info-value">{{ academic.department_info?.department_name || '-' }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-edit" @click="openEditDialog(academic)">
              <span class="btn-icon">✏️</span>
              编辑
            </button>
            <button class="btn-delete" @click="deleteAcademic(academic.academic_uuid, academic.academic_name || '教务管理员')">
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
          <h2>{{ dialogMode === 'add' ? '添加教务管理员' : '编辑教务管理员' }}</h2>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">教务工号 *</label>
            <input
              v-model="formData.academic_num"
              type="text"
              class="form-input"
              placeholder="请输入教务工号"
              :disabled="dialogMode === 'edit'"
            />
          </div>

          <div class="form-group">
            <label class="form-label">教务名称 *</label>
            <input v-model="formData.academic_name" type="text" class="form-input" placeholder="请输入教务名称" />
          </div>

          <div class="form-group">
            <label class="form-label">所属学院 *</label>
            <select v-model="formData.department_uuid" class="form-input">
              <option value="">请选择学院</option>
              <option v-for="dept in departments" :key="dept.department_uuid" :value="dept.department_uuid">
                {{ dept.department_name }}
              </option>
            </select>
          </div>

          <div v-if="dialogMode === 'add'" class="form-group">
            <label class="form-label">密码 *</label>
            <input v-model="formData.academic_password" type="password" class="form-input" placeholder="请输入密码" />
          </div>

          <div v-if="dialogMode === 'add'" class="form-group">
            <label class="form-label">确认密码 *</label>
            <input v-model="confirmPassword" type="password" class="form-input" placeholder="请再次输入密码" />
          </div>

          <div v-if="dialogMode === 'edit'" class="form-group">
            <label class="form-label">密码（留空表示不更改）</label>
            <input v-model="formData.academic_password" type="password" class="form-input" placeholder="请输入新密码（可选）" />
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

.filter-select {
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:hover {
  border-color: rgba(0, 212, 255, 0.3);
}

.filter-select:focus {
  outline: none;
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
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
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.academic-card {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
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
}

.academic-avatar {
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

.academic-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.academic-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  margin-bottom: 0.25rem;
}

.academic-num {
  font-size: 0.95rem;
  color: #a0aec0;
  margin: 0;
}

.card-body {
  padding: 1.5rem;
  flex: 1;
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
  font-weight: 500;
}

.info-value {
  color: #ffffff;
  font-weight: 600;
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
  background: rgba(15, 15, 26, 0.5);
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
  box-sizing: border-box;
}

.form-input:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.form-input:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-input option {
  background: #1a1a2e;
  color: #ffffff;
}

.dialog-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 15, 26, 0.3);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .navbar-content,
  .main-content {
    padding: 1rem 2rem;
  }

  .academic-grid {
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
    gap: 0.75rem;
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
