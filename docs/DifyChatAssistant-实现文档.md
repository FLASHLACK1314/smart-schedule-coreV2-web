# Dify 智能调课助手 - 前端接入文档

## 背景

后端已完成 Dify 智能调课助手的集成（`DifyChatController`），现在需要在前端添加一个悬浮小助手按钮，点击后弹出聊天窗口，让用户可以与 AI 助手对话。

## 前端技术栈

- **Vue 3.5** + Composition API + `<script setup>`
- **TypeScript** + **Vite**
- **Pinia** 状态管理 + **Vue Router**
- **纯手写 CSS**（无第三方 UI 库）
- **深色主题**：青蓝 `#00d4ff` + 紫色 `#7c3aed`

## 后端 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/v1/dify/chat/message/stream` | GET | **流式发送消息（推荐）** - SSE 实时推送，避免超时 |
| `/v1/dify/chat/message` | POST | 阻塞式发送消息（兼容旧版，可能超时） |
| `/v1/dify/chat/conversations` | GET | 获取会话列表 |
| `/v1/dify/chat/conversations/{id}/messages` | GET | 获取会话消息 |
| `/v1/dify/chat/conversations/{id}` | DELETE | 删除会话 |
| `/v1/dify/chat/conversations/{id}/rename` | PUT | 重命名会话 |

### 流式接口详解（推荐使用）

**请求**:
```
GET /v1/dify/chat/message/stream?query=你的问题&conversationId=会话ID（可选）
Authorization: Bearer <token>
Accept: text/event-stream
```

**SSE 事件类型**:

| 事件名 | 数据字段 | 说明 |
|--------|----------|------|
| `workflow_started` | `workflowRunId`, `message` | 工作流开始处理 |
| `node_started` | `nodeId`, `nodeType`, `title` | 节点开始执行（如 MCP 工具调用） |
| `message` | `answer` | 消息片段（实时推送，多个） |
| `done` | `messageId`, `conversationId`, `fullAnswer` | 消息完成（包含完整回复） |
| `error` | `code`, `message` | 错误事件 |

**响应示例**:
```
event: workflow_started
data: {"workflowRunId":"4e8597e4-...","message":"工作流开始处理"}

event: node_started
data: {"nodeId":"xxx","nodeType":"tool","title":"查询教师课表"}

event: message
data: {"answer":"让我"}

event: message
data: {"answer":"为您查询"}

event: done
data: {"messageId":"msg-xxx","conversationId":"conv-xxx","fullAnswer":"让我为您查询..."}
```

---

## 用户需求

- **窗口尺寸**：可拖拽调整大小，移动端自动全屏
- **会话管理**：简洁模式，仅显示当前对话，界面清爽

---

## 实现方案

### 1. 新建 API 模块

**文件**: `src/api/dify.ts`

