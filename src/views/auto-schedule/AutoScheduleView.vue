<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getSemesterPage } from '@/api/semester'
import { executeAutoSchedule, confirmSchedule, clearSchedulePreview, saveSchedulePreview } from '@/api/autoSchedule'
import type { AutoScheduleResult, ScheduleMode, TeacherSelectionStrategy } from '@/api/types'
import { useMessage } from '@/composables/useMessage'
import { useUserStore } from '@/stores/user'
import SearchSelect from '@/components/SearchSelect.vue'
import CourseClassMapper from './components/CourseClassMapper.vue'
import ResourceConfig from './components/ResourceConfig.vue'
import AlgorithmConfig from './components/AlgorithmConfig.vue'
import ResultPreview from './components/ResultPreview.vue'

defineOptions({
  name: 'AutoScheduleView',
})

// 选项类型
interface SelectOption {
  label: string
  value: string
  [key: string]: any
}

// 课程映射项类型
interface CourseMappingItem {
  course_uuid: string
  class_uuids: string[]
  teacher_uuid?: string
}

const router = useRouter()
const { success, error, warning, info } = useMessage()
const userStore = useUserStore()

// 步骤状态：1-选择参数, 2-预览结果, 3-确认成功
const currentStep = ref<1 | 2 | 3>(1)

// 加载状态
const isExecuting = ref(false)

// ========== 步骤1：表单状态 ==========
const selectedSemester = ref<string>('')
const initialSemesterOption = ref<SelectOption | null>(null)

// 课程-行政班映射
const courseMappings = ref<CourseMappingItem[]>([])

// 教师选择策略
const teacherSelectionStrategy = ref<TeacherSelectionStrategy>('balanced')
const showTeacherStrategy = ref(false)

// 排课模式
const scheduleModeType = ref<0 | 1>(0) // 0-预览模式, 1-正式模式

// 资源范围
const buildingUuids = ref<string[]>([])
const classroomTypeUuids = ref<string[]>([])

// 算法参数
const populationSize = ref(100)
const maxGenerations = ref(500)
const crossoverRate = ref(0.8)
const mutationRate = ref(0.2)
const eliteSize = ref(10)

// ========== 步骤2：结果状态 ==========
const scheduleResult = ref<AutoScheduleResult | null>(null)

// 引用子组件
const courseClassMapperRef = ref<InstanceType<typeof CourseClassMapper> | null>(null)

// 权限控制
const canAutoSchedule = computed(() => {
  const userType = userStore.userType
  return userType === 'SYSTEM_ADMIN' || userType === 'ACADEMIC_ADMIN'
})

// 表单验证
const isFormValid = computed(() => {
  if (!selectedSemester.value) return false
  if (courseMappings.value.length === 0) return false
  return courseMappings.value.every(item =>
    item.course_uuid && item.class_uuids && item.class_uuids.length > 0
  )
})

// ========== 数据获取函数 ==========

// 搜索学期选项
const fetchSemesterOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const response = await getSemesterPage({
      page: 1,
      size: 20,
      ...(keyword.trim() ? { semester_name: keyword } : {})
    })
    return response.records.map(semester => ({
      label: semester.semester_name,
      value: semester.semester_uuid,
      semester_name: semester.semester_name
    }))
  } catch (err) {
    console.error('搜索学期失败:', err)
    return []
  }
}

// ========== 事件处理函数 ==========

// 学期变化
const handleSemesterChange = (semesterUuid: string | string[]) => {
  const uuid = typeof semesterUuid === 'string' ? semesterUuid : semesterUuid[0]
  selectedSemester.value = uuid || ''
}

