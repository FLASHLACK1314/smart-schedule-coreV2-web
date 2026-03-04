<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useClickOutside } from '@/composables/useClickOutside'

// Props 定义
interface Props {
  modelValue: string | string[]
  placeholder?: string
  fetchAsync: (keyword: string) => Promise<SelectOption[]>
  disabled?: boolean
  clearable?: boolean
  debounceDelay?: number
  initialOption?: SelectOption | null
  loadOnFocus?: boolean // 是否在聚焦时自动加载数据，默认 false
  multiple?: boolean // 是否支持多选
}

// 选项类型
interface SelectOption {
  label: string
  value: string
  [key: string]: any
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入关键词搜索...',
  disabled: false,
  clearable: true,
  debounceDelay: 500,
  initialOption: null,
  loadOnFocus: false,
  multiple: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'change': [option: SelectOption | null | SelectOption[]]
}>()

// 响应式状态
const searchKeyword = ref<string>('')
const searchResults = ref<SelectOption[]>([])
const selectedOption = ref<SelectOption | null>(null)
const selectedOptions = ref<SelectOption[]>([]) // 多选时使用
const loading = ref<boolean>(false)
const isOpen = ref<boolean>(false)
const inputRef = ref<HTMLInputElement>()
const dropdownRef = ref<HTMLDivElement>()
const containerRef = ref<HTMLDivElement>()

// 搜索防抖
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(searchKeyword, (newKeyword) => {
  if (searchTimer) clearTimeout(searchTimer)

  searchTimer = setTimeout(async () => {
    // 如果关键词为空
    if (!newKeyword.trim()) {
      // 如果启用 loadOnFocus，不清空结果（因为会在 handleFocus 中加载）
      if (!props.loadOnFocus) {
        searchResults.value = []
      }
      return
    }

    // 有关键词时执行搜索
    loading.value = true
    try {
      const results = await props.fetchAsync(newKeyword)
      searchResults.value = results
    } catch (err) {
      console.error('搜索失败:', err)
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }, props.debounceDelay)
})

// 监听 modelValue 变化，同步选中项显示
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    if (props.multiple) {
      selectedOptions.value = []
    } else {
      selectedOption.value = null
    }
    searchKeyword.value = ''
  } else if (!props.multiple && !selectedOption.value && props.initialOption) {
    // 单选时：如果有初始选项且当前没有选中项，使用初始选项
    selectedOption.value = props.initialOption
    searchKeyword.value = props.initialOption.label
  } else if (props.multiple && Array.isArray(newValue)) {
    // 多选时：需要从搜索结果或初始选项中匹配
    // 这里暂时不做处理，因为多选的初始值需要外部传入选项对象
  }
}, { immediate: true })

// 监听 initialOption 变化
watch(() => props.initialOption, (newOption) => {
  if (newOption && props.modelValue && !selectedOption.value) {
    selectedOption.value = newOption
    searchKeyword.value = newOption.label
  }
}, { immediate: true })

// 点击外部关闭
useClickOutside(containerRef, () => {
  isOpen.value = false
})

// 处理输入框聚焦
const handleFocus = async () => {
  if (!props.disabled) {
    isOpen.value = true
    // 如果关键词为空且启用 loadOnFocus，则加载初始数据
    if (!searchKeyword.value.trim() && props.loadOnFocus) {
      loading.value = true
      try {
        const results = await props.fetchAsync('')
        searchResults.value = results
      } catch (err) {
        console.error('初始加载失败:', err)
        searchResults.value = []
      } finally {
        loading.value = false
      }
    }
  }
}

// 处理选项点击
const handleSelect = (option: SelectOption) => {
  if (props.multiple) {
    // 多选：切换选项
    const index = selectedOptions.value.findIndex(opt => opt.value === option.value)
    if (index > -1) {
      // 已选中，取消选择
      selectedOptions.value.splice(index, 1)
    } else {
      // 未选中，添加选择
      selectedOptions.value.push(option)
    }
    // 更新 modelValue 为值数组
    const values = selectedOptions.value.map(opt => opt.value)
    emit('update:modelValue', values)
    emit('change', [...selectedOptions.value])
    // 不关闭下拉框，允许多选
  } else {
    // 单选
    selectedOption.value = option
    searchKeyword.value = option.label
    isOpen.value = false
    emit('update:modelValue', option.value)
    emit('change', option)
  }
}

// 清空选择
const handleClear = () => {
  if (props.multiple) {
    selectedOptions.value = []
    emit('update:modelValue', [])
    emit('change', [])
  } else {
    selectedOption.value = null
    searchKeyword.value = ''
    // 不清空搜索结果，保留下拉列表数据
    emit('update:modelValue', '')
    emit('change', null)
  }
}

const displayText = computed(() => {
  if (props.multiple) {
    // 多选时显示已选项的标签
    if (selectedOptions.value.length > 0) {
      return selectedOptions.value.map(opt => opt.label).join(', ')
    }
    return ''
  } else {
    // 单选
    if (selectedOption.value) {
      return selectedOption.value.label
    }
    return searchKeyword.value
  }
})