```typescript
import request from './index'

// 类型定义
export interface DifyChatRequest {
  query: string
  conversation_id?: string
}

export interface DifyChatResponse {
  message_id: string
  conversation_id: string
  answer: string
}

export interface DifyConversation {
  conversation_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface DifyMessage {
  message_id: string
  conversation_id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
}

// SSE 事件数据类型
export interface SSEWorkflowStartedEvent {
  workflowRunId: string
  message: string
}

export interface SSENodeStartedEvent {
  nodeId: string
  nodeType: string
  title: string
}

export interface SSEMessageEvent {
  answer: string
}

export interface SSEDoneEvent {
  messageId: string
  conversationId: string
  fullAnswer: string
}

export interface SSEErrorEvent {
  code: string
  message: string
}

// SSE 回调接口
export interface StreamCallbacks {
  onWorkflowStarted?: (data: SSEWorkflowStartedEvent) => void
  onNodeStarted?: (data: SSENodeStartedEvent) => void
  onMessage?: (data: SSEMessageEvent) => void
  onDone?: (data: SSEDoneEvent) => void
  onError?: (data: SSEErrorEvent) => void
}

/**
 * 流式发送消息（推荐使用）
 * 使用 fetch + ReadableStream 接收 SSE 事件
 * @returns abort 函数，用于取消请求
 */
export function sendMessageStream(
  query: string,
  conversationId: string | null,
  callbacks: StreamCallbacks
): () => void {
  const token = localStorage.getItem('token')
  const controller = new AbortController()

  const params = new URLSearchParams({ query })
  if (conversationId) {
    params.set('conversationId', conversationId)
  }

  fetch(`/v1/dify/chat/message/stream?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream'
    },
    signal: controller.signal
  }).then(async response => {
    if (!response.ok) {
      callbacks.onError?.({ code: String(response.status), message: '请求失败' })
      return
    }

    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 解析 SSE 格式: event: xxx\ndata: xxx\n\n
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留未完成的行

      let eventType = ''
      let eventData = ''

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          eventData = line.slice(5).trim()
        } else if (line === '' && eventType && eventData) {
          // 事件结束，处理
          try {
            const parsed = JSON.parse(eventData)
            switch (eventType) {
              case 'workflow_started':
                callbacks.onWorkflowStarted?.(parsed)
                break
              case 'node_started':
                callbacks.onNodeStarted?.(parsed)
                break
              case 'message':
                callbacks.onMessage?.(parsed)
                break
              case 'done':
                callbacks.onDone?.(parsed)
                break
              case 'error':
                callbacks.onError?.(parsed)
                break
            }
          } catch (e) {
            console.error('SSE 解析错误:', e)
          }
          eventType = ''
          eventData = ''
        }
      }
    }
  }).catch(err => {
    if (err.name !== 'AbortError') {
      callbacks.onError?.({ code: 'NETWORK_ERROR', message: err.message })
    }
  })

  return () => controller.abort()
}

// 阻塞式发送消息（兼容旧版，可能超时）
export function sendMessage(data: DifyChatRequest): Promise<DifyChatResponse> {
  return request.post('/v1/dify/chat/message', data)
}

export function getConversations(): Promise<DifyConversation[]> {
  return request.get('/v1/dify/chat/conversations')
}

export function getMessages(conversationId: string): Promise<DifyMessage[]> {
  return request.get(`/v1/dify/chat/conversations/${conversationId}/messages`)
}

export function deleteConversation(conversationId: string): Promise<void> {
  return request.delete(`/v1/dify/chat/conversations/${conversationId}`)
}

export function renameConversation(conversationId: string, name: string): Promise<void> {
  return request.put(`/v1/dify/chat/conversations/${conversationId}/rename`, { name })
}
```

### 2. 新建聊天助手组件

**文件**: `src/components/DifyChatAssistant.vue`

#### UI 设计

```
桌面端（可拖拽调整大小）:
┌─────────────────────────────────────┐
│ 🤖 智能调课助手            ─ ▽ ✕ │  ← 标题栏（可拖拽移动）
├─────────────────────────────────────┤
│                                     │
│ 🤖 您好！我是智能调课助手...        │  ← 消息区域
│    我可以帮您查询课表、教室...      │
│                                     │
│ 👤 周二下午有空教室吗？             │
│                                     │
│ 🤖 让我为您查询...                  │
│    周二下午有以下空教室...          │
│                                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────┬───┐│
│ │ 输入消息...                  │ ➤││  ← 输入区域
│ └─────────────────────────────┴───┘│
└─────────────────────────────────────┘
        ║
        ║  拖拽手柄（右下角）
        ▼
   ┌────┴────┐
   │    💬   │  ← 悬浮按钮（FAB）
   └─────────┘

