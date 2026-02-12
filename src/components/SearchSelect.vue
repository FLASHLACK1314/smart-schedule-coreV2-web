<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useClickOutside } from '@/composables/useClickOutside'

// Props 定义
interface Props {
  modelValue: string
  placeholder?: string
  fetchAsync: (keyword: string) => Promise<SelectOption[]>
  disabled?: boolean
  clearable?: boolean
  debounceDelay?: number
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
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [option: SelectOption | null]
}>()

// 响应式状态
const searchKeyword = ref<string>('')
const searchResults = ref<SelectOption[]>([])
const selectedOption = ref<SelectOption | null>(null)
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
    if (!newKeyword.trim()) {
      searchResults.value = []
      return
    }

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
    selectedOption.value = null
    searchKeyword.value = ''
  }
}, { immediate: true })

// 点击外部关闭
useClickOutside(containerRef, () => {
  isOpen.value = false
})

// 处理输入框聚焦
const handleFocus = () => {
  if (!props.disabled) {
    isOpen.value = true
  }
}

// 处理选项点击
const handleSelect = (option: SelectOption) => {
  selectedOption.value = option
  searchKeyword.value = option.label
  isOpen.value = false
  emit('update:modelValue', option.value)
  emit('change', option)
}

// 清空选择
const handleClear = () => {
  selectedOption.value = null
  searchKeyword.value = ''
  searchResults.value = []
  emit('update:modelValue', '')
  emit('change', null)
}

// 计算显示的文本
const displayText = computed(() => {
  if (selectedOption.value) {
    return selectedOption.value.label
  }
  return searchKeyword.value
})

// 检查是否为空
const isEmpty = computed(() => {
  return !searchKeyword.value.trim()
})
</script>

<template>
  <div ref="containerRef" class="search-select" :class="{ 'is-disabled': disabled }">
    <!-- 输入框 -->
    <div class="search-select-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        ref="inputRef"
        v-model="searchKeyword"
        type="text"
        class="search-select-input"
        :placeholder="placeholder"
        :disabled="disabled"
        @focus="handleFocus"
      />
      <!-- 清空按钮 -->
      <button
        v-if="clearable && selectedOption && !disabled"
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

      <!-- 空状态 -->
      <div v-else-if="isEmpty" class="search-select-empty">
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
          :class="{ 'is-selected': option.value === modelValue }"
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
