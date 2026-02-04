<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getBuildingPage, addBuilding, updateBuilding, deleteBuilding as deleteBuildingApi } from '@/api/building'
import type { BuildingInfoDTO } from '@/api/types'
import { useMessage } from '@/composables/useMessage'

const router = useRouter()
const { success, error } = useMessage()

// 教学楼数据类型定义
interface Building extends BuildingInfoDTO {}

// 响应式数据
const buildings = ref<Building[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentPage = ref(1)
const pageSize = ref(100) // 默认获取100条，避免分页
const total = ref(0)

// 当前编辑的教学楼
const currentBuilding = ref<Building>({
  building_uuid: '',
  building_num: '',
  building_name: '',
})

// 计算属性：显示的教学楼列表（直接使用 buildings，因为后端已经处理搜索）
const displayBuildings = computed(() => {
  return buildings.value
})

// 获取教学楼列表
const fetchBuildings = async (searchNum?: string, searchName?: string) => {
  loading.value = true
  try {
    const response = await getBuildingPage({
      page: currentPage.value,
      size: pageSize.value,
      building_num: searchNum,
      building_name: searchName,
    })
    buildings.value = response.records
    total.value = response.total
  } catch (err) {
    console.error('获取教学楼列表失败:', err)
    error('获取教学楼列表失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 监听搜索关键词，使用防抖
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchKeyword, (newKeyword) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    if (newKeyword) {
      // 智能判断：如果输入包含字母或数字，优先搜索编号，否则搜索名称
      // 因为编号通常是 A001、B002 这样的格式
      const hasAlphaNumeric = /[a-zA-Z0-9]/.test(newKeyword)

      if (hasAlphaNumeric) {
        // 包含字母或数字，优先按编号搜索
        fetchBuildings(newKeyword, undefined)
      } else {
        // 纯中文，按名称搜索
        fetchBuildings(undefined, newKeyword)
      }
    } else {
      // 清空搜索时重新加载全部数据
      fetchBuildings()
    }
  }, 500)
})

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  currentBuilding.value = {
    building_uuid: '',
    building_num: '',
    building_name: '',
  }
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (building: Building) => {
  dialogMode.value = 'edit'
  currentBuilding.value = { ...building }
  showDialog.value = true
}

// 保存教学楼
const saveBuilding = async () => {
  // 验证表单
  if (!currentBuilding.value.building_num.trim()) {
    error('请输入教学楼编号')
    return
  }
  if (!currentBuilding.value.building_name.trim()) {
    error('请输入教学楼名称')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      await addBuilding(currentBuilding.value.building_num, currentBuilding.value.building_name)
      success('添加教学楼成功')
    } else {
      await updateBuilding(
        currentBuilding.value.building_uuid,
        currentBuilding.value.building_num,
        currentBuilding.value.building_name
      )
      success('更新教学楼成功')
    }
    showDialog.value = false
    await fetchBuildings()
  } catch (err) {
    console.error('保存教学楼失败:', err)
    error('保存教学楼失败: ' + (err as Error).message)
  }
}

// 删除教学楼
const deleteBuilding = async (building_uuid: string) => {
  if (!confirm('确定要删除该教学楼吗？')) return

  try {
    await deleteBuildingApi(building_uuid)
    success('删除教学楼成功')
    await fetchBuildings()
  } catch (err) {
    console.error('删除教学楼失败:', err)
    error('删除教学楼失败: ' + (err as Error).message)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 页面加载时获取数据
onMounted(() => {
  fetchBuildings()
})
</script>

<template>
  <div class="building-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">🏢</span>
          <span class="logo-text">教学楼管理</span>
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
            placeholder="搜索教学楼名称、编号或位置..."
            class="search-input"
          />
        </div>
        <button class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加教学楼
        </button>
      </div>

      <!-- 教学楼列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="displayBuildings.length === 0" class="empty-state">
        <div class="empty-icon">🏢</div>
        <h3>暂无教学楼数据</h3>
        <p>点击"添加教学楼"按钮添加第一个教学楼</p>
      </div>

      <div v-else class="building-grid">
        <div v-for="building in displayBuildings" :key="building.building_uuid" class="building-card">
          <div class="card-header">
            <div class="building-avatar">
              {{ building.building_name.charAt(0) }}
            </div>
            <div class="building-info">
              <h3 class="building-name">{{ building.building_name }}</h3>
              <p class="building-code">{{ building.building_num }}</p>
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="info-label">教学楼编号</span>
              <span class="info-value">{{ building.building_num }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">教学楼名称</span>
              <span class="info-value">{{ building.building_name }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-edit" @click="openEditDialog(building)">
              <span class="btn-icon">✏️</span>
              编辑
            </button>
            <button class="btn-delete" @click="deleteBuilding(building.building_uuid)">
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
          <h2>{{ dialogMode === 'add' ? '添加教学楼' : '编辑教学楼' }}</h2>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">教学楼编号 *</label>
            <input
              v-model="currentBuilding.building_num"
              type="text"
              class="form-input"
              placeholder="例如：A001"
              :disabled="dialogMode === 'edit'"
            />
            <small v-if="dialogMode === 'edit'" class="form-hint">编号不可修改</small>
          </div>

          <div class="form-group">
            <label class="form-label">教学楼名称 *</label>
            <input
              v-model="currentBuilding.building_name"
              type="text"
              class="form-input"
              placeholder="例如：第一教学楼"
            />
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveBuilding">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.building-management {
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

/* 教学楼卡片网格 */
.building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.building-card {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.building-card:hover {
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

.building-avatar {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FF5722 0%, #FF9800 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.building-info {
  flex: 1;
}

.building-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.building-code {
  font-size: 0.95rem;
  color: #a0aec0;
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

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.form-hint {
  display: block;
  color: #a0aec0;
  font-size: 0.85rem;
  margin-top: 0.25rem;
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

  .building-grid {
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

  .building-grid {
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