<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getTeachingClassClassPage,
  addTeachingClassClass,
  deleteTeachingClassClass,
} from '@/api/teachingClassClass'
import { getTeachingClassPage } from '@/api/teachingClass'
import { getClassPage } from '@/api/class'
import { getMajorPage } from '@/api/major'
import { getDepartmentPage } from '@/api/department'
import type {
  TeachingClassClassInfoDTO,
  TeachingClassInfoDTO,
  ClassInfoDTO,
  MajorInfoDTO,
  AddTeachingClassClassVO,
} from '@/api/types'
import { useMessage } from '@/composables/useMessage'
import { useUserStore } from '@/stores/user'
import { UserType } from '@/api/types'

const router = useRouter()
const { success, error } = useMessage()
const userStore = useUserStore()

// 权限控制：只有 SYSTEM_ADMIN 和 ACADEMIC_ADMIN 可以管理关联
const canManageRelations = computed(() => {
  return userStore.userType === UserType.SYSTEM_ADMIN || userStore.userType === UserType.ACADEMIC_ADMIN
})

// 响应式数据
const relations = ref<TeachingClassClassInfoDTO[]>([])
const teachingClasses = ref<TeachingClassInfoDTO[]>([])
const classes = ref<ClassInfoDTO[]>([])
const majors = ref<MajorInfoDTO[]>([])
const departments = ref<{ department_uuid: string; department_name: string }[]>([])
const loading = ref(false)
const teachingClassesLoading = ref(false)
const classesLoading = ref(false)
const majorsLoading = ref(false)
const departmentsLoading = ref(false)

// 筛选条件
const filterTeachingClass = ref<string>('')
const filterClass = ref<string>('')
const filterDepartment = ref<string>('')
const filterMajor = ref<string>('')

// 对话框相关
const showDialog = ref(false)

// 对话框中的级联选择
const dialogDepartment = ref<string>('')
const dialogMajor = ref<string>('')

// 分页数据
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

// 当前添加的关联
const currentRelation = ref<AddTeachingClassClassVO>({
  teaching_class_uuid: '',
  class_uuid: '',
})

// 根据选中的专业，过滤班级下拉框选项
const filteredClasses = computed(() => {
  if (!dialogMajor.value) return classes.value
  return classes.value.filter(c => c.major_info.major_uuid === dialogMajor.value)
})

// 根据选中的学院，过滤专业下拉框选项（对话框）
const filteredMajorsForDialog = computed(() => {
  if (!dialogDepartment.value) return majors.value
  return majors.value.filter(m => m.department_uuid === dialogDepartment.value)
})

// 根据筛选学院，过滤专业下拉框选项（筛选区域）
const filteredMajorsForFilter = computed(() => {
  if (!filterDepartment.value) return majors.value
  return majors.value.filter(m => m.department_uuid === filterDepartment.value)
})

