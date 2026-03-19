<script setup lang="ts">
import { useMessage } from '@/composables/useMessage'
import MessageToast from '@/components/MessageToast.vue'
import DifyChatAssistant from '@/components/DifyChatAssistant.vue'

// 全局消息提示
const { messages, remove } = useMessage()
</script>

<template>
  <!-- 使用 keep-alive 缓存首页，保持滚动位置 -->
  <router-view v-slot="{ Component }">
    <keep-alive include="HomeView">
      <component :is="Component" />
    </keep-alive>
  </router-view>
  <MessageToast :messages="messages" @remove="remove" />
  <DifyChatAssistant />
</template>

<style>
/* 全局样式可以在这里定义 */
</style>
