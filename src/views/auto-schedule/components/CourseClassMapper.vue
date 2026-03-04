<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { getCoursePage } from '@/api/course'
import { getClassPage } from '@/api/class'
import { getCourseQualificationPage } from '@/api/courseQualification'

// 选项类型
interface SelectOption {
  label: string
  value: string
  [key: string]: any
}

// 课程配置项类型
export interface CourseMappingItem {
  course_uuid: string
  class_uuids: string[]
  teacher_uuid?: string
}

// Props
interface Props {
  modelValue: CourseMappingItem[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: CourseMappingItem[]]
}>()

// 本地配置列表
const localMappings = ref<CourseMappingItem[]>([])

// 折叠状态：每个卡片的折叠状态
const collapsedStates = ref<boolean[]>([])

// 课程选项缓存（用于获取名称）
const courseOptionsCache = ref<Map<string, { name: string; num: string }>>(new Map())

// 班级选项缓存（用于获取名称）
const classOptionsCache = ref<Map<string, string>>(new Map())

// 教师选项缓存
const teacherOptionsCache = ref<Map<string, SelectOption[]>>(new Map())

// 同步外部值到本地
watch(() => props.modelValue, (newValue) => {
  localMappings.value = newValue ? [...newValue] : []
  // 确保折叠状态数组与映射数组长度一致
  while (collapsedStates.value.length < localMappings.value.length) {
    collapsedStates.value.push(false)
  }
}, { immediate: true, deep: true })

// 判断配置是否完成
const isConfigComplete = (item: CourseMappingItem): boolean => {
  return !!(item.course_uuid && item.class_uuids && item.class_uuids.length > 0)
}

// 切换折叠状态
const toggleCollapse = (index: number) => {
  collapsedStates.value[index] = !collapsedStates.value[index]
}

// 展开卡片
const expandCard = (index: number) => {
  collapsedStates.value[index] = false
}

// 同步本地值到外部
const updateValue = () => {
  emit('update:modelValue', [...localMappings.value])
}

// 添加课程配置
const addMapping = () => {
  localMappings.value.push({
    course_uuid: '',
    class_uuids: [],
    teacher_uuid: undefined,
  })
  // 新添加的卡片默认展开
  collapsedStates.value.push(false)
  updateValue()
}

// 删除课程配置
const removeMapping = (index: number) => {
  localMappings.value.splice(index, 1)
  collapsedStates.value.splice(index, 1)
  updateValue()
}

// 监听配置变化，自动折叠完成的配置
watch(localMappings, (mappings, oldMappings) => {
  mappings.forEach((item, index) => {
    // 只有从未完成变为完成时才自动折叠
    const wasComplete = oldMappings?.[index] ? isConfigComplete(oldMappings[index]) : false
    const isNowComplete = isConfigComplete(item)

    if (isNowComplete && !wasComplete && !collapsedStates.value[index]) {
      // 延迟折叠，给用户查看确认的时间
      setTimeout(() => {
        // 再次检查状态，确保仍然是完成状态
        const currentItem = localMappings.value[index]
        if (currentItem && isConfigComplete(currentItem)) {
          collapsedStates.value[index] = true
        }
      }, 800)
    }
  })
}, { deep: true })

// 搜索课程选项
const fetchCourseOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const response = await getCoursePage({
      page: 1,
      size: 20,
      ...(keyword.trim() ? { course_name: keyword } : {})
    })
    return response.records.map(c => {
      // 缓存课程信息
      courseOptionsCache.value.set(c.course_uuid, {
        name: c.course_name,
        num: c.course_num
      })
      return {
        label: `${c.course_name} (${c.course_num})`,
        value: c.course_uuid,
        course_name: c.course_name,
        course_num: c.course_num,
      }
    })
  } catch (err) {
    console.error('搜索课程失败:', err)
    return []
  }
}

// 搜索行政班选项
const fetchClassOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const response = await getClassPage({
      page: 1,
      size: 20,
      ...(keyword.trim() ? { class_name: keyword } : {})
    })
    return response.records.map(c => {
      // 缓存班级名称
      classOptionsCache.value.set(c.class_uuid, c.class_name)
      return {
        label: c.class_name,
        value: c.class_uuid,
        class_name: c.class_name,
      }
    })
  } catch (err) {
    console.error('搜索行政班失败:', err)
    return []
  }
}

