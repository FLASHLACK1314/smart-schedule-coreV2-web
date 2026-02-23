<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getTeachingClassPage } from '@/api/teachingClass'
import { getSemesterPage } from '@/api/semester'
import { executeSchedule, confirmSchedule, clearSchedulePreview } from '@/api/autoSchedule'
import type { TeachingClassInfoDTO, SemesterInfoDTO, ScheduleResultDTO } from '@/api/types'
import { useMessage } from '@/composables/useMessage'
import { useUserStore } from '@/stores/user'
import SearchSelect from '@/components/SearchSelect.vue'

defineOptions({
  name: 'AutoScheduleView',
})

// 选项类型
interface SelectOption {
  label: string
  value: string
  [key: string]: any
}

const router = useRouter()
const { success, error, warning, info } = useMessage()
const userStore = useUserStore()

// 步骤状态：1-选择参数, 2-预览结果, 3-确认成功
const currentStep = ref<1 | 2 | 3>(1)

// 加载状态
const isLoading = ref(false)
const isExecuting = ref(false)

// 学期相关
const selectedSemester = ref<string>('')
const initialSemesterOption = ref<SelectOption | null>(null)
const semesters = ref<SemesterInfoDTO[]>([])

// 教学班相关
const teachingClasses = ref<TeachingClassInfoDTO[]>([])
const selectedTeachingClasses = ref<Set<string>>(new Set())
const weeklySessionsConfig = ref<Record<string, number>>({})

// 排课结果
const scheduleResult = ref<ScheduleResultDTO | null>(null)

// 权限控制
const canAutoSchedule = computed(() => {
  const userType = userStore.userType
  return userType === 'SYSTEM_ADMIN' || userType === 'ACADEMIC_ADMIN'
})

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

// 学期变化时加载教学班
const handleSemesterChange = async (semesterUuid: string) => {
  selectedSemester.value = semesterUuid
  selectedTeachingClasses.value.clear()
  weeklySessionsConfig.value = {}
  await loadTeachingClasses(semesterUuid)
}

// 加载教学班列表
const loadTeachingClasses = async (semesterUuid: string) => {
  isLoading.value = true
  try {
    const response = await getTeachingClassPage({
      page: 1,
      size: 1000,
      semester_uuid: semesterUuid,
    })
    teachingClasses.value = response.records
  } catch (err) {
    console.error('加载教学班失败:', err)
    error('加载教学班失败: ' + (err as Error).message)
  } finally {
    isLoading.value = false
  }
}

// 切换教学班选择
const toggleTeachingClass = (uuid: string) => {
  if (selectedTeachingClasses.value.has(uuid)) {
    selectedTeachingClasses.value.delete(uuid)
    delete weeklySessionsConfig.value[uuid]
  } else {
    selectedTeachingClasses.value.add(uuid)
    weeklySessionsConfig.value[uuid] = 1 // 默认每周1次
  }
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectedTeachingClasses.value.size === teachingClasses.value.length) {
    // 全部取消
    selectedTeachingClasses.value.clear()
    weeklySessionsConfig.value = {}
  } else {
    // 全选
    teachingClasses.value.forEach(tc => {
      selectedTeachingClasses.value.add(tc.teaching_class_uuid)
      weeklySessionsConfig.value[tc.teaching_class_uuid] = tc.weekly_sessions ?? 1
    })
  }
}

// 是否全选
const isAllSelected = computed(() => {
  return teachingClasses.value.length > 0 && selectedTeachingClasses.value.size === teachingClasses.value.length
})

