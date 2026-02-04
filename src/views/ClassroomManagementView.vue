<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getClassroomPage, addClassroom, updateClassroom, deleteClassroom as deleteClassroomApi } from '@/api/classroom'
import { getBuildingPage } from '@/api/building'
import { getClassroomTypePage } from '@/api/classroomType'
import type { ClassroomInfoDTO, BuildingInfoDTO, ClassroomTypeInfoDTO } from '@/api/types'
import { useMessage } from '@/composables/useMessage'

const router = useRouter()
const { success, error } = useMessage()

// 教室数据类型定义
interface Classroom extends ClassroomInfoDTO {}

// 教学楼列表
const buildings = ref<BuildingInfoDTO[]>([])
// 教室类型列表
const classroomTypes = ref<ClassroomTypeInfoDTO[]>([])

// 响应式数据
const classrooms = ref<Classroom[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const selectedBuildingUuid = ref<string>('') // 选中的教学楼UUID

// 当前编辑的教室
const currentClassroom = ref<Omit<Classroom, 'classroom_uuid'> & { classroom_uuid?: string; building_uuid?: string; classroom_type_uuid?: string }>({
  classroom_uuid: '',
  building_name: '',
  classroom_name: '',
  capacity: 0,
  type_name: '',
  type_description: '',
  building_uuid: '',
  classroom_type_uuid: '',
})

// 计算属性：显示的教室列表
const displayClassrooms = computed(() => {
  if (!searchKeyword.value) return classrooms.value
  const keyword = searchKeyword.value.toLowerCase()
  return classrooms.value.filter(
    (classroom) =>
      classroom.classroom_name.toLowerCase().includes(keyword) ||
      classroom.building_name.toLowerCase().includes(keyword) ||
      classroom.type_name.toLowerCase().includes(keyword),
  )
})

// 获取教学楼列表
const fetchBuildings = async () => {
  try {
    const response = await getBuildingPage({
      page: 1,
      size: 100,
    })
    buildings.value = response.records
  } catch (err) {
    console.error('获取教学楼列表失败:', err)
  }
}

// 获取教室类型列表
const fetchClassroomTypes = async () => {
  try {
    const response = await getClassroomTypePage({
      page: 1,
      size: 100,
    })
    classroomTypes.value = response.records
  } catch (err) {
    console.error('获取教室类型列表失败:', err)
  }
}

// 获取教室列表
const fetchClassrooms = async () => {
  loading.value = true
  try {
    const response = await getClassroomPage({
      page: 1,
      size: 1000,
      building_uuid: selectedBuildingUuid.value || undefined,
    })
    classrooms.value = response.records
  } catch (err) {
    console.error('获取教室列表失败:', err)
    error('获取教室列表失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  currentClassroom.value = {
    building_name: '',
    classroom_name: '',
    capacity: 0,
    type_name: '',
    type_description: '',
    building_uuid: '',
    classroom_type_uuid: '',
  }
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (classroom: Classroom) => {
  dialogMode.value = 'edit'
  currentClassroom.value = { ...classroom }

  // 通过 buildingName 查找对应的 buildingUuid
  const building = buildings.value.find(b => b.building_name === classroom.building_name)
  if (building) {
    currentClassroom.value.building_uuid = building.building_uuid
  }

  // 通过 typeName 查找对应的 classroomTypeUuid
  const classroomType = classroomTypes.value.find(t => t.type_name === classroom.type_name)
  if (classroomType) {
    currentClassroom.value.classroom_type_uuid = classroomType.classroom_type_uuid
  }

  showDialog.value = true
}

// 保存教室
const saveClassroom = async () => {
  // 验证表单
  if (!currentClassroom.value.building_uuid) {
    error('请选择教学楼')
    return
  }
  if (!currentClassroom.value.classroom_name.trim()) {
    error('请输入教室名称')
    return
  }
  if (!currentClassroom.value.capacity || currentClassroom.value.capacity <= 0) {
    error('请输入有效的教室容量')
    return
  }
  if (!currentClassroom.value.classroom_type_uuid) {
    error('请选择教室类型')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      // 添加教室
      await addClassroom({
        building_uuid: currentClassroom.value.building_uuid,
        classroom_name: currentClassroom.value.classroom_name,
        capacity: currentClassroom.value.capacity,
        classroom_type_uuid: currentClassroom.value.classroom_type_uuid,
      })
      success('添加教室成功')
    } else {
      // 更新教室
      if (!currentClassroom.value.classroom_uuid) {
        error('教室UUID不能为空')
        return
      }
      await updateClassroom({
        classroom_uuid: currentClassroom.value.classroom_uuid,
        building_uuid: currentClassroom.value.building_uuid,
        classroom_name: currentClassroom.value.classroom_name,
        classroom_capacity: currentClassroom.value.capacity,
        classroom_type_uuid: currentClassroom.value.classroom_type_uuid,
      })
      success('更新教室成功')
    }
    showDialog.value = false
    await fetchClassrooms()
  } catch (err) {
    console.error('保存教室失败:', err)
    error('保存教室失败: ' + (err as Error).message)
  }
}

// 删除教室
const deleteClassroom = async (classroom_uuid: string) => {
  if (!confirm('确定要删除该教室吗？')) return

  try {
    await deleteClassroomApi(classroom_uuid)
    success('删除教室成功')
    await fetchClassrooms()
  } catch (err) {
    console.error('删除教室失败:', err)
    error('删除教室失败: ' + (err as Error).message)
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 页面加载时获取数据
onMounted(() => {
  fetchBuildings()
  fetchClassroomTypes()
  fetchClassrooms()
})
</script>

<template>
  <div class="classroom-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">🏫</span>
          <span class="logo-text">教室管理</span>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 操作栏 -->
      <div class="action-bar">
        <select v-model="selectedBuildingUuid" @change="fetchClassrooms" class="building-filter">
          <option value="">所有教学楼</option>
          <option v-for="building in buildings" :key="building.building_uuid" :value="building.building_uuid">
            {{ building.building_name }}
          </option>
        </select>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索教室名称、教学楼或类型..."
            class="search-input"
          />
        </div>
        <button class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加教室
        </button>
      </div>

      <!-- 教室列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="displayClassrooms.length === 0" class="empty-state">
        <div class="empty-icon">🏫</div>
        <h3>暂无教室数据</h3>
        <p>点击"添加教室"按钮添加第一个教室</p>
      </div>

      <div v-else class="classroom-grid">
        <div v-for="classroom in displayClassrooms" :key="classroom.classroom_uuid" class="classroom-card">
          <div class="card-header">
            <div class="classroom-avatar">
              {{ classroom.classroom_name.charAt(0) }}
            </div>
            <div class="classroom-info">
              <h3 class="classroom-name">{{ classroom.classroom_name }}</h3>
              <p class="classroom-building">{{ classroom.building_name }}</p>
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="info-label">教学楼</span>
              <span class="info-value">{{ classroom.building_name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">教室名称</span>
              <span class="info-value">{{ classroom.classroom_name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">教室容量</span>
              <span class="info-value">{{ classroom.capacity }} 人</span>
            </div>
            <div class="info-row">
              <span class="info-label">教室类型</span>
              <span class="info-value">{{ classroom.type_name }}</span>
            </div>
            <div v-if="classroom.type_description" class="info-row description">
              <span class="info-label">类型描述</span>
              <span class="info-value">{{ classroom.type_description }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-edit" @click="openEditDialog(classroom)">
              <span class="btn-icon">✏️</span>
              编辑
            </button>
            <button class="btn-delete" @click="deleteClassroom(classroom.classroom_uuid)">
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
          <h2>添加教室</h2>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">所属教学楼 *</label>
            <select v-model="currentClassroom.building_uuid" class="form-input">
              <option value="">请选择教学楼</option>
              <option v-for="building in buildings" :key="building.building_uuid" :value="building.building_uuid">
                {{ building.building_name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">教室名称 *</label>
            <input
              v-model="currentClassroom.classroom_name"
              type="text"
              class="form-input"
              placeholder="例如：101教室"
            />
          </div>

          <div class="form-group">
            <label class="form-label">教室容量 *</label>
            <input
              v-model.number="currentClassroom.capacity"
              type="number"
              class="form-input"
              placeholder="例如：50"
              min="1"
            />
          </div>

          <div class="form-group">
            <label class="form-label">教室类型 *</label>
            <select v-model="currentClassroom.classroom_type_uuid" class="form-input" required>
              <option value="">请选择教室类型</option>
              <option v-for="type in classroomTypes" :key="type.classroom_type_uuid" :value="type.classroom_type_uuid">
                {{ type.type_name }}
              </option>
            </select>
            <small class="form-hint">选择教室类型（如：普通教室、多媒体教室、实验室等）</small>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveClassroom">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.classroom-management {
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

.building-filter {
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.building-filter:hover {
  border-color: rgba(0, 212, 255, 0.3);
}

.building-filter:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.building-filter option {
  background: #1a1a2e;
  color: #ffffff;
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

/* 教室卡片网格 */
.classroom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.classroom-card {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(40, 40, 70, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.classroom-card:hover {
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

.classroom-avatar {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #9C27B0 0%, #E91E63 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.classroom-info {
  flex: 1;
}

.classroom-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.classroom-building {
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

.info-row.description {
  flex-direction: column;
  gap: 0.5rem;
}

.info-row.description .info-value {
  text-align: left;
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

  .classroom-grid {
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

  .building-filter {
    width: 100%;
  }

  .search-box {
    width: 100%;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .classroom-grid {
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