// 加载课程的教师资格
const fetchTeachersForCourse = async (courseUuid: string): Promise<SelectOption[]> => {
  if (!courseUuid) return []

  // 从缓存中获取
  if (teacherOptionsCache.value.has(courseUuid)) {
    return teacherOptionsCache.value.get(courseUuid)!
  }

  try {
    const response = await getCourseQualificationPage({
      page: 1,
      size: 100,
      course_uuid: courseUuid,
    })

    const options = response.records.map(q => ({
      label: `${q.teacher_name} (${q.teacher_title})`,
      value: q.teacher_uuid,
      teacher_name: q.teacher_name,
      teacher_title: q.teacher_title,
    }))

    teacherOptionsCache.value.set(courseUuid, options)
    return options
  } catch (err) {
    console.error('加载教师资格失败:', err)
    return []
  }
}

// 根据课程UUID获取教师选项（用于模板）
const getTeacherFetchFn = (courseUuid: string) => {
  return async (keyword: string): Promise<SelectOption[]> => {
    if (courseUuid) {
      return fetchTeachersForCourse(courseUuid)
    }
    return []
  }
}

// 处理教师选择变化
const handleTeacherChange = (index: number, val: string | string[]) => {
  const mapping = localMappings.value[index]
  if (mapping) {
    mapping.teacher_uuid = typeof val === 'string' ? (val || undefined) : undefined
    updateValue()
  }
}

// 验证配置是否有效
const isValid = computed(() => {
  if (localMappings.value.length === 0) return false
  return localMappings.value.every(item =>
    item.course_uuid && item.class_uuids && item.class_uuids.length > 0
  )
})

// 获取课程名称
const getCourseName = (uuid: string): string => {
  if (!uuid) return '未选择课程'
  const cached = courseOptionsCache.value.get(uuid)
  return cached ? cached.name : '未知课程'
}

// 获取教师名称
const getTeacherName = (uuid: string): string => {
  if (!uuid) return ''
  // 从缓存中查找教师名称
  for (const options of teacherOptionsCache.value.values()) {
    const teacher = options.find(opt => opt.value === uuid)
    if (teacher) return teacher.teacher_name || teacher.label
  }
  return '未知教师'
}

// 获取班级名称列表
const getClassNames = (uuids: string[]): string[] => {
  if (!uuids || uuids.length === 0) return []
  return uuids.map(uuid => classOptionsCache.value.get(uuid) || '未知班级')
}

// 暴露验证方法
defineExpose({
  isValid,
  getMappings: () => localMappings.value
})
</script>

