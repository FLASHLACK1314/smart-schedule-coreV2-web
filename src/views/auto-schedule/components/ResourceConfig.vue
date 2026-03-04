<script setup lang="ts">
import { ref, watch } from 'vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { getBuildingPage } from '@/api/building'
import { getClassroomTypePage } from '@/api/classroomType'

// 选项类型
interface SelectOption {
  label: string
  value: string
  [key: string]: any
}

// Props
interface Props {
  buildingUuids?: string[]
  classroomTypeUuids?: string[]
  disabled?: boolean
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  buildingUuids: () => [],
  classroomTypeUuids: () => [],
  disabled: false,
  collapsed: true,
})

const emit = defineEmits<{
  'update:buildingUuids': [value: string[]]
  'update:classroomTypeUuids': [value: string[]]
}>()

// 本地状态
const localBuildingUuids = ref<string[]>([...props.buildingUuids])
const localClassroomTypeUuids = ref<string[]>([...props.classroomTypeUuids])
const isCollapsed = ref(props.collapsed)

// 同步外部值
watch(() => props.buildingUuids, (val) => {
  localBuildingUuids.value = [...val]
}, { deep: true })

watch(() => props.classroomTypeUuids, (val) => {
  localClassroomTypeUuids.value = [...val]
}, { deep: true })

watch(localBuildingUuids, (val) => {
  emit('update:buildingUuids', val)
}, { deep: true })

watch(localClassroomTypeUuids, (val) => {
  emit('update:classroomTypeUuids', val)
}, { deep: true })

// 切换折叠
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 搜索教学楼选项
const fetchBuildingOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const response = await getBuildingPage({
      page: 1,
      size: 100,
      ...(keyword.trim() ? { building_name: keyword } : {})
    })
    return response.records.map(b => ({
      label: `${b.building_name} (${b.building_num})`,
      value: b.building_uuid
    }))
  } catch (err) {
    console.error('搜索教学楼失败:', err)
    return []
  }
}

// 搜索教室类型选项
const fetchClassroomTypeOptions = async (keyword: string): Promise<SelectOption[]> => {
  try {
    const response = await getClassroomTypePage({
      page: 1,
      size: 100,
      ...(keyword.trim() ? { classroom_type_name: keyword } : {})
    })
    return response.records.map(ct => ({
      label: ct.type_name,
      value: ct.classroom_type_uuid
    }))
  } catch (err) {
    console.error('搜索教室类型失败:', err)
    return []
  }
}
</script>

<template>
  <div class="resource-config collapsible-section">
    <div class="section-header" @click="toggleCollapse">
      <h3>资源范围配置（可选）</h3>
      <span class="toggle-icon">{{ isCollapsed ? '>' : 'v' }}</span>
    </div>

    <div v-show="!isCollapsed" class="section-content">
      <p class="section-hint">不选择则使用所有可用资源</p>

      <div class="form-group">
        <label>教学楼范围</label>
        <SearchSelect
          v-model="localBuildingUuids"
          placeholder="搜索教学楼..."
          :fetch-async="fetchBuildingOptions"
          :disabled="disabled"
          :load-on-focus="true"
          :multiple="true"
        />
      </div>

      <div class="form-group">
        <label>教室类型范围</label>
        <SearchSelect
          v-model="localClassroomTypeUuids"
          placeholder="搜索教室类型..."
          :fetch-async="fetchClassroomTypeOptions"
          :disabled="disabled"
          :load-on-focus="true"
          :multiple="true"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.collapsible-section {
  background: rgba(30, 30, 50, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.section-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.section-header h3 {
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

.section-content {
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

.section-hint {
  color: #a0aec0;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
}
</style>
