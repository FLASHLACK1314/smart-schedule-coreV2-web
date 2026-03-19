<script setup lang="ts">
import { ref, nextTick, watch, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { sendMessageStream, type DifyMessageDTO } from '@/api/dify'

const userStore = useUserStore()

// 状态
const isOpen = ref(false)
const isMinimized = ref(false)
const isLoading = ref(false)
const messages = ref<DifyMessageDTO[]>([])
const inputText = ref('')
const currentConversationId = ref<string | null>(null)
const isMobile = ref(false)

// SSE 流式状态
const streamingMessage = ref('')
const streamingMessageId = ref<string | null>(null)
const abortStream = ref<(() => void) | null>(null)
const currentNodeTitle = ref('')
const isMessageComplete = ref(false) // 标记消息是否已完成
const lastStreamContent = ref('') // 最后一次流式内容（用于兜底）

// 消息容器引用
const messagesContainer = ref<HTMLElement | null>(null)

// 是否显示悬浮按钮（仅登录用户可见）
const showFab = computed(() => userStore.isLoggedIn)

// 监听窗口打开，自动滚动到底部
watch(isOpen, (open) => {
  if (open) {
    nextTick(() => {
      scrollToBottom()
    })
  }
})

// 切换窗口显示
const toggleWindow = () => {
  if (isMinimized.value) {
    isMinimized.value = false
  } else {
    isOpen.value = !isOpen.value
  }
}

// 最小化窗口
const minimizeWindow = () => {
  isMinimized.value = true
}

// 关闭窗口
const closeWindow = () => {
  isOpen.value = false
  isMinimized.value = false
}

// 开始新对话
const startNewConversation = () => {
  currentConversationId.value = null
  messages.value = []
}

// 发送消息（SSE 流式模式）
const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  // 添加用户消息到列表
  const userMessage: DifyMessageDTO = {
    message_id: `temp-user-${Date.now()}`,
    conversation_id: currentConversationId.value || '',
    content: text,
    role: 'user',
    created_at: new Date().toISOString(),
  }
  messages.value.push(userMessage)
  inputText.value = ''
  isLoading.value = true
  streamingMessage.value = ''
  currentNodeTitle.value = ''

  // 滚动到底部
  nextTick(() => scrollToBottom())

  // 重置消息完成标记
  isMessageComplete.value = false

  try {
    const { abort } = sendMessageStream(
      {
        query: text,
        conversation_id: currentConversationId.value || undefined,
      },
      {
        onWorkflowStarted: () => {
          // 工作流开始
          nextTick(() => scrollToBottom())
        },
        onNodeStarted: (event) => {
          // 节点开始执行，显示当前节点
          currentNodeTitle.value = event.title || ''
        },
        onMessage: (textChunk) => {
          // 接收到消息片段，追加到流式消息
          streamingMessage.value += textChunk
          lastStreamContent.value = streamingMessage.value // 保存最新内容
          nextTick(() => scrollToBottom())
        },
        onDone: (data) => {
          console.log('onDone 被调用, data.answer 长度:', data.answer?.length)
          console.log('streamingMessage 长度:', streamingMessage.value.length)

          // 防止重复调用
          if (isMessageComplete.value) {
            console.log('onDone 已处理，跳过重复调用')
            return
          }
          isMessageComplete.value = true

          // 处理 null 值，生成临时 ID
          const messageId = data.message_id || `temp-assistant-${Date.now()}`
          const conversationId = data.conversation_id

          currentConversationId.value = conversationId
          streamingMessageId.value = messageId

          // 强制使用 done 事件的 answer（如果存在且非空）
          // 只有当 answer 为空时才使用流式累积内容作为兜底
          const finalContent = (data.answer && data.answer.trim())
            ? data.answer
            : streamingMessage.value || ''

          console.log('最终内容来源:', (data.answer && data.answer.trim()) ? 'done.answer' : '流式累积')
          console.log('最终内容前100字符:', finalContent.substring(0, 100) + '...')

          const assistantMessage: DifyMessageDTO = {
            message_id: messageId,
            conversation_id: conversationId || '',
            content: finalContent,
            role: 'assistant',
            created_at: new Date().toISOString(),
          }
          console.log('添加 assistant 消息, content 长度:', assistantMessage.content.length)
          messages.value.push(assistantMessage)

          // 清空流式状态
          streamingMessage.value = ''
          streamingMessageId.value = null
          currentNodeTitle.value = ''
          isLoading.value = false
          abortStream.value = null

          nextTick(() => scrollToBottom())
        },
        onStreamEnd: () => {
          // 流结束的兜底处理：如果 onDone 没有被调用，强制完成消息
          if (!isMessageComplete.value && streamingMessage.value) {
            console.log('流结束但 onDone 未触发，使用累积内容完成消息')
            isMessageComplete.value = true

            const messageId = `temp-assistant-${Date.now()}`
            const assistantMessage: DifyMessageDTO = {
              message_id: messageId,
              conversation_id: currentConversationId.value || '',
              content: streamingMessage.value,
              role: 'assistant',
              created_at: new Date().toISOString(),
            }
            messages.value.push(assistantMessage)

            // 清空流式状态
            streamingMessage.value = ''
            streamingMessageId.value = null
            currentNodeTitle.value = ''
            isLoading.value = false
            abortStream.value = null

            nextTick(() => scrollToBottom())
          } else if (!isMessageComplete.value) {
            // 没有任何内容，也要重置状态
            console.log('流结束，无内容，重置状态')
            isMessageComplete.value = true
            isLoading.value = false
            streamingMessage.value = ''
            currentNodeTitle.value = ''
          }
        },
        onError: (error) => {
          console.error('发送消息失败:', error)
          // 移除用户消息
          messages.value.pop()
          // 恢复输入内容
          inputText.value = text
          // 清空流式状态
          streamingMessage.value = ''
          currentNodeTitle.value = ''
          isLoading.value = false
          abortStream.value = null
        },
      }
    )

    abortStream.value = abort
  } catch (error: any) {
    console.error('发送消息失败:', error)
    // 移除用户消息
    messages.value.pop()
    // 恢复输入内容
    inputText.value = text
    isLoading.value = false
  }
}