// 执行排课
const handleExecuteSchedule = async () => {
  // 验证
  if (!selectedSemester.value) {
    warning('请选择学期')
    return
  }

  if (courseMappings.value.length === 0) {
    warning('请至少添加一个课程配置')
    return
  }

  // 验证每个配置
  for (const config of courseMappings.value) {
    if (!config.course_uuid) {
      warning('请选择课程')
      return
    }
    if (!config.class_uuids || config.class_uuids.length === 0) {
      warning('请至少选择一个行政班级')
      return
    }
  }

  isExecuting.value = true
  try {
    // 构建请求参数（新版 API 格式）
    const courseClassMapping: Record<string, string[]> = {}
    const teacherAssignment: Record<string, string> = {}

    courseMappings.value.forEach(item => {
      courseClassMapping[item.course_uuid] = item.class_uuids
      if (item.teacher_uuid) {
        teacherAssignment[item.course_uuid] = item.teacher_uuid
      }
    })

    const requestParams = {
      mode: 'ADMIN_CLASS' as ScheduleMode,
      semester_uuid: selectedSemester.value,
      course_class_mapping: courseClassMapping,
      teacher_assignment: Object.keys(teacherAssignment).length > 0 ? teacherAssignment : undefined,
      teacher_selection_strategy: teacherSelectionStrategy.value,
      // 资源范围参数
      building_uuids: buildingUuids.value.length > 0 ? buildingUuids.value : undefined,
      classroom_type_uuids: classroomTypeUuids.value.length > 0 ? classroomTypeUuids.value : undefined,
      // 算法参数
      population_size: populationSize.value,
      max_generations: maxGenerations.value,
      crossover_rate: crossoverRate.value,
      mutation_rate: mutationRate.value,
      elite_size: eliteSize.value,
      // 排课模式
      schedule_mode: scheduleModeType.value,
    }

    const response = await executeAutoSchedule(requestParams)

    // 调试：打印 API 返回的原始数据
    console.log('[AutoScheduleView] API response:', response)
    console.log('[AutoScheduleView] schedule_map:', response.schedule_map)
    console.log('[AutoScheduleView] schedule_map type:', typeof response.schedule_map)
    if (response.schedule_map) {
      const keys = Object.keys(response.schedule_map)
      console.log('[AutoScheduleView] schedule_map keys:', keys)
      const firstKey = keys[0]
      if (firstKey) {
        const firstItem = response.schedule_map[firstKey]
        console.log('[AutoScheduleView] First key:', firstKey)
        console.log('[AutoScheduleView] First item:', firstItem)
        if (Array.isArray(firstItem) && firstItem.length > 0) {
          console.log('[AutoScheduleView] First item detail:', JSON.stringify(firstItem[0], null, 2))
        }
      }
    }

    scheduleResult.value = response
    currentStep.value = 2

    // 根据结果显示不同的消息（兼容 success 和 is_success 两种字段名）
    const isSuccess = response.is_success ?? response.success ?? false
    if (isSuccess) {
      if (response.statistics.scheduled_teaching_classes === response.statistics.total_teaching_classes) {
        success('排课完成！所有教学班已成功排课')
      } else {
        const stats = response.statistics
        warning(`排课部分完成！已排课 ${stats.scheduled_teaching_classes}/${stats.total_teaching_classes} 个教学班`)
      }
    } else {
      error('排课失败！请检查冲突信息后重试')
    }
  } catch (err) {
    console.error('执行排课失败:', err)
    error('执行排课失败: ' + (err as Error).message)
  } finally {
    isExecuting.value = false
  }
}

// 重新排课
const handleReschedule = () => {
  currentStep.value = 1
  scheduleResult.value = null
}

// 清除预览
const handleClearPreview = async () => {
  if (!selectedSemester.value) return

  try {
    await clearSchedulePreview(selectedSemester.value)
    info('预览方案已清除')
    currentStep.value = 1
    scheduleResult.value = null
  } catch (err) {
    console.error('清除预览失败:', err)
    error('清除预览失败: ' + (err as Error).message)
  }
}

// 保存预览
const handleSavePreview = async () => {
  if (!selectedSemester.value || !scheduleResult.value) return

  try {
    await saveSchedulePreview(selectedSemester.value, scheduleResult.value)
    success('预览方案已保存！您可以继续排课其他教学班')
  } catch (err) {
    console.error('保存预览失败:', err)
    error('保存预览失败: ' + (err as Error).message)
  }
}

