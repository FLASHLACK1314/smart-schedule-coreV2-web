<script setup lang="ts">
import { computed } from 'vue'
import type { TimeSlotCheckDTO } from '@/api/dify'

const props = defineProps<{
  data: TimeSlotCheckDTO
}>()

// 状态样式计算
const statusClass = computed(() => {
  if (!props.data.success) return 'error'
  if (props.data.hasConflict) return 'conflict'
  return 'available'
})

const statusText = computed(() => {
  if (!props.data.success) return '检测失败'
  if (props.data.hasConflict) return '存在冲突'
  return '时间可用'
})

const statusIcon = computed(() => {
  if (!props.data.success) return '!'
  if (props.data.hasConflict) return '!'
  return '*'
})
</script>

<template>
  <div class="time-slot-check-card" :class="statusClass">
    <!-- 头部状态 -->
    <div class="card-header">
      <div class="time-slot-info">
        <span class="day">{{ data.timeSlot?.dayOfWeekStr }}</span>
        <span class="section">第{{ data.timeSlot?.sectionStart }}-{{ data.timeSlot?.sectionEnd }}节</span>
      </div>
      <div class="status-badge">
        <span class="status-icon">{{ statusIcon }}</span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="!data.success" class="error-message">
      {{ data.errorMessage || '检测失败' }}
    </div>

    <!-- 冲突类型汇总 -->
    <div v-else-if="data.hasConflict && data.conflictTypes?.length" class="conflict-types">
      <span v-for="type in data.conflictTypes" :key="type" class="conflict-type-badge">
        {{ type }}
      </span>
    </div>

    <!-- 检测结果列表 -->
    <div v-if="data.success && data.results?.length" class="results-list">
      <div
        v-for="result in data.results"
        :key="`${result.checkType}-${result.name}`"
        class="result-item"
        :class="{ conflict: result.hasConflict, 'not-found': !result.found }"
      >
        <div class="result-header">
          <span class="check-type">{{ result.checkType === 'classroom' ? '教室' : '教师' }}</span>
          <span class="check-name">{{ result.name }}</span>
          <span class="result-status">
            <template v-if="!result.found">未找到</template>
            <template v-else-if="result.hasConflict">冲突</template>
            <template v-else>可用</template>
          </span>
        </div>

        <!-- 冲突详情 -->
        <div v-if="result.hasConflict && result.conflicts?.length" class="conflicts-detail">
          <div v-for="(conflict, index) in result.conflicts" :key="index" class="conflict-item">
            <span class="conflict-course">{{ conflict.courseName }}</span>
            <span class="conflict-related">{{ conflict.relatedName }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-slot-check-card {
  background: rgba(30, 30, 50, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.time-slot-check-card.conflict {
  border-color: rgba(255, 82, 82, 0.3);
  background: rgba(255, 82, 82, 0.05);
}

.time-slot-check-card.available {
  border-color: rgba(76, 175, 80, 0.3);
  background: rgba(76, 175, 80, 0.05);
}

/* 头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
}

.time-slot-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.day {
  font-weight: 600;
  color: #fff;
  font-size: 15px;
}

.section {
  color: #a0aec0;
  font-size: 13px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.status-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.conflict .status-badge {
  background: rgba(255, 82, 82, 0.2);
  color: #ff5252;
}

.conflict .status-icon {
  background: #ff5252;
  color: #fff;
}

.available .status-badge {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.available .status-icon {
  background: #4caf50;
  color: #fff;
}

.error .status-badge {
  background: rgba(255, 82, 82, 0.2);
  color: #ff5252;
}

.error .status-icon {
  background: #ff5252;
  color: #fff;
}

/* 冲突类型标签 */
.conflict-types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 82, 82, 0.1);
}

.conflict-type-badge {
  padding: 4px 10px;
  background: rgba(255, 82, 82, 0.2);
  border-radius: 4px;
  color: #ff5252;
  font-size: 12px;
}

/* 错误信息 */
.error-message {
  padding: 16px;
  color: #ff5252;
  font-size: 14px;
}

/* 检测结果列表 */
.results-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.result-item.conflict {
  border-color: rgba(255, 82, 82, 0.2);
}

.result-item.not-found {
  border-color: rgba(255, 152, 0, 0.2);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
}

.check-type {
  padding: 2px 8px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 4px;
  color: #00d4ff;
  font-size: 11px;
}

.check-name {
  flex: 1;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.result-status {
  font-size: 12px;
  color: #a0aec0;
}

.result-item.conflict .result-status {
  color: #ff5252;
}

.result-item:not(.conflict):not(.not-found) .result-status {
  color: #4caf50;
}

.result-item.not-found .result-status {
  color: #ff9800;
}

/* 冲突详情 */
.conflicts-detail {
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.conflict-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
}

.conflict-item:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.conflict-course {
  color: #fff;
}

.conflict-related {
  color: #a0aec0;
}

.conflict-related::before {
  content: '·';
  margin-right: 8px;
}

/* 响应式 */
@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .result-header {
    flex-wrap: wrap;
  }
}
</style>