移动端（全屏模式）:
┌───────────────────────┐
│ 🤖 智能调课助手   ✕  │
├───────────────────────┤
│                       │
│    消息区域           │
│    (占满剩余空间)     │
│                       │
├───────────────────────┤
│ [  输入消息...  ] [➤]│
└───────────────────────┘
```

#### 核心功能

1. **悬浮按钮（FAB）**
   - 固定在页面右下角
   - 点击切换聊天窗口显示/隐藏
   - 未读消息时显示红点提示

2. **聊天窗口**
   - 桌面端：默认 380x520px，可拖拽移动和调整大小
   - 移动端（<768px）：全屏显示
   - 支持最小化/关闭

3. **消息区域**
   - 自动滚动到最新消息
   - 用户消息靠右，AI 消息靠左
   - 支持 Markdown 渲染（可选）
   - **流式消息实时显示**

4. **输入区域**
   - 输入框 + 发送按钮
   - 支持 Enter 发送，Shift+Enter 换行

5. **简洁模式特性**
   - 不显示会话列表侧边栏
   - 提供"新对话"按钮
   - 刷新页面后恢复新对话

#### 核心代码结构

```vue
<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { sendMessageStream } from '@/api/dify'
import type { DifyMessage } from '@/api/dify'

// 用户登录状态
const userStore = useUserStore()
const { isLoggedIn } = storeToRefs(userStore)

// 窗口状态
const isOpen = ref(false)
const isMinimized = ref(false)
const isLoading = ref(false)

// 窗口位置和尺寸（可拖拽）
const windowStyle = ref({
  width: '380px',
  height: '520px',
  right: '24px',
  bottom: '96px'
})

// 拖拽相关
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 聊天状态
const messages = ref<DifyMessage[]>([])
const inputText = ref('')
const currentConversationId = ref<string | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)

// 流式消息状态
const streamingMessage = ref('')
const abortStream = ref<(() => void) | null>(null)

// 响应式：移动端全屏
const isMobile = computed(() => window.innerWidth < 768)

// 方法
function toggleWindow() { ... }
function startDrag(e: MouseEvent) { ... }
function onDrag(e: MouseEvent) { ... }
function endDrag() { ... }

async function handleSend() {
  if (!inputText.value.trim() || isLoading.value) return

  const query = inputText.value.trim()
  inputText.value = ''

  // 添加用户消息
  const userMsg: DifyMessage = {
    message_id: `temp-${Date.now()}`,
    conversation_id: currentConversationId.value || '',
    content: query,
    role: 'user',
    created_at: new Date().toISOString()
  }
  messages.value.push(userMsg)

  // 开始流式请求
  isLoading.value = true
  streamingMessage.value = ''

  abortStream.value = sendMessageStream(
    query,
    currentConversationId.value,
    {
      onWorkflowStarted: (data) => {
        console.log('工作流开始:', data.workflowRunId)
      },
      onNodeStarted: (data) => {
        console.log('节点执行:', data.title)
      },
      onMessage: (data) => {
        // 实时追加消息片段
        streamingMessage.value += data.answer
        scrollToBottom()
      },
      onDone: (data) => {
        // 消息完成
        isLoading.value = false
        currentConversationId.value = data.conversationId

        // 添加完整的 AI 消息
        const aiMsg: DifyMessage = {
          message_id: data.messageId,
          conversation_id: data.conversationId,
          content: data.fullAnswer,
          role: 'assistant',
          created_at: new Date().toISOString()
        }
        messages.value.push(aiMsg)
        streamingMessage.value = ''
        scrollToBottom()
      },
      onError: (data) => {
        isLoading.value = false
        streamingMessage.value = ''
        console.error('SSE 错误:', data.message)
        // 显示错误提示
      }
    }
  )

  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function startNewConversation() {
  messages.value = []
  currentConversationId.value = null
  if (abortStream.value) {
    abortStream.value()
    abortStream.value = null
  }
}

onUnmounted(() => {
  if (abortStream.value) {
    abortStream.value()
  }
})
</script>

<template>
  <!-- 仅登录后显示 -->
  <template v-if="isLoggedIn">
    <!-- 悬浮按钮 -->
    <div class="chat-fab" @click="toggleWindow">
      <span class="fab-icon">{{ isOpen && !isMinimized ? '✕' : '💬' }}</span>
    </div>

    <!-- 聊天窗口 -->
    <Transition name="chat-window">
      <div v-if="isOpen && !isMinimized"
           class="chat-window"
           :class="{ 'is-mobile': isMobile }"
           :style="isMobile ? {} : windowStyle">
        <!-- 标题栏（可拖拽） -->
        <div class="chat-header" @mousedown="startDrag">
          <span class="header-icon">🤖</span>
          <span class="header-title">智能调课助手</span>
          <div class="header-actions">
            <button class="btn-icon" @click="startNewConversation" title="新对话">+</button>
            <button class="btn-icon" @click="isMinimized = true" title="最小化">─</button>
            <button class="btn-icon" @click="isOpen = false" title="关闭">✕</button>
          </div>
        </div>

        <!-- 消息区域 -->
        <div ref="messagesContainer" class="chat-messages">
          <div v-if="messages.length === 0 && !streamingMessage" class="welcome-message">
            <div class="welcome-icon">🤖</div>
            <p>您好！我是智能调课助手</p>
            <p class="welcome-hint">我可以帮您查询课表、教室占用、排课冲突等</p>
          </div>
          <div v-for="msg in messages" :key="msg.message_id"
               :class="['message', msg.role]">
            <div class="message-content">{{ msg.content }}</div>
          </div>
          <!-- 流式消息实时显示 -->
          <div v-if="streamingMessage" class="message assistant streaming">
            <div class="message-content">{{ streamingMessage }}<span class="cursor-blink">▌</span></div>
          </div>
          <!-- 节点执行提示 -->
          <div v-if="isLoading && !streamingMessage" class="message assistant loading">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
          <input
            v-model="inputText"
            placeholder="输入消息..."
            @keyup.enter="handleSend"
            :disabled="isLoading"
          />
          <button class="btn-send" @click="handleSend" :disabled="!inputText.trim() || isLoading">
            ➤
          </button>
        </div>

        <!-- 拖拽调整大小手柄 -->
        <div v-if="!isMobile" class="resize-handle"></div>
      </div>
    </Transition>
  </template>
</template>

<style scoped>
/* 悬浮按钮 - 右下角固定 */
.chat-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
  cursor: pointer;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s, box-shadow 0.3s;
}
.chat-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(0, 212, 255, 0.6);
}