// 确认方案
const handleConfirmSchedule = async () => {
  if (!selectedSemester.value) return

  try {
    await confirmSchedule(selectedSemester.value)
    success('排课方案已确认生效！')
    currentStep.value = 3
  } catch (err) {
    console.error('确认方案失败:', err)
    error('确认方案失败: ' + (err as Error).message)
  }
}

// 查看课表
const goToTimetable = () => {
  router.push('/timetable-view')
}

// 返回首页
const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="auto-schedule-view">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-logo" @click="goBack">
          <span class="back-icon">←</span>
          <span class="logo-icon">📅</span>
          <span class="logo-text">智能排课</span>
        </div>

        <!-- 步骤指示器 -->
        <div class="steps-indicator">
          <div class="step" :class="{ active: currentStep >= 1, current: currentStep === 1 }">
            <div class="step-number">1</div>
            <div class="step-label">选择参数</div>
          </div>
          <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
          <div class="step" :class="{ active: currentStep >= 2, current: currentStep === 2 }">
            <div class="step-number">2</div>
            <div class="step-label">预览结果</div>
          </div>
          <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
          <div class="step" :class="{ active: currentStep >= 3, current: currentStep === 3 }">
            <div class="step-number">3</div>
            <div class="step-label">确认成功</div>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 步骤1：选择参数 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="content-header">
          <h2 class="content-title">选择排课参数</h2>
          <p class="content-subtitle">按行政班级进行智能排课</p>
        </div>

        <div class="parameter-section">
          <!-- 学期选择 -->
          <div class="form-group">
            <label>选择学期 *</label>
            <SearchSelect
              v-model="selectedSemester"
              placeholder="搜索学期..."
              :fetch-async="fetchSemesterOptions"
              :initial-option="initialSemesterOption"
              :load-on-focus="true"
              @update:model-value="handleSemesterChange"
            />
          </div>

          <!-- 课程-行政班映射配置 -->
          <CourseClassMapper
            ref="courseClassMapperRef"
            v-model="courseMappings"
          />

          <!-- 资源范围配置 -->
          <ResourceConfig
            v-model:building-uuids="buildingUuids"
            v-model:classroom-type-uuids="classroomTypeUuids"
          />

          <!-- 算法参数配置 -->
          <AlgorithmConfig
            v-model:population-size="populationSize"
            v-model:max-generations="maxGenerations"
            v-model:crossover-rate="crossoverRate"
            v-model:mutation-rate="mutationRate"
            v-model:elite-size="eliteSize"
          />

          <!-- 教师选择策略配置 -->
          <div class="collapsible-section">
            <div class="section-header" @click="showTeacherStrategy = !showTeacherStrategy">
              <h3>教师选择策略（可选）</h3>
              <span class="toggle-icon">{{ showTeacherStrategy ? 'v' : '>' }}</span>
            </div>
            <div v-show="showTeacherStrategy" class="section-content">
              <div class="form-group">
                <label>教师选择策略</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" value="balanced" v-model="teacherSelectionStrategy" />
                    <span>均衡分配（默认）</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" value="random" v-model="teacherSelectionStrategy" />
                    <span>随机分配</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" value="first" v-model="teacherSelectionStrategy" />
                    <span>优先分配第一个教师</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 排课模式选择 -->
          <div class="schedule-mode-selector">
            <label>排课模式</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" :value="0" v-model="scheduleModeType" />
                <span>预览模式（推荐）</span>
                <small>排课结果仅保存在预览表中，不影响正式课表</small>
              </label>
              <label class="radio-label">
                <input type="radio" :value="1" v-model="scheduleModeType" />
                <span>正式模式</span>
                <small>排课结果直接写入正式课表</small>
              </label>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-bar">
            <button
              class="btn-primary btn-large"
              type="button"
              :disabled="!isFormValid"
              @click="handleExecuteSchedule"
            >
              <span v-if="isExecuting" class="spinner"></span>
              <span>{{ isExecuting ? '排课中...' : '开始排课' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 步骤2：预览结果 -->
      <div v-if="currentStep === 2 && scheduleResult" class="step-content">
        <ResultPreview :result="scheduleResult" />

        <!-- 操作按钮 -->
        <div class="action-bar">
          <button class="btn-secondary" type="button" @click="handleReschedule">
            重新排课
          </button>
          <button class="btn-secondary" type="button" @click="handleClearPreview">
            清除预览
          </button>
          <button
            v-if="(scheduleResult.is_success ?? scheduleResult.success)"
            class="btn-primary"
            type="button"
            @click="handleConfirmSchedule"
          >
            确认方案
          </button>
        </div>
      </div>

      <!-- 步骤3：确认成功 -->
      <div v-if="currentStep === 3" class="step-content success-state">
        <div class="success-icon">🎉</div>
        <h2 class="success-title">排课方案已确认！</h2>
        <p class="success-message">排课方案已成功应用到系统中，您可以查看课表或继续排课。</p>
        <div class="success-actions">
          <button class="btn-primary" type="button" @click="goToTimetable">
            <span class="btn-icon">📊</span>
            查看课表
          </button>
          <button class="btn-secondary" type="button" @click="handleReschedule">
            <span class="btn-icon">🔄</span>
            继续排课
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auto-schedule-view {
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
  justify-content: space-between;
  padding: 1rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
  gap: 2rem;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
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

/* 步骤指示器 */
.steps-indicator {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  justify-content: center;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  font-weight: 600;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-color: #00d4ff;
  color: white;
}

.step.current .step-number {
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.3);
}

.step-label {
  font-size: 0.8rem;
  color: #a0aec0;
  transition: all 0.3s ease;
}

.step.active .step-label {
  color: #ffffff;
}

.step-line {
  width: 60px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.step-line.active {
  background: linear-gradient(90deg, #00d4ff 0%, #7c3aed 100%);
}

/* 主要内容区域 */
.main-content {
  padding: 2rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.content-header {
  text-align: center;
  margin-bottom: 2rem;
}

.content-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.content-subtitle {
  font-size: 1.1rem;
  color: #a0aec0;
}

/* 参数选择区域 */
.parameter-section {
  background: rgba(30, 30, 50, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 500;
}

/* 折叠面板 */
.collapsible-section {
  background: rgba(30, 30, 50, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.collapsible-section .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.collapsible-section .section-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.collapsible-section .section-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
}

.toggle-icon {
  color: #a0aec0;
  font-size: 0.9rem;
  transition: transform 0.3s ease;
}

.collapsible-section .section-content {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.radio-label:hover {
  background: rgba(255, 255, 255, 0.1);
}

.radio-label input[type="radio"] {
  cursor: pointer;
  margin-top: 0.2rem;
  accent-color: #00d4ff;
}

.radio-label small {
  margin-left: 0.5rem;
  color: #a0aec0;
  font-size: 0.8rem;
  display: block;
  margin-top: 0.25rem;
}

/* 排课模式选择器 */
.schedule-mode-selector {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: rgba(30, 30, 50, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.schedule-mode-selector > label {
  display: block;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #ffffff;
}

.schedule-mode-selector .radio-group {
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-mode-selector .radio-label {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(0, 212, 255, 0.2);
}

.schedule-mode-selector .radio-label:hover {
  background: rgba(0, 212, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.4);
}

/* 操作按钮 */
.action-bar {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-large {
  padding: 1rem 3rem;
  font-size: 1.1rem;
}

.btn-icon {
  font-size: 1.1rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 成功状态 */
.success-state {
  text-align: center;
  padding: 4rem 2rem;
}

.success-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: bounce 1s ease;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.success-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
}

.success-message {
  font-size: 1.1rem;
  color: #a0aec0;
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.success-actions {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .navbar-content,
  .main-content {
    padding: 1rem 2rem;
  }

  .steps-indicator {
    display: none;
  }
}

@media (max-width: 768px) {
  .navbar-content,
  .main-content {
    padding: 1rem 1.5rem;
  }

  .content-title {
    font-size: 1.5rem;
  }

  .action-bar {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .success-actions {
    flex-direction: column;
  }

  .logo-text {
    font-size: 1rem;
  }

  .radio-group {
    flex-direction: column;
  }
}
</style>