// 检查是否为空
const isEmpty = computed(() => {
  return !searchKeyword.value.trim()
})
</script>

<template>
  <div ref="containerRef" class="search-select" :class="{ 'is-disabled': disabled, 'is-multiple': multiple }">
    <!-- 输入框 -->
    <div class="search-select-input-wrapper">
      <span class="search-icon">🔍</span>
      
      <!-- 多选模式：显示已选项标签 -->
      <div v-if="multiple" class="search-select-tags">
        <span
          v-for="(option, index) in selectedOptions"
          :key="index"
          class="search-select-tag"
        >
          {{ option.label }}
          <button
            type="button"
            class="tag-remove"
            @click.stop="() => {
              selectedOptions.splice(index, 1);
              const values = selectedOptions.map(opt => opt.value);
              emit('update:modelValue', values);
              emit('change', [...selectedOptions]);
            }"
          >
            ×
          </button>
        </span>
      </div>
      
      <!-- 单选模式或输入框 -->
      <input
        ref="inputRef"
        v-model="searchKeyword"
        type="text"
        class="search-select-input"
        :class="{ 'is-multiple-input': multiple }"
        :placeholder="multiple ? (selectedOptions.length > 0 ? '' : placeholder) : placeholder"
        :disabled="disabled"
        @focus="handleFocus"
      />
      
      <!-- 清空按钮 -->
      <button
        v-if="clearable && ((selectedOption && !multiple) || (selectedOptions.length > 0 && multiple)) && !disabled"
        class="clear-button"
        @click.stop="handleClear"
        type="button"
      >
        ×
      </button>
    </div>

    <!-- 下拉列表 -->
    <div
      v-if="isOpen"
      ref="dropdownRef"
      class="search-select-dropdown"
    >
      <!-- 加载状态 -->
      <div v-if="loading" class="search-select-loading">
        <div class="loading-spinner"></div>
        <span>搜索中...</span>
      </div>

      <!-- 空状态（仅在未启用 loadOnFocus 时显示"请输入关键词搜索"） -->
      <div v-else-if="!loadOnFocus && isEmpty && searchResults.length === 0" class="search-select-empty">
        <span class="empty-icon">🔍</span>
        <span>请输入关键词搜索</span>
      </div>

      <!-- 无结果 -->
      <div v-else-if="searchResults.length === 0" class="search-select-empty">
        <span class="empty-icon">📭</span>
        <span>未找到匹配结果</span>
      </div>

      <!-- 选项列表 -->
      <div v-else class="search-select-options">
        <div
          v-for="option in searchResults"
          :key="option.value"
          class="search-select-option"
          :class="{ 
            'is-selected': multiple 
              ? selectedOptions.some(opt => opt.value === option.value) 
              : option.value === modelValue 
          }"
          @click="handleSelect(option)"
        >
          {{ option.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-select {
  position: relative;
  width: 100%;
}

.search-select.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-select.is-disabled .search-select-input {
  cursor: not-allowed;
}

/* 输入框容器 */
.search-select-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
}

.search-select-input-wrapper:focus-within {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

/* 搜索图标 */
.search-icon {
  font-size: 1rem;
  margin-right: 0.5rem;
  opacity: 0.6;
}

/* 输入框 */
.search-select-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
}

.search-select-input::placeholder {
  color: rgba(160, 174, 192, 0.6);
}

.search-select-input:disabled {
  cursor: not-allowed;
}

/* 清空按钮 */
.clear-button {
  position: absolute;
  right: 0.75rem;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: #a0aec0;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background: rgba(244, 67, 54, 0.3);
  color: #f44336;
}

/* 下拉列表 */
.search-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: rgba(30, 30, 50, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.2s ease;
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

/* 选项样式 */
.search-select-options {
  padding: 0.5rem 0;
}

.search-select-option {
  padding: 0.75rem 1rem;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-select-option:hover {
  background: rgba(0, 212, 255, 0.1);
  color: #ffffff;
}

.search-select-option.is-selected {
  background: rgba(0, 212, 255, 0.15);
  color: #00d4ff;
}

/* 加载状态 */
.search-select-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #a0aec0;
  gap: 0.75rem;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.search-select-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #a0aec0;
  gap: 0.5rem;
}

.empty-icon {
  font-size: 1.5rem;
  opacity: 0.5;
}

/* 多选模式样式 */
.search-select.is-multiple .search-select-input-wrapper {
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}

.search-select-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
}

.search-select-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: rgba(0, 212, 255, 0.2);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 16px;
  color: #00d4ff;
  font-size: 0.9rem;
  font-weight: 500;
}

.tag-remove {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  border: none;
  border-radius: 50%;
  color: #00d4ff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.tag-remove:hover {
  background: rgba(244, 67, 54, 0.3);
  color: #f44336;
}

.search-select-input.is-multiple-input {
  flex: 1;
  min-width: 100px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-select-dropdown {
    max-height: 250px;
  }

  .search-select-option {
    padding: 0.6rem 0.75rem;
    font-size: 0.9rem;
  }
}
</style>
