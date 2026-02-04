<script setup lang="ts">
import { useMessage } from '@/composables/useMessage'
import MessageToast from '@/components/MessageToast.vue'

// 全局消息提示
const { messages, remove } = useMessage()
</script>

<template>
  <router-view />
  <MessageToast :messages="messages" @remove="remove" />
</template>

<style>
/* 全局样式可以在这里定义 */
</style>
