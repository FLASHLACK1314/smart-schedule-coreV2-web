<script setup lang="ts">
import { computed } from 'vue'
import type { ConflictReport, ConflictItem } from '@/api/types'

// Props
interface Props {
  conflictReport?: ConflictReport
  hardConflicts?: number
  softConflicts?: number
}

const props = withDefaults(defineProps<Props>(), {
  hardConflicts: 0,
  softConflicts: 0,
})

// 合并所有冲突
const allConflicts = computed(() => {
  if (!props.conflictReport) return []

  const list: Array<ConflictItem & { type: string; typeLabel: string }> = []

  // 兼容驼峰和蛇形命名
  const report = props.conflictReport as any
  const teacherConflicts = report.teacherConflicts || report.teacher_conflicts || []
  const classroomConflicts = report.classroomConflicts || report.classroom_conflicts || []
  const classConflicts = report.classConflicts || report.class_conflicts || []

  // 教师冲突
  teacherConflicts.forEach((item: ConflictItem) => {
    list.push({
      ...item,
      type: 'teacher',
      typeLabel: '教师冲突'
    })
  })

  // 教室冲突
  classroomConflicts.forEach((item: ConflictItem) => {
    list.push({
      ...item,
      type: 'classroom',
      typeLabel: '教室冲突'
    })
  })

  // 班级冲突
  classConflicts.forEach((item: ConflictItem) => {
    list.push({
      ...item,
      type: 'class',
      typeLabel: '班级冲突'
    })
  })

  return list
})

// 是否有冲突
const hasConflicts = computed(() => {
  return allConflicts.value.length > 0 || props.hardConflicts > 0 || props.softConflicts > 0
})

// 获取冲突类型图标
const getConflictIcon = (type: string): string => {
  switch (type) {
    case 'teacher': return '👤'
    case 'classroom': return '🏫'
    case 'class': return '👨‍🎓'
    default: return '⚠️'
  }
}
</script>

<template>
  <div v-if="hasConflicts" class="conflict-report">
    <div class="report-header">
      <h3>冲突报告</h3>
      <div class="conflict-summary">
        <span v-if="hardConflicts > 0" class="badge hard">
          {{ hardConflicts }} 硬约束
        </span>
        <span v-if="softConflicts > 0" class="badge soft">
          {{ softConflicts }} 软约束
        </span>
      </div>
    </div>

    <div v-if="allConflicts.length > 0" class="conflicts-list">
      <div
        v-for="(conflict, index) in allConflicts"
        :key="index"
        class="conflict-item"
        :class="conflict.type"
      >
        <div class="conflict-icon">{{ getConflictIcon(conflict.type) }}</div>
        <div class="conflict-content">
          <div class="conflict-type">{{ conflict.typeLabel }}</div>
          <div class="conflict-desc">{{ conflict.description }}</div>
          <div v-if="conflict.affected_teaching_classes?.length > 0" class="affected-classes">
            影响教学班: {{ conflict.affected_teaching_classes.join(', ') }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-detail">
      <p>存在 {{ hardConflicts + softConflicts }} 个冲突，但暂无详细报告</p>
    </div>
  </div>
</template>

<style scoped>
.conflict-report {
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 152, 0, 0.2);
}

.report-header h3 {
  color: #ff9800;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.conflict-summary {
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.hard {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.badge.soft {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.conflicts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.conflict-item {
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  border-left: 3px solid;
}

.conflict-item.teacher {
  border-left-color: #2196f3;
}

.conflict-item.classroom {
  border-left-color: #9c27b0;
}

.conflict-item.class {
  border-left-color: #4caf50;
}

.conflict-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.conflict-content {
  flex: 1;
}

.conflict-type {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.conflict-desc {
  color: #a0aec0;
  font-size: 0.85rem;
  line-height: 1.5;
}

.affected-classes {
  margin-top: 0.5rem;
  color: #7c3aed;
  font-size: 0.8rem;
}

.no-detail {
  text-align: center;
  padding: 1rem;
  color: #a0aec0;
}

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .conflict-summary {
    align-self: flex-start;
  }
}
</style>