// 根据筛选专业，过滤班级下拉框选项（筛选区域）
const filteredClassesForFilter = computed(() => {
  if (!filterMajor.value) return classes.value
  return classes.value.filter(c => c.major_info.major_uuid === filterMajor.value)
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

// 获取专业列表（用于筛选和对话框）
const fetchMajors = async (departmentUuid?: string) => {
  majorsLoading.value = true
  try {
    const response = await getMajorPage({
      page: 1,
      size: 1000,
      department_uuid: departmentUuid,
    })
    majors.value = response.records
  } catch (err) {
    console.error('获取专业列表失败:', err)
    error('获取专业列表失败: ' + (err as Error).message)
  } finally {
    majorsLoading.value = false
  }
}

// 获取班级列表（用于筛选和对话框）
const fetchClasses = async (params?: { class_name?: string; major_uuid?: string; department_uuid?: string }) => {
  classesLoading.value = true
  try {
    const response = await getClassPage({
      page: 1,
      size: 1000,
      ...params,
    })
    classes.value = response.records
  } catch (err) {
    console.error('获取班级列表失败:', err)
    error('获取班级列表失败: ' + (err as Error).message)
  } finally {
    classesLoading.value = false
  }
}

// 获取教学班列表（用于筛选和对话框）
const fetchTeachingClasses = async () => {
  teachingClassesLoading.value = true
  try {
    const response = await getTeachingClassPage({
      page: 1,
      size: 1000,
    })
    teachingClasses.value = response.records
  } catch (err) {
    console.error('获取教学班列表失败:', err)
    error('获取教学班列表失败: ' + (err as Error).message)
  } finally {
    teachingClassesLoading.value = false
  }
}

// 获取关联列表
const fetchRelations = async (params?: { teaching_class_uuid?: string; class_uuid?: string }) => {
  loading.value = true
  try {
    const response = await getTeachingClassClassPage({
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

// 监听教学班筛选
watch(filterTeachingClass, (newTeachingClassUuid) => {
  fetchRelations({
    teaching_class_uuid: newTeachingClassUuid || undefined,
    class_uuid: filterClass.value || undefined,
  })
})

// 监听班级筛选
watch(filterClass, (newClassUuid) => {
  fetchRelations({
    teaching_class_uuid: filterTeachingClass.value || undefined,
    class_uuid: newClassUuid || undefined,
  })
})

// 监听学院筛选（筛选区域）
watch(filterDepartment, (newDeptUuid) => {
  filterMajor.value = ''
  filterClass.value = ''
  if (newDeptUuid) {
    fetchMajors(newDeptUuid)
  }
  // 不自动刷新关联列表，因为学院改变不影响关联查询
})

// 监听专业筛选（筛选区域）
watch(filterMajor, (newMajorUuid) => {
  filterClass.value = ''
  if (newMajorUuid) {
    fetchClasses({ major_uuid: newMajorUuid })
  }
  // 不自动刷新关联列表，因为专业改变不影响关联查询
})

// 监听对话框中的学院选择
watch(dialogDepartment, (newDeptUuid, oldDeptUuid) => {
  if (newDeptUuid !== oldDeptUuid) {
    dialogMajor.value = ''
    currentRelation.value.class_uuid = ''
  }
  if (newDeptUuid) {
    fetchMajors(newDeptUuid)
  }
})

// 监听对话框中的专业选择
watch(dialogMajor, (newMajorUuid, oldMajorUuid) => {
  if (newMajorUuid !== oldMajorUuid) {
    currentRelation.value.class_uuid = ''
  }
  if (newMajorUuid) {
    fetchClasses({ major_uuid: newMajorUuid })
  }
})

// 打开添加对话框
const openAddDialog = () => {
  currentRelation.value = {
    teaching_class_uuid: '',
    class_uuid: '',
  }
  dialogDepartment.value = ''
  dialogMajor.value = ''
  showDialog.value = true
}

// 保存关联
const saveRelation = async () => {
  // 表单验证
  if (!currentRelation.value.teaching_class_uuid) {
    error('请选择教学班')
    return
  }
  if (!currentRelation.value.class_uuid) {
    error('请选择行政班')
    return
  }

  try {
    await addTeachingClassClass(currentRelation.value)
    success('添加关联成功')
    showDialog.value = false
    await fetchRelations({
      teaching_class_uuid: filterTeachingClass.value || undefined,
      class_uuid: filterClass.value || undefined,
    })
  } catch (err) {
    console.error('添加关联失败:', err)
    error('添加关联失败: ' + (err as Error).message)
  }
}

// 删除关联
const deleteRelation = async (item: TeachingClassClassInfoDTO) => {
  if (!confirm(`确定要删除「${item.teaching_class_name} - ${item.class_name}」的关联吗？`)) return

  try {
    await deleteTeachingClassClass(item.teaching_class_class_uuid)
    success('删除关联成功')
    await fetchRelations({
      teaching_class_uuid: filterTeachingClass.value || undefined,
      class_uuid: filterClass.value || undefined,
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
  await fetchDepartments()
  await fetchMajors()
  await fetchClasses()
  await fetchTeachingClasses()
  await fetchRelations()
})
</script>

<template>
  <div class="teaching-class-class-management">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">🔗</span>
          <span class="logo-text">教学班-行政班关联管理</span>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="filter-group">
          <select v-model="filterTeachingClass" class="filter-select" :disabled="teachingClassesLoading">
            <option value="">全部教学班</option>
            <option v-for="tc in teachingClasses" :key="tc.teachingClassUuid" :value="tc.teachingClassUuid">
              {{ tc.teachingClassName }} - {{ tc.courseName }}
            </option>
          </select>

          <select v-model="filterDepartment" class="filter-select" :disabled="departmentsLoading">
            <option value="">全部学院</option>
            <option v-for="dept in departments" :key="dept.department_uuid" :value="dept.department_uuid">
              {{ dept.department_name }}
            </option>
          </select>

          <select v-model="filterMajor" class="filter-select" :disabled="majorsLoading || !filterDepartment">
            <option value="">全部专业</option>
            <option v-for="major in filteredMajorsForFilter" :key="major.major_uuid" :value="major.major_uuid">
              {{ major.major_name }}
            </option>
          </select>

          <select v-model="filterClass" class="filter-select" :disabled="classesLoading || !filterMajor">
            <option value="">全部班级</option>
            <option v-for="cls in filteredClassesForFilter" :key="cls.class_uuid" :value="cls.class_uuid">
              {{ cls.class_name }}
            </option>
          </select>
        </div>

        <button v-if="canManageRelations" class="btn-primary" @click="openAddDialog">
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
        <p v-if="canManageRelations">点击"添加关联"按钮添加第一个关联</p>
      </div>

      <!-- 数据表格 -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>教学班名称</th>
              <th>课程</th>
              <th>教师</th>
              <th>行政班</th>
              <th>专业</th>
              <th>学院</th>
              <th v-if="canManageRelations">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in relations" :key="item.teaching_class_class_uuid">
              <td>{{ index + 1 }}</td>
              <td>{{ item.teaching_class_name }}</td>
              <td>{{ item.course_name }}</td>
              <td>{{ item.teacher_name }}</td>
              <td>{{ item.class_name }}</td>
              <td>{{ item.major_name }}</td>
              <td>{{ item.department_name }}</td>
              <td v-if="canManageRelations">
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
            <label>教学班</label>
            <select v-model="currentRelation.teaching_class_uuid" class="form-select">
              <option value="">请选择教学班</option>
              <option v-for="tc in teachingClasses" :key="tc.teachingClassUuid" :value="tc.teachingClassUuid">
                {{ tc.teachingClassName }} - {{ tc.courseName }} - {{ tc.teacherName }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>所属学院</label>
            <select v-model="dialogDepartment" class="form-select">
              <option value="">请选择学院</option>
              <option v-for="dept in departments" :key="dept.department_uuid" :value="dept.department_uuid">
                {{ dept.department_name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>所属专业</label>
            <select v-model="dialogMajor" class="form-select" :disabled="!dialogDepartment">
              <option value="">请选择专业</option>
              <option v-for="major in filteredMajorsForDialog" :key="major.major_uuid" :value="major.major_uuid">
                {{ major.major_name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>行政班</label>
            <select v-model="currentRelation.class_uuid" class="form-select" :disabled="!dialogMajor">
              <option value="">请选择行政班</option>
              <option v-for="cls in filteredClasses" :key="cls.class_uuid" :value="cls.class_uuid">
                {{ cls.class_name }}
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
.teaching-class-class-management {
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
  flex-wrap: wrap;
  justify-content: space-between;
}

.filter-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* 筛选下拉框 */
.filter-select {
  min-width: 180px;
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.95rem;
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
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
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
  white-space: nowrap;
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

.form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    justify-content: flex-start;
  }

  .filter-select {
    min-width: 160px;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
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

  .filter-group {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }

  .dialog {
    width: 95%;
    margin: 1rem;
  }
}
</style>