// 处理键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 简单的 Markdown 渲染函数
const renderMarkdown = (text: string): string => {
  if (!text) return ''

  let html = text

  // 转义 HTML 特殊字符（除了我们要处理的 Markdown）
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 标题 ### ## #
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>')

  // 粗体 **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 斜体 *text* (单星号，避免与粗体冲突)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // 无序列表 * 或 - 开头
  html = html.replace(/^[*•] (.+)$/gm, '<li>$1</li>')

  // 将连续的 li 包装在 ul 中
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  // 分隔线 ---
  html = html.replace(/^---$/gm, '<hr>')

  // 换行处理：两个换行符变成段落
  html = html.replace(/\n\n/g, '</p><p>')
  html = `<p>${html}</p>`

  // 清理空段落
  html = html.replace(/<p>\s*<\/p>/g, '')

  return html
}

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  // 取消进行中的流式请求
  if (abortStream.value) {
    abortStream.value()
  }
})
</script>

<template>
  <!-- 悬浮按钮 -->
  <button
    v-if="showFab"
    class="fab-button"
    :class="{ active: isOpen && !isMinimized }"
    @click="toggleWindow"
    title="智能调课助手"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      ></path>
    </svg>
  </button>

  <!-- 聊天窗口 -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="chat-window"
      :class="{ minimized: isMinimized, mobile: isMobile }"
    >
      <!-- 标题栏 -->
      <div class="chat-header">
        <div class="header-title">
          <span class="title-text">智能调课助手</span>
          <span v-if="currentConversationId" class="new-chat" @click.stop="startNewConversation">
            新对话
          </span>
        </div>
        <div class="header-actions">
          <button class="action-btn" @click="minimizeWindow" title="最小化">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button class="action-btn close-btn" @click="closeWindow" title="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- 消息区域 -->
      <div ref="messagesContainer" class="chat-messages">
        <!-- 欢迎消息 -->
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-icon">👋</div>
          <div class="welcome-text">您好！我是智能调课助手</div>
          <div class="welcome-hint">您可以问我关于排课、调课的问题</div>
        </div>

        <!-- 消息列表 -->
        <div
          v-for="msg in messages"
          :key="msg.message_id"
          class="message-item"
          :class="msg.role"
        >
          <div class="message-content">
            <!-- assistant 消息使用 Markdown 渲染 -->
            <div
              v-if="msg.role === 'assistant'"
              class="message-text markdown-body"
              v-html="renderMarkdown(msg.content)"
            ></div>
            <!-- user 消息保持纯文本 -->
            <div v-else class="message-text">{{ msg.content }}</div>
            <div class="message-time">{{ formatTime(msg.created_at) }}</div>
          </div>
        </div>

        <!-- 流式消息（正在接收） -->
        <div v-if="streamingMessage" class="message-item assistant streaming">
          <div class="message-content">
            <div
              class="message-text markdown-body"
              v-html="renderMarkdown(streamingMessage)"
            ></div><span class="cursor"></span>
          </div>
        </div>

        <!-- 节点执行状态（可选显示） -->
        <div v-if="currentNodeTitle && !streamingMessage" class="node-status">
          <span class="node-indicator"></span>
          <span>{{ currentNodeTitle }}</span>
        </div>

        <!-- 加载中动画 -->
        <div v-if="isLoading && !streamingMessage && !currentNodeTitle" class="message-item assistant loading">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <textarea
          v-model="inputText"
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          :disabled="isLoading"
          @keydown="handleKeydown"
          rows="1"
        ></textarea>
        <button class="send-btn" :disabled="!inputText.trim() || isLoading" @click="handleSend">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 悬浮按钮 */