/* 聊天窗口 */
.chat-window {
  position: fixed;
  border-radius: 16px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chat-window.is-mobile {
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  border-radius: 0;
}

/* 标题栏 */
.chat-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  cursor: move;
  user-select: none;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 流式消息光标动画 */
.cursor-blink {
  animation: blink 1s infinite;
}
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 输入区域 */
.chat-input {
  display: flex;
  padding: 12px;
  gap: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 拖拽调整手柄 */
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: se-resize;
}

/* 动画 */
.chat-window-enter-active,
.chat-window-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.chat-window-enter-from,
.chat-window-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
```

### 3. 全局注册组件

**修改文件**: `src/App.vue`

```vue
<script setup lang="ts">
import DifyChatAssistant from '@/components/DifyChatAssistant.vue'
// ... 其他 imports
</script>

<template>
  <router-view />
  <DifyChatAssistant />
</template>
```

---

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/api/dify.ts` | 新建 | Dify API 模块（含流式接口） |
| `src/components/DifyChatAssistant.vue` | 新建 | 聊天助手组件 |
| `src/App.vue` | 修改 | 引入聊天助手组件 |

---

## 验证步骤

1. **编译验证**: `npm run build` 无错误
2. **功能测试**:
   - 登录后，页面右下角显示悬浮按钮
   - 点击按钮，弹出聊天窗口
   - 发送消息，**观察流式实时显示效果**
   - 消息片段逐字显示，完成后保存会话 ID
   - 桌面端可拖拽移动和调整大小
   - 移动端全屏显示
3. **样式验证**: 窗口与现有深色主题一致

---

## 注意事项

1. **登录状态**: 组件仅在有用户登录时显示
2. **Token 过期**: API 拦截器已处理 401 自动跳转登录
3. **流式消息**: 使用 `sendMessageStream` 获得更好的用户体验，避免超时
4. **取消请求**: 组件卸载时调用 abort 函数取消进行中的流式请求