<template>
  <div class="course-class-mapper">
    <div class="mapper-header">
      <h3>课程-行政班映射配置</h3>
      <button
        class="btn-add"
        type="button"
        :disabled="disabled"
        @click="addMapping"
      >
        <span class="btn-icon">+</span>
        添加课程
      </button>
    </div>

    <div v-if="localMappings.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>请添加需要排课的课程</p>
      <button class="btn-add-first" type="button" :disabled="disabled" @click="addMapping">
        添加第一个课程
      </button>
    </div>

    <div v-else class="mapping-list">
      <div
        v-for="(item, index) in localMappings"
        :key="index"
        class="mapping-card"
        :class="{
          collapsed: collapsedStates[index],
          completed: isConfigComplete(item)
        }"
      >
        <!-- 折叠状态：摘要视图 -->
        <div
          v-if="collapsedStates[index]"
          class="card-summary"
          @click="expandCard(index)"
        >
          <div class="summary-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="summary-content">
            <span class="summary-course">{{ getCourseName(item.course_uuid) }}</span>
            <span class="summary-divider">·</span>
            <span class="summary-classes">{{ item.class_uuids.length }} 个班级</span>
            <template v-if="item.teacher_uuid">
              <span class="summary-divider">·</span>
              <span class="summary-teacher">{{ getTeacherName(item.teacher_uuid) }}</span>
            </template>
          </div>
          <div class="summary-actions">
            <button
              class="btn-delete-small"
              type="button"
              :disabled="disabled"
              @click.stop="removeMapping(index)"
              title="删除"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <span class="expand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </span>
          </div>
        </div>

        <!-- 展开状态：完整表单 -->
        <template v-else>
          <div class="card-header">
            <span class="card-index">配置 {{ index + 1 }}</span>
            <div class="header-actions">
              <button
                v-if="isConfigComplete(item)"
                class="btn-collapse"
                type="button"
                @click="toggleCollapse(index)"
                title="收起"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="4 14 10 14 10 20"></polyline>
                  <polyline points="20 10 14 10 14 4"></polyline>
                  <line x1="14" y1="10" x2="21" y2="3"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
                收起
              </button>
              <button
                class="btn-delete"
                type="button"
                :disabled="disabled"
                @click="removeMapping(index)"
                title="删除"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <div class="card-body">
            <div class="form-group">
              <label>课程 *</label>
              <SearchSelect
                v-model="item.course_uuid"
                placeholder="搜索课程..."
                :fetch-async="fetchCourseOptions"
                :disabled="disabled"
                :load-on-focus="true"
              />
            </div>

            <div class="form-group">
              <label>教师（可选）</label>
              <SearchSelect
                :model-value="item.teacher_uuid || ''"
                @update:model-value="handleTeacherChange(index, $event)"
                placeholder="不选则自动分配"
                :fetch-async="getTeacherFetchFn(item.course_uuid)"
                :disabled="disabled || !item.course_uuid"
                :load-on-focus="true"
              />
            </div>

            <div class="form-group">
              <label>行政班级 *</label>
              <SearchSelect
                v-model="item.class_uuids"
                placeholder="搜索行政班级..."
                :fetch-async="fetchClassOptions"
                :disabled="disabled"
                :load-on-focus="true"
                :multiple="true"
              />
              <div v-if="item.class_uuids && item.class_uuids.length > 0" class="selected-classes">
                <span class="selected-label">已选：</span>
                <span class="selected-list">{{ getClassNames(item.class_uuids).join('、') }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-class-mapper {
  width: 100%;
}

.mapper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mapper-header h3 {
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #a0aec0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.btn-add-first {
  margin-top: 1rem;
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

.btn-add-first:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mapping-card {
  background: rgba(40, 40, 70, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mapping-card:hover {
  border-color: rgba(0, 212, 255, 0.3);
  background: rgba(50, 50, 80, 0.7);
}

/* 完成状态的卡片 */
.mapping-card.completed {
  border-color: rgba(76, 175, 80, 0.3);
}

.mapping-card.completed:hover {
  border-color: rgba(76, 175, 80, 0.5);
}

/* 折叠状态的卡片 */
.mapping-card.collapsed {
  padding: 0;
  background: rgba(30, 30, 50, 0.6);
}

.mapping-card.collapsed:hover {
  background: rgba(40, 40, 60, 0.8);
}

/* 折叠摘要样式 */
.card-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.card-summary:hover {
  background: rgba(255, 255, 255, 0.05);
}

.summary-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-icon svg {
  width: 16px;
  height: 16px;
  color: white;
}

.summary-content {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.95rem;
  color: #ffffff;
  min-width: 0;
}

.summary-course {
  font-weight: 600;
  color: #00d4ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-divider {
  color: rgba(255, 255, 255, 0.3);
  margin: 0 0.25rem;
}

.summary-classes {
  color: #a0aec0;
  white-space: nowrap;
}

.summary-teacher {
  color: #a0aec0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-delete-small {
  width: 28px;
  height: 28px;
  background: rgba(244, 67, 54, 0.15);
  border: none;
  border-radius: 6px;
  color: #f44336;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.btn-delete-small:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.3);
  opacity: 1;
}

.btn-delete-small:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-delete-small svg {
  width: 14px;
  height: 14px;
}

.expand-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  transition: transform 0.3s ease;
}

.expand-icon svg {
  width: 14px;
  height: 14px;
}

.card-summary:hover .expand-icon {
  color: #00d4ff;
}

/* 展开卡片样式 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-index {
  color: #00d4ff;
  font-size: 1rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-collapse {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.8rem;
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 6px;
  color: #4caf50;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-collapse:hover {
  background: rgba(76, 175, 80, 0.25);
  border-color: rgba(76, 175, 80, 0.5);
}

.btn-collapse svg {
  width: 14px;
  height: 14px;
}

.btn-delete {
  width: 30px;
  height: 30px;
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.2);
  border-radius: 8px;
  color: #f44336;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.3);
  border-color: rgba(244, 67, 54, 0.4);
  transform: rotate(90deg);
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete svg {
  width: 16px;
  height: 16px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
}

/* 已选班级显示 */
.selected-classes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 6px;
  font-size: 0.85rem;
}

.selected-label {
  color: #00d4ff;
  font-weight: 500;
}

.selected-list {
  color: #a0aec0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mapper-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .summary-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .summary-divider {
    display: none;
  }

  .summary-actions {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
  }

  .card-summary {
    position: relative;
    padding-right: 5rem;
  }
}
</style>