.fab-button {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}

.fab-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 30px rgba(0, 212, 255, 0.4);
}

.fab-button.active {
  background: linear-gradient(135deg, #7c3aed 0%, #00d4ff 100%);
}

/* 聊天窗口 */
.chat-window {
  position: fixed;
  right: 24px;
  bottom: 96px;
  width: 380px;
  height: 520px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 212, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  overflow: hidden;
  transition: opacity 0.3s, transform 0.3s;
}

.chat-window.minimized {
  height: 48px;
}

/* 移动端全屏 */
@media (max-width: 767px) {
  .chat-window {
    width: 100%;
    height: 100%;
    right: 0 !important;
    bottom: 0 !important;
    border-radius: 0;
  }

  .chat-window.minimized {
    height: 48px;
  }
}

/* 标题栏 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  user-select: none;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-text {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.new-chat {
  font-size: 12px;
  color: #00d4ff;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 212, 255, 0.1);
  transition: all 0.2s;
}

.new-chat:hover {
  background: rgba(0, 212, 255, 0.2);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #a0aec0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.close-btn:hover {
  background: rgba(255, 82, 82, 0.3);
  color: #ff5252;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 自定义滚动条 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  gap: 12px;
}

.welcome-icon {
  font-size: 48px;
  animation: wave 1.5s infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
}

.welcome-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.welcome-hint {
  font-size: 13px;
  color: #a0aec0;
}

/* 消息项 */
.message-item {
  display: flex;
  max-width: 85%;
}

.message-item.user {
  align-self: flex-end;
}

.message-item.assistant {
  align-self: flex-start;
}

.message-content {
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
}

.message-item.user .message-content {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-item.assistant .message-content {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-bottom-left-radius: 4px;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

/* Markdown 渲染样式 */
.markdown-body {
  white-space: normal;
}

.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  margin: 12px 0 8px 0;
  font-weight: 600;
  line-height: 1.4;
}

.markdown-body h2 { font-size: 16px; }
.markdown-body h3 { font-size: 15px; }
.markdown-body h4 { font-size: 14px; }

.markdown-body p {
  margin: 8px 0;
}

.markdown-body strong {
  font-weight: 600;
  color: #00d4ff;
}

.markdown-body em {
  font-style: italic;
}

.markdown-body ul {
  margin: 8px 0;
  padding-left: 20px;
  list-style-type: disc;
}

.markdown-body li {
  margin: 4px 0;
  line-height: 1.6;
}

.markdown-body hr {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin: 12px 0;
}

.message-time {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
  text-align: right;
}

/* 加载动画 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border-bottom-left-radius: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00d4ff;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8px); opacity: 1; }
}

/* 流式消息光标闪烁 */
.message-item.streaming .message-content {
  display: flex;
  align-items: flex-end;
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: #00d4ff;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 节点执行状态 */
.node-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: #a0aec0;
  align-self: flex-start;
}

.node-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00d4ff;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 输入区域 */
.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-input textarea {
  flex: 1;
  min-height: 40px;
  max-height: 100px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: all 0.2s;
}

.chat-input textarea::placeholder {
  color: #a0aec0;
}

.chat-input textarea:focus {
  border-color: rgba(0, 212, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.chat-input textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