// 执行排课
const handleExecuteSchedule = async () => {
  // 验证
  if (!selectedSemester.value) {
    warning('请选择学期')
    return
  }
  if (selectedTeachingClasses.value.size === 0) {
    warning('请至少选择一个教学班')
    return
  }

  isExecuting.value = true
  try {
    const response = await executeSchedule({
      semester_uuid: selectedSemester.value,
      teaching_class_uuids: Array.from(selectedTeachingClasses.value),
      weekly_sessions_config: weeklySessionsConfig.value,
    })

    scheduleResult.value = response
    currentStep.value = 2

    // 根据结果显示不同的消息
    if (response.status === 'success') {
      success('排课完成！所有教学班已成功排课')
    } else if (response.status === 'partial') {
      warning(`排课部分完成！已排课 ${response.stats.scheduled_count}/${response.stats.total_teaching_classes} 个教学班`)
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

// 重新排课
const handleReschedule = () => {
  currentStep.value = 1
  scheduleResult.value = null
}

// 查看课表
const goToTimetable = () => {
  router.push('/timetable-view')
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 初始化：加载学期列表
const init = async () => {
  try {
    const response = await getSemesterPage({
      page: 1,
      size: 1000,
    })
    semesters.value = response.records
  } catch (err) {
    console.error('加载学期失败:', err)
  }
}

init()
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
          <p class="content-subtitle">选择学期和需要排课的教学班</p>
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

          <!-- 教学班列表 -->
          <div v-if="selectedSemester" class="teaching-classes-section">
            <div class="section-header">
              <h3>选择教学班</h3>
              <button class="btn-text" @click="toggleSelectAll">
                {{ isAllSelected ? '取消全选' : '全选' }}
              </button>
            </div>

            <div v-if="isLoading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>

            <div v-else-if="teachingClasses.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              <p>该学期暂无教学班</p>
            </div>

            <div v-else class="teaching-classes-grid">
              <div
                v-for="tc in teachingClasses"
                :key="tc.teaching_class_uuid"
                class="teaching-class-card"
                :class="{ selected: selectedTeachingClasses.has(tc.teaching_class_uuid) }"
                @click="toggleTeachingClass(tc.teaching_class_uuid)"
              >
                <div class="card-checkbox">
                  <input
                    type="checkbox"
                    :checked="selectedTeachingClasses.has(tc.teaching_class_uuid)"
                    readonly
                  />
                </div>
                <div class="card-content">
                  <h4 class="card-title">{{ tc.teaching_class_name }}</h4>
                  <div class="card-info">
                    <span class="info-item">📚 {{ tc.course_name }}</span>
                    <span class="info-item">👨‍🏫 {{ tc.teacher_name }}</span>
                  </div>
                </div>
                <div v-if="selectedTeachingClasses.has(tc.teaching_class_uuid)" class="card-config">
                  <label>每周课次:</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    :value="weeklySessionsConfig[tc.teaching_class_uuid] ?? tc.weekly_sessions ?? 1"
                    @input="(e) => weeklySessionsConfig[tc.teaching_class_uuid] = Number((e.target as HTMLInputElement).value)"
                    @click.stop
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar">
          <button
            class="btn-primary btn-large"
            :disabled="!selectedSemester || selectedTeachingClasses.size === 0"
            @click="handleExecuteSchedule"
          >
            <span v-if="isExecuting" class="spinner"></span>
            <span>{{ isExecuting ? '排课中...' : '开始排课' }}</span>
          </button>
        </div>
      </div>

      <!-- 步骤2：预览结果 -->
      <div v-if="currentStep === 2 && scheduleResult" class="step-content">
        <div class="content-header">
          <h2 class="content-title">排课结果预览</h2>
          <p class="content-subtitle">
            <span v-if="scheduleResult.status === 'success'" class="status-success">✅ 排课成功</span>
            <span v-else-if="scheduleResult.status === 'partial'" class="status-warning">⚠️ 部分成功</span>
            <span v-else class="status-error">❌ 排课失败</span>
          </p>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">{{ scheduleResult.stats.total_teaching_classes }}</div>
              <div class="stat-label">总教学班</div>
            </div>
          </div>
          <div class="stat-card success">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value">{{ scheduleResult.stats.scheduled_count }}</div>
              <div class="stat-label">已排课</div>
            </div>
          </div>
          <div class="stat-card error">
            <div class="stat-icon">❌</div>
            <div class="stat-content">
              <div class="stat-value">{{ scheduleResult.stats.unscheduled_count }}</div>
              <div class="stat-label">未排课</div>
            </div>
          </div>
          <div class="stat-card" :class="{ warning: scheduleResult.stats.conflict_count > 0 }">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <div class="stat-value">{{ scheduleResult.stats.conflict_count }}</div>
              <div class="stat-label">冲突数</div>
            </div>
          </div>
        </div>

        <!-- 冲突提示 -->
        <div v-if="scheduleResult.conflicts.length > 0" class="conflicts-section">
          <h3>冲突详情</h3>
          <div class="conflicts-list">
            <div v-for="conflict in scheduleResult.conflicts" :key="conflict.teaching_class_uuid" class="conflict-item">
              <div class="conflict-icon">⚠️</div>
              <div class="conflict-content">
                <h4>{{ conflict.teaching_class_name }}</h4>
                <p>{{ conflict.conflict_description }}</p>
                <span class="conflict-type">{{ conflict.conflict_type === 'teacher' ? '教师冲突' : conflict.conflict_type === 'classroom' ? '教室冲突' : '班级冲突' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 排课详情表格 -->
        <div v-if="scheduleResult.schedules.length > 0" class="schedules-section">
          <h3>排课详情 ({{ scheduleResult.schedules.length }} 条)</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>教学班</th>
                  <th>课程</th>
                  <th>教师</th>
                  <th>教室</th>
                  <th>星期</th>
                  <th>节次</th>
                  <th>周次</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="schedule in scheduleResult.schedules" :key="schedule.schedule_uuid">
                  <td>{{ schedule.teaching_class_name }}</td>
                  <td>{{ schedule.course_name }}</td>
                  <td>{{ schedule.teacher_name }}</td>
                  <td>{{ schedule.classroom_name }}</td>
                  <td>周{{ schedule.day_of_week }}</td>
                  <td>{{ schedule.section_start }}-{{ schedule.section_end }}</td>
                  <td>{{ schedule.weeks_json }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar">
          <button class="btn-secondary" @click="handleReschedule">重新排课</button>
          <button class="btn-secondary" @click="handleClearPreview">清除预览</button>
          <button
            v-if="scheduleResult.status !== 'failed'"
            class="btn-primary"
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
          <button class="btn-primary" @click="goToTimetable">
            <span class="btn-icon">📊</span>
            查看课表
          </button>
          <button class="btn-secondary" @click="handleReschedule">
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

/* 教学班区域 */
.teaching-classes-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header h3 {
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-text {
  background: transparent;
  border: none;
  color: #00d4ff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-text:hover {
  color: #7c3aed;
  text-decoration: underline;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #a0aec0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
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
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* 教学班卡片网格 */
.teaching-classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.teaching-class-card {
  background: rgba(40, 40, 70, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.teaching-class-card:hover {
  background: rgba(50, 50, 80, 0.7);
  border-color: rgba(0, 212, 255, 0.3);
}

.teaching-class-card.selected {
  background: rgba(0, 212, 255, 0.1);
  border-color: #00d4ff;
}

.card-checkbox {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.card-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #00d4ff;
}

.card-content {
  padding-right: 2rem;
}

.card-title {
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  color: #a0aec0;
  font-size: 0.9rem;
}

.card-config {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-config label {
  color: #a0aec0;
  font-size: 0.9rem;
}

.card-config input {
  width: 80px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.9rem;
  text-align: center;
}

.card-config input:focus {
  outline: none;
  border-color: #00d4ff;
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

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(30, 30, 50, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card.success {
  border-color: rgba(76, 175, 80, 0.3);
  background: rgba(76, 175, 80, 0.1);
}

.stat-card.error {
  border-color: rgba(244, 67, 54, 0.3);
  background: rgba(244, 67, 54, 0.1);
}

.stat-card.warning {
  border-color: rgba(255, 152, 0, 0.3);
  background: rgba(255, 152, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
}

.stat-label {
  color: #a0aec0;
  font-size: 0.9rem;
}

/* 状态标签 */
.status-success {
  color: #4caf50;
}

.status-warning {
  color: #ff9800;
}

.status-error {
  color: #f44336;
}

/* 冲突区域 */
.conflicts-section {
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.conflicts-section h3 {
  color: #ff9800;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.conflicts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.conflict-item {
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
}

.conflict-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.conflict-content h4 {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.conflict-content p {
  color: #a0aec0;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.conflict-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 152, 0, 0.2);
  border-radius: 4px;
  color: #ff9800;
  font-size: 0.8rem;
  font-weight: 500;
}

/* 排课详情表格 */
.schedules-section {
  background: rgba(30, 30, 50, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.schedules-section h3 {
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.table-container {
  overflow-x: auto;
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

.data-table tbody tr:hover {
  background: rgba(0, 212, 255, 0.05);
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

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .teaching-classes-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .teaching-classes-grid {
    grid-template-columns: 1fr;
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
}
</style>
