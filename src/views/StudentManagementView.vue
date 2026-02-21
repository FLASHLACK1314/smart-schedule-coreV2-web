<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getStudentPage, addStudent, updateStudent, deleteStudent as deleteStudentApi } from '@/api/student'
import { getClassPage } from '@/api/class'
import { getMajorPage } from '@/api/major'
import { getDepartmentPage } from '@/api/department'
import type { StudentInfoDTO, AddStudentVO, UpdateStudentVO } from '@/api/types'
import type { MajorInfoDTO } from '@/api/types'
import type { ClassInfoDTO } from '@/api/types'
import { useMessage } from '@/composables/useMessage'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const { success, error } = useMessage()
const userStore = useUserStore()

// 权限控制：只有 SYSTEM_ADMIN 和 ACADEMIC_ADMIN 可以管理学生
const canManageStudents = computed(() => {
  const userType = userStore.userType
  return userType === 'SYSTEM_ADMIN' || userType === 'ACADEMIC_ADMIN'
})

// 响应式数据
const students = ref<StudentInfoDTO[]>([])
const majors = ref<MajorInfoDTO[]>([])
const classes = ref<ClassInfoDTO[]>([])
const departments = ref<{ department_uuid: string; department_name: string }[]>([])
const loading = ref(false)
const majorsLoading = ref(false)
const classesLoading = ref(false)
const departmentsLoading = ref(false)

// 筛选条件
const searchStudentId = ref('')
const searchStudentName = ref('')
const filterDepartment = ref<string>('')
const filterMajor = ref<string>('')
const filterClass = ref<string>('')

// 对话框相关
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

// 对话框中的级联选择
const dialogDepartment = ref<string>('')
const dialogMajor = ref<string>('')

// 分页数据
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

// 当前编辑的学生
const formData = ref<AddStudentVO | UpdateStudentVO>({
  student_uuid: '',
  student_id: '',
  student_name: '',
  class_uuid: '',
  student_password: '',
})

// 确认密码（仅用于前端验证）
const confirmPassword = ref('')

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

