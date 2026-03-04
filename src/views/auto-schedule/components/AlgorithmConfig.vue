<script setup lang="ts">
import { ref, watch, computed } from 'vue'

// Props
interface Props {
  populationSize?: number
  maxGenerations?: number
  crossoverRate?: number
  mutationRate?: number
  eliteSize?: number
  disabled?: boolean
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  populationSize: 100,
  maxGenerations: 500,
  crossoverRate: 0.8,
  mutationRate: 0.2,
  eliteSize: 10,
  disabled: false,
  collapsed: true,
})

const emit = defineEmits<{
  'update:populationSize': [value: number]
  'update:maxGenerations': [value: number]
  'update:crossoverRate': [value: number]
  'update:mutationRate': [value: number]
  'update:eliteSize': [value: number]
}>()

// 本地状态
const localPopulationSize = ref(props.populationSize)
const localMaxGenerations = ref(props.maxGenerations)
const localCrossoverRate = ref(props.crossoverRate)
const localMutationRate = ref(props.mutationRate)
const localEliteSize = ref(props.eliteSize)
const isCollapsed = ref(props.collapsed)
const currentPreset = ref('标准')

// 预设配置
const presets = [
  {
    name: '快速',
    populationSize: 50,
    maxGenerations: 300,
    crossoverRate: 0.7,
    mutationRate: 0.25,
    eliteSize: 5,
  },
  {
    name: '标准',
    populationSize: 100,
    maxGenerations: 500,
    crossoverRate: 0.8,
    mutationRate: 0.2,
    eliteSize: 10,
  },
  {
    name: '精细',
    populationSize: 200,
    maxGenerations: 1000,
    crossoverRate: 0.85,
    mutationRate: 0.15,
    eliteSize: 20,
  }
]

// 同步外部值
watch(() => props.populationSize, (val) => { localPopulationSize.value = val })
watch(() => props.maxGenerations, (val) => { localMaxGenerations.value = val })
watch(() => props.crossoverRate, (val) => { localCrossoverRate.value = val })
watch(() => props.mutationRate, (val) => { localMutationRate.value = val })
watch(() => props.eliteSize, (val) => { localEliteSize.value = val })

// 同步到外部
watch(localPopulationSize, (val) => { emit('update:populationSize', val) })
watch(localMaxGenerations, (val) => { emit('update:maxGenerations', val) })
watch(localCrossoverRate, (val) => { emit('update:crossoverRate', val) })
watch(localMutationRate, (val) => { emit('update:mutationRate', val) })
watch(localEliteSize, (val) => { emit('update:eliteSize', val) })

// 切换折叠
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 应用预设
const applyPreset = (preset: typeof presets[0]) => {
  localPopulationSize.value = preset.populationSize
  localMaxGenerations.value = preset.maxGenerations
  localCrossoverRate.value = preset.crossoverRate
  localMutationRate.value = preset.mutationRate
  localEliteSize.value = preset.eliteSize
  currentPreset.value = preset.name
}

// 格式化百分比
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(0)}%`
}
</script>

<template>
  <div class="algorithm-config collapsible-section">
    <div class="section-header" @click="toggleCollapse">
      <h3>算法参数配置（高级设置）</h3>
      <span class="toggle-icon">{{ isCollapsed ? '>' : 'v' }}</span>
    </div>

    <div v-show="!isCollapsed" class="section-content">
      <!-- 快速预设 -->
      <div class="preset-section">
        <label>快速预设</label>
        <div class="preset-buttons">
          <button
            v-for="preset in presets"
            :key="preset.name"
            type="button"
            :class="['preset-btn', { active: currentPreset === preset.name }]"
            :disabled="disabled"
            @click="applyPreset(preset)"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>

      <!-- 参数配置 -->
      <div class="params-grid">
        <div class="form-group">
          <label>种群大小</label>
          <input
            v-model.number="localPopulationSize"
            type="number"
            class="form-input"
            min="50"
            max="500"
            :disabled="disabled"
          />
        </div>

        <div class="form-group">
          <label>最大迭代代数</label>
          <input
            v-model.number="localMaxGenerations"
            type="number"
            class="form-input"
            min="100"
            max="2000"
            :disabled="disabled"
          />
        </div>

        <div class="form-group">
          <label>精英保留数量</label>
          <input
            v-model.number="localEliteSize"
            type="number"
            class="form-input"
            min="5"
            max="50"
            :disabled="disabled"
          />
        </div>
      </div>

      <div class="params-grid">
        <div class="form-group">
          <label>交叉概率 ({{ formatPercent(localCrossoverRate) }})</label>
          <input
            v-model.number="localCrossoverRate"
            type="range"
            class="form-range"
            min="0.5"
            max="0.95"
            step="0.05"
            :disabled="disabled"
          />
        </div>

        <div class="form-group">
          <label>变异概率 ({{ formatPercent(localMutationRate) }})</label>
          <input
            v-model.number="localMutationRate"
            type="range"
            class="form-range"
            min="0.01"
            max="0.3"
            step="0.01"
            :disabled="disabled"
          />
        </div>
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

.preset-section {
  margin-bottom: 1.5rem;
}

.preset-section label {
  display: block;
  margin-bottom: 0.75rem;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
}

.preset-buttons {
  display: flex;
  gap: 0.75rem;
}

.preset-btn {
  flex: 1;
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preset-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(0, 212, 255, 0.3);
}

.preset-btn.active {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-color: #00d4ff;
  color: white;
}

.preset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.params-grid:last-child {
  margin-bottom: 0;
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

.form-input {
  width: 100%;
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #00d4ff;
  background: rgba(255, 255, 255, 0.1);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-range {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  margin-top: 0.25rem;
}

.form-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.form-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.form-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.form-range:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .params-grid {
    grid-template-columns: 1fr;
  }

  .preset-buttons {
    flex-direction: column;
  }
}
</style>