// 获取学生列表
const fetchStudents = async (params?: {
  student_id?: string
  student_name?: string
  class_uuid?: string
  major_uuid?: string
  department_uuid?: string
}) => {
  loading.value = true
  try {
    const response = await getStudentPage({
      page: currentPage.value,
      size: pageSize.value,
      ...params,
    })
    students.value = response.records
    total.value = response.total
  } catch (err) {
    console.error('获取学生列表失败:', err)
    error('获取学生列表失败: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}

// 搜索防抖 - 学号
let searchIdTimer: ReturnType<typeof setTimeout> | null = null
watch(searchStudentId, (newId) => {
  if (searchIdTimer) {
    clearTimeout(searchIdTimer)
  }
  searchIdTimer = setTimeout(() => {
    fetchStudents({
      student_id: newId || undefined,
      student_name: searchStudentName.value || undefined,
      class_uuid: filterClass.value || undefined,
      major_uuid: filterMajor.value || undefined,
      department_uuid: filterDepartment.value || undefined,
    })
  }, 500)
})

// 搜索防抖 - 姓名
let searchNameTimer: ReturnType<typeof setTimeout> | null = null
watch(searchStudentName, (newName) => {
  if (searchNameTimer) {
    clearTimeout(searchNameTimer)
  }
  searchNameTimer = setTimeout(() => {
    fetchStudents({
      student_id: searchStudentId.value || undefined,
      student_name: newName || undefined,
      class_uuid: filterClass.value || undefined,
      major_uuid: filterMajor.value || undefined,
      department_uuid: filterDepartment.value || undefined,
    })
  }, 500)
})

// 监听学院筛选（筛选区域）
watch(filterDepartment, (newDeptUuid) => {
  filterMajor.value = ''
  filterClass.value = ''
  if (newDeptUuid) {
    fetchMajors(newDeptUuid)
  }
  fetchStudents({
    student_id: searchStudentId.value || undefined,
    student_name: searchStudentName.value || undefined,
    department_uuid: newDeptUuid || undefined,
  })
})

// 监听专业筛选（筛选区域）
watch(filterMajor, (newMajorUuid) => {
  filterClass.value = ''
  fetchStudents({
    student_id: searchStudentId.value || undefined,
    student_name: searchStudentName.value || undefined,
    major_uuid: newMajorUuid || undefined,
    department_uuid: filterDepartment.value || undefined,
  })
})

// 监听班级筛选（筛选区域）
watch(filterClass, (newClassUuid) => {
  fetchStudents({
    student_id: searchStudentId.value || undefined,
    student_name: searchStudentName.value || undefined,
    class_uuid: newClassUuid || undefined,
    major_uuid: filterMajor.value || undefined,
    department_uuid: filterDepartment.value || undefined,
  })
})

// 监听对话框中的学院选择
watch(dialogDepartment, (newDeptUuid, oldDeptUuid) => {
  // 只有当学院真正改变时才清空专业和班级
  if (newDeptUuid !== oldDeptUuid) {
    dialogMajor.value = ''
    formData.value.class_uuid = ''
  }
  if (newDeptUuid) {
    fetchMajors(newDeptUuid)
  }
})

// 监听对话框中的专业选择
watch(dialogMajor, (newMajorUuid, oldMajorUuid) => {
  // 只有当专业真正改变时才清空班级
  if (newMajorUuid !== oldMajorUuid) {
    formData.value.class_uuid = ''
  }
  if (newMajorUuid) {
    fetchClasses({ major_uuid: newMajorUuid })
  }
})

// 打开添加对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  formData.value = {
    student_id: '',
    student_name: '',
    class_uuid: '',
    student_password: '',
  }
  confirmPassword.value = ''
  dialogDepartment.value = ''
  dialogMajor.value = ''
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = async (student: StudentInfoDTO) => {
  dialogMode.value = 'edit'

  // 先记录当前学生的学院和专业（在设置值之前）
  const studentDepartment = student.class_info.major_info.department_uuid
  const studentMajor = student.class_info.major_info.major_uuid
  const studentClass = student.class_info.class_uuid

  // 加载学院数据
  await fetchDepartments()

  // 设置学院并加载该学院的专业
  dialogDepartment.value = studentDepartment
  await fetchMajors(studentDepartment)

  // 设置专业并加载该专业的班级
  dialogMajor.value = studentMajor
  await fetchClasses({ major_uuid: studentMajor })

  // 设置表单数据
  formData.value = {
    student_uuid: student.student_uuid,
    student_id: student.student_id,
    student_name: student.student_name,
    class_uuid: studentClass,
    student_password: '',
  }
  confirmPassword.value = ''
  showDialog.value = true
}

// 密码验证函数
const validatePassword = (password: string): boolean => {
  // 至少 8 位，包含字母和数字
  const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
  return regex.test(password)
}

// 保存学生
const saveStudent = async () => {
  // 表单验证
  if (!formData.value.student_id.trim()) {
    error('请输入学号')
    return
  }
  if (!formData.value.student_name.trim()) {
    error('请输入姓名')
    return
  }
  if (!formData.value.class_uuid) {
    error('请选择班级')
    return
  }

  // 添加模式：密码必填
  if (dialogMode.value === 'add') {
    if (!formData.value.student_password?.trim()) {
      error('请输入密码')
      return
    }
    if (!validatePassword(formData.value.student_password)) {
      error('密码必须至少 8 位，且包含字母和数字')
      return
    }
    if (formData.value.student_password !== confirmPassword.value) {
      error('两次输入的密码不一致')
      return
    }
  }

  // 编辑模式：密码选填，但输入时需验证
  if (dialogMode.value === 'edit' && formData.value.student_password?.trim()) {
    if (!validatePassword(formData.value.student_password)) {
      error('新密码必须至少 8 位，且包含字母和数字')
      return
    }
    if (formData.value.student_password !== confirmPassword.value) {
      error('两次输入的密码不一致')
      return
    }
  }

  try {
    if (dialogMode.value === 'add') {
      await addStudent(formData.value as AddStudentVO)
      success('添加学生成功')
    } else {
      const currentData = formData.value as UpdateStudentVO
      const updateData: UpdateStudentVO = {
        student_uuid: currentData.student_uuid,
        student_id: currentData.student_id,
        student_name: currentData.student_name,
        class_uuid: currentData.class_uuid,
      }
      // 如果填写了新密码，则包含在请求中
      if (currentData.student_password?.trim()) {
        updateData.student_password = currentData.student_password
      }
      await updateStudent(updateData)
      success('更新学生成功')
    }
    showDialog.value = false
    await fetchStudents({
      student_id: searchStudentId.value || undefined,
      student_name: searchStudentName.value || undefined,
      class_uuid: filterClass.value || undefined,
      major_uuid: filterMajor.value || undefined,
      department_uuid: filterDepartment.value || undefined,
    })
  } catch (err) {
    console.error('保存学生失败:', err)
    error('保存学生失败: ' + (err as Error).message)
  }
}

// 删除学生
const deleteStudent = async (studentUuid: string, studentName: string) => {
  if (!confirm(`确定要删除学生"${studentName}"吗？`)) return

  try {
    await deleteStudentApi(studentUuid)
    success('删除学生成功')
    await fetchStudents({
      student_id: searchStudentId.value || undefined,
      student_name: searchStudentName.value || undefined,
      class_uuid: filterClass.value || undefined,
      major_uuid: filterMajor.value || undefined,
      department_uuid: filterDepartment.value || undefined,
    })
  } catch (err) {
    console.error('删除学生失败:', err)
    error('删除学生失败: ' + (err as Error).message)
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
  await fetchStudents()
})
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
        <div class="search-group">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchStudentId"
              type="text"
              placeholder="学号（精确匹配）"
              class="search-input"
            />
          </div>
          <div class="search-box">
            <span class="search-icon">👤</span>
            <input
              v-model="searchStudentName"
              type="text"
              placeholder="姓名（模糊匹配）"
              class="search-input"
            />
          </div>
        </div>

        <div class="filter-group">
          <select v-model="filterDepartment" class="filter-select" :disabled="departmentsLoading">
            <option value="">全部学院</option>
            <option v-for="dept in departments" :key="dept.department_uuid" :value="dept.department_uuid">
              {{ dept.department_name }}
            </option>
          </select>

          <select v-model="filterMajor" class="filter-select" :disabled="majorsLoading || !filterDepartment">
            <option value="">全部专业</option>
            <option v-for="major in majors.filter(m => !filterDepartment || m.department_uuid === filterDepartment)" :key="major.major_uuid" :value="major.major_uuid">
              {{ major.major_name }}
            </option>
          </select>

          <select v-model="filterClass" class="filter-select" :disabled="classesLoading || !filterMajor">
            <option value="">全部班级</option>
            <option v-for="cls in classes.filter(c => !filterMajor || c.major_info.major_uuid === filterMajor)" :key="cls.class_uuid" :value="cls.class_uuid">
              {{ cls.class_name }}
            </option>
          </select>
        </div>

        <button v-if="canManageStudents" class="btn-primary" @click="openAddDialog">
          <span class="btn-icon">➕</span>
          添加学生
        </button>
      </div>

      <!-- 学生列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="students.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无学生数据</h3>
        <p v-if="canManageStudents">点击"添加学生"按钮添加第一位学生</p>
      </div>

      <!-- 数据表格 -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>学号</th>
              <th>姓名</th>
              <th>学院</th>
              <th>专业</th>
              <th>班级</th>
              <th v-if="canManageStudents">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.student_uuid">
              <td>{{ student.student_id }}</td>
              <td>{{ student.student_name }}</td>
              <td>{{ student.class_info.major_info.department_name }}</td>
              <td>{{ student.class_info.major_info.major_name }}</td>
              <td>{{ student.class_info.class_name }}</td>
              <td v-if="canManageStudents">
                <div class="action-buttons">
                  <button class="btn-edit" @click="openEditDialog(student)">编辑</button>
                  <button class="btn-delete" @click="deleteStudent(student.student_uuid, student.student_name)">
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="showDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '添加学生' : '编辑学生' }}</h3>
          <button class="dialog-close" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>学号 *</label>
            <input
              v-model="formData.student_id"
              type="text"
              class="form-input"
              placeholder="请输入学号"
              :disabled="dialogMode === 'edit'"
            />
            <small v-if="dialogMode === 'edit'" class="form-hint">学号不可修改</small>
          </div>

          <div class="form-group">
            <label>姓名 *</label>
            <input v-model="formData.student_name" type="text" class="form-input" placeholder="请输入姓名" />
          </div>

          <div class="form-group">
            <label>所属学院 *</label>
            <select v-model="dialogDepartment" class="form-select">
              <option value="">请选择学院</option>
              <option v-for="dept in departments" :key="dept.department_uuid" :value="dept.department_uuid">
                {{ dept.department_name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>所属专业 *</label>
            <select v-model="dialogMajor" class="form-select" :disabled="!dialogDepartment">
              <option value="">请选择专业</option>
              <option v-for="major in filteredMajorsForDialog" :key="major.major_uuid" :value="major.major_uuid">
                {{ major.major_name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>所属班级 *</label>
            <select v-model="formData.class_uuid" class="form-select" :disabled="!dialogMajor">
              <option value="">请选择班级</option>
              <option v-for="cls in filteredClasses" :key="cls.class_uuid" :value="cls.class_uuid">
                {{ cls.class_name }}
              </option>
            </select>
          </div>

          <div v-if="dialogMode === 'add'" class="form-group">
            <label>密码 *</label>
            <input v-model="formData.student_password" type="password" class="form-input" placeholder="请输入密码" />
            <small class="form-hint">至少 8 位，包含字母和数字</small>
          </div>

          <div v-if="dialogMode === 'add' || (dialogMode === 'edit' && formData.student_password)" class="form-group">
            <label>{{ dialogMode === 'add' ? '确认密码 *' : '确认新密码' }}</label>
            <input v-model="confirmPassword" type="password" class="form-input" :placeholder="dialogMode === 'add' ? '请再次输入密码' : '留空则不更新密码'" />
          </div>

          <div v-if="dialogMode === 'edit' && !formData.student_password" class="form-group">
            <label>新密码</label>
            <input v-model="formData.student_password" type="password" class="form-input" placeholder="留空则不更新密码" />
            <small class="form-hint">如需修改密码请输入新密码，留空则不更新</small>
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
  flex-wrap: wrap;
}

.search-group {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-width: 400px;
}

.filter-group {
  display: flex;
  gap: 0.75rem;
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
  min-width: 200px;
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

/* 筛选下拉框 */
.filter-select {
  min-width: 160px;
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

.form-hint {
  display: block;
  color: #a0aec0;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.form-input,
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

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
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

  .action-bar {
    flex-wrap: wrap;
  }

  .search-group {
    min-width: 300px;
  }

  .filter-select {
    min-width: 140px;
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

  .search-group {
    flex-direction: column;
    min-width: unset;
  }

  .filter-group {
    flex-direction: column;
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

  .action-buttons {
    flex-direction: column;
  }

  .dialog {
    width: 95%;
    margin: 1rem;
  }
}
</style>
