<script setup lang="ts">
import {
  ref, nextTick, watch, computed, onMounted, onUnmounted
} from 'vue'
import { useUserStore } from '@/stores/user'
import { useMessage } from '@/composables/useMessage'
import { useConfirm, setConfirmRef } from '@/composables/useConfirm'
import {
  sendMessageStream,
  getConversations,
  getMessages,
  deleteConversation as deleteConversationApi,
  renameConversation as renameConversationApi,
  type DifyMessageDTO,
  type DifyConversationDTO,
  type TeacherScheduleQueryDTO,
  type TimeSlotCheckDTO
} from '@/api/dify'
import { getSemesterPage } from '@/api/semester'
import type { SemesterInfoDTO } from '@/api/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import TeacherScheduleTable from '@/components/TeacherScheduleTable.vue'
import TimeSlotCheckCard from '@/components/TimeSlotCheckCard.vue'

const userStore = useUserStore()
const { error: showError, success: showSuccess } = useMessage()
const { confirm } = useConfirm()

// localStorage keys
const CONVERSATION_ID_KEY = 'dify_conversation_id'

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
const isJsonStreaming = ref(false) // 标记是否为 JSON 流式响应

// 确认对话框引用
const confirmDialogRef = ref<{ show: (opts: any) => Promise<boolean> } | null>(null)

// 消息容器引用
const messagesContainer = ref<HTMLElement | null>(null)

// 会话列表相关状态
const conversations = ref<DifyConversationDTO[]>([])
const isLoadingConversations = ref(false)
const showConversationList = ref(false)

// 重命名相关状态
const editingConversationId = ref<string | null>(null)
const editingName = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

// 学期相关状态
const semesters = ref<SemesterInfoDTO[]>([])
const selectedSemesterUuid = ref<string | null>(null)
const isLoadingSemesters = ref(false)

// 是否显示悬浮按钮（仅登录用户可见）
const showFab = computed(() => userStore.isLoggedIn)

// 监听窗口打开，自动加载会话列表和学期列表
watch(isOpen, (open) => {
  if (open) {
    if (semesters.value.length === 0) {
      loadSemesters()
    }
    loadConversations()
    nextTick(() => scrollToBottom())
  }
})

// 监听学期切换，自动新建会话并持久化选择
watch(selectedSemesterUuid, (newUuid, oldUuid) => {
  if (oldUuid && newUuid !== oldUuid) {
    // 切换学期，新建会话
    startNewConversation()
    // 持久化选择
    if (newUuid) {
      localStorage.setItem('dify_semester_uuid', newUuid)
    }
  }
})

// 监听会话 ID 变化，自动持久化
watch(currentConversationId, (newId) => {
  if (newId) {
    localStorage.setItem(CONVERSATION_ID_KEY, newId)
  } else {
    localStorage.removeItem(CONVERSATION_ID_KEY)
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
  showConversationList.value = false
}

// 加载会话列表
const loadConversations = async () => {
  isLoadingConversations.value = true
  console.log('[DifyChat] 开始加载会话列表')
  try {
    conversations.value = await getConversations()
    console.log('[DifyChat] 会话列表:', conversations.value)
    console.log('[DifyChat] 会话数量:', conversations.value?.length || 0)

    // 打印每个会话的详细结构
    if (conversations.value && conversations.value.length > 0) {
      conversations.value.forEach((conv, index) => {
        console.log(`[DifyChat] 会话[${index}] 字段:`, Object.keys(conv))
        console.log(`[DifyChat] 会话[${index}] 完整数据:`, JSON.stringify(conv, null, 2))
      })
    }
  } catch (error: any) {
    console.error('[DifyChat] 加载会话列表失败:', error)
    showError('加载会话列表失败：' + (error.message || '未知错误'))
  } finally {
    isLoadingConversations.value = false
  }
}

// 切换到会话列表
const toggleConversationList = async () => {
  showConversationList.value = !showConversationList.value
  if (showConversationList.value && conversations.value.length === 0) {
    await loadConversations()
  }
}

// 加载指定会话的历史消息
const loadConversationMessages = async (conversationId: string) => {
  console.log('[DifyChat] 加载历史消息, conversationId:', conversationId)
  try {
    const historyMessages = await getMessages(conversationId)
    console.log('[DifyChat] API 返回的原始消息数据:', historyMessages)
    console.log('[DifyChat] 消息数量:', historyMessages?.length || 0)

    // 检查消息结构
    if (historyMessages && historyMessages.length > 0) {
      historyMessages.forEach((msg, index) => {
        console.log(`[DifyChat] 消息[${index}]:`, {
          id: (msg as any).id,
          query: (msg as any).query?.substring(0, 50),
          answer: (msg as any).answer?.substring(0, 50),
          created_at: (msg as any).created_at
        })
      })
    }

    // 转换消息格式：后端返回的是 {id, query, answer} 格式，需要拆分成 user/assistant 消息
    const convertedMessages: DifyMessageDTO[] = []
    historyMessages.forEach((msg: any, index: number) => {
      const createdAt = typeof msg.created_at === 'number'
        ? new Date(msg.created_at * 1000).toISOString()
        : msg.created_at

      // 用户消息
      if (msg.query) {
        convertedMessages.push({
          message_id: `${msg.id}-user`,
          conversation_id: conversationId,
          content: msg.query,
          role: 'user',
          created_at: createdAt,
        })
      }
      // AI 回复消息
      if (msg.answer) {
        console.log('[loadConversationMessages] 历史 answer:', msg.answer?.substring?.(0, 300))
        console.log('[loadConversationMessages] resolveAnswerType 结果:', resolveAnswerType(msg.answer))
        convertedMessages.push({
          message_id: `${msg.id}-assistant`,
          conversation_id: conversationId,
          content: msg.answer,
          role: 'assistant',
          created_at: createdAt,
        })
      }
    })

    messages.value = convertedMessages
    currentConversationId.value = conversationId
    showConversationList.value = false

    console.log('[DifyChat] 处理后的消息列表:', messages.value)
    nextTick(() => scrollToBottom())
  } catch (error: any) {
    console.error('[DifyChat] 加载历史消息失败:', error)
    showError('加载历史消息失败：' + (error.message || '未知错误'))
  }
}

// 切换会话
const switchConversation = async (conversationId: string) => {
  await loadConversationMessages(conversationId)
}

// 删除会话
const handleDeleteConversation = async (conversationId: string, event: Event) => {
  event.stopPropagation()

  const confirmed = await confirm('确定要删除这个会话吗？', {
    title: '删除会话',
    confirmText: '删除',
    cancelText: '取消',
    type: 'danger'
  })
  if (!confirmed) return

  try {
    await deleteConversationApi(conversationId)
    // 从列表中移除
    conversations.value = conversations.value.filter(c => c.id !== conversationId)
    // 如果删除的是当前会话，清空消息
    if (currentConversationId.value === conversationId) {
      currentConversationId.value = null
      messages.value = []
    }
    showSuccess('会话已删除')
  } catch (error: any) {
    showError('删除会话失败：' + (error.message || '未知错误'))
  }
}

// 加载学期列表
const loadSemesters = async () => {
  isLoadingSemesters.value = true
  try {
    const result = await getSemesterPage({ page: 1, size: 100 })
    semesters.value = result.records
    // 恢复或自动选择当前学期
    selectDefaultSemester()
  } catch (error: any) {
    showError('加载学期列表失败：' + (error.message || '未知错误'))
  } finally {
    isLoadingSemesters.value = false
  }
}

// 默认选择学期
const selectDefaultSemester = () => {
  if (!semesters.value || semesters.value.length === 0) return

  // 1. 尝试从 localStorage 恢复
  const savedUuid = localStorage.getItem('dify_semester_uuid')
  if (savedUuid && semesters.value.some(s => s.semester_uuid === savedUuid)) {
    selectedSemesterUuid.value = savedUuid
    return
  }
  // 2. 根据当前日期自动匹配
  const today = new Date().toISOString().split('T')[0] || ''
  const current = semesters.value.find(s =>
    s.start_date <= today && s.end_date >= today
  )
  if (current) {
    selectedSemesterUuid.value = current.semester_uuid
  } else {
    // 3. 默认选择第一个学期（最新的）
    selectedSemesterUuid.value = semesters.value[0]?.semester_uuid || null
  }
}

// 开始重命名
const startRenameConversation = (conversationId: string, currentName: string, event: Event) => {
  event.stopPropagation()
  editingConversationId.value = conversationId
  editingName.value = currentName
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

// 确认重命名
const confirmRename = async (conversationId: string) => {
  const newName = editingName.value.trim()
  if (!newName) {
    cancelRename()
    return
  }

  try {
    await renameConversationApi(conversationId, newName)
    // 更新本地列表
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (conversation) {
      conversation.name = newName
    }
  } catch (error: any) {
    showError('重命名失败：' + (error.message || '未知错误'))
  } finally {
    editingConversationId.value = null
    editingName.value = ''
  }
}

// 取消重命名
const cancelRename = () => {
  editingConversationId.value = null
  editingName.value = ''
}

// 处理重命名输入框键盘事件
const handleRenameKeydown = (e: KeyboardEvent, conversationId: string) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    confirmRename(conversationId)
  } else if (e.key === 'Escape') {
    cancelRename()
  }
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
        semester_uuid: selectedSemesterUuid.value || undefined,
        forceNew: !currentConversationId.value, // 新对话时强制创建
      },
      {
        onWorkflowStarted: () => {
          // 工作流开始
          nextTick(() => debouncedScrollToBottom())
        },
        onNodeStarted: (event) => {
          // 节点开始执行，显示当前节点
          currentNodeTitle.value = event.title || ''
        },
        onMessage: (textChunk) => {
          // 接收到消息片段，追加到流式消息
          streamingMessage.value += textChunk
          // 检测是否为 JSON 响应（可能是带引号的 JSON 字符串）
          const trimmed = streamingMessage.value.trim()
          if (trimmed.startsWith('{') || trimmed.startsWith('"')) {
            isJsonStreaming.value = true
          }
          nextTick(() => debouncedScrollToBottom())
        },
        onMessageEnd: (data) => {
          // 从 message_end 事件获取 conversation_id
          if (data.conversation_id) {
            currentConversationId.value = data.conversation_id
          }
        },
        onWorkflowFinished: (data) => {
          // 防止重复调用
          if (isMessageComplete.value) {
            return
          }
          isMessageComplete.value = true

          currentConversationId.value = data.conversation_id
          console.log('[onWorkflowFinished] 收到的 data.answer:', data.answer?.substring?.(0, 300))
          console.log('[onWorkflowFinished] data.answer 类型:', typeof data.answer)

          // 使用 workflow_finished 的完整 answer（如果存在且非空）
          // 只有当 answer 为空时才使用流式累积内容作为兜底
          const finalContent = (data.answer && data.answer.trim())
            ? data.answer
            : streamingMessage.value || ''

          console.log('[onWorkflowFinished] 最终 content:', finalContent.substring(0, 300))
          console.log('[onWorkflowFinished] resolveAnswerType 结果:', resolveAnswerType(finalContent))

          const assistantMessage: DifyMessageDTO = {
            message_id: `temp-assistant-${Date.now()}`,
            conversation_id: data.conversation_id || '',
            content: finalContent,
            role: 'assistant',
            created_at: new Date().toISOString(),
          }
          messages.value.push(assistantMessage)

          // 清空流式状态
          streamingMessage.value = ''
          streamingMessageId.value = null
          currentNodeTitle.value = ''
          isJsonStreaming.value = false
          isLoading.value = false
          abortStream.value = null

          nextTick(() => scrollToBottom())
        },
        onStreamEnd: () => {
          // 流结束的兜底处理：如果 onWorkflowFinished 没有被调用，强制完成消息
          if (!isMessageComplete.value && streamingMessage.value) {
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
            isJsonStreaming.value = false
            isLoading.value = false
            abortStream.value = null

            nextTick(() => scrollToBottom())
          } else if (!isMessageComplete.value) {
            // 没有任何内容，也要重置状态
            isMessageComplete.value = true
            isLoading.value = false
            streamingMessage.value = ''
            isJsonStreaming.value = false
            currentNodeTitle.value = ''
          }
        },
        onError: (error) => {
          // 显示错误提示给用户
          showError('发送失败：' + error.message)
          // 移除用户消息
          messages.value.pop()
          // 恢复输入内容
          inputText.value = text
          // 清空流式状态
          streamingMessage.value = ''
          isJsonStreaming.value = false
          currentNodeTitle.value = ''
          isLoading.value = false
          abortStream.value = null
        },
      }
    )

    abortStream.value = abort
  } catch (error: any) {
    showError('发送失败：' + (error.message || '未知错误'))
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

// 防抖函数
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

// 防抖滚动（100ms）
const debouncedScrollToBottom = debounce(scrollToBottom, 100)

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 格式化会话时间（相对时间）
const formatConversationTime = (dateStrOrNum: string | number) => {
  const date = typeof dateStrOrNum === 'number'
    ? new Date(dateStrOrNum * 1000) // 时间戳（秒）转毫秒
    : new Date(dateStrOrNum)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 响应类型
type AnswerType = 'text' | 'teacher-schedule' | 'time-slot-check'

// 蛇形转驼峰的辅助函数
const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// 递归转换对象的所有 key 为驼峰命名
const transformKeysToCamel = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(transformKeysToCamel)
  }
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = transformKeysToCamel(value)
  }
  return result
}

// 解析响应类型
const resolveAnswerType = (answer: string): {
  type: AnswerType
  data?: TeacherScheduleQueryDTO | TimeSlotCheckDTO
} => {
  let content = answer.trim()
  console.log('[resolveAnswerType] 原始 answer:', content.substring(0, 200))

  // 处理双重编码：如果值是带引号的字符串，先解析一次
  if (content.startsWith('"') && content.endsWith('"')) {
    console.log('[resolveAnswerType] 检测到双重编码，尝试解析...')
    try {
      content = JSON.parse(content)
      console.log('[resolveAnswerType] 第一次解析后:', typeof content, content.substring?.(0, 200) || content)
    } catch (e) {
      console.log('[resolveAnswerType] 第一次解析失败:', e)
      return { type: 'text' }
    }
  }

  // 检查是否为 JSON
  if (content.startsWith('{') && content.endsWith('}')) {
    try {
      const parsed = JSON.parse(content)
      console.log('[resolveAnswerType] JSON 解析成功, 原始 keys:', Object.keys(parsed))
      // 转换字段名为驼峰命名
      const transformed = transformKeysToCamel(parsed)
      console.log('[resolveAnswerType] 转换后 keys:', Object.keys(transformed))
      console.log('[resolveAnswerType] teachers 字段:', transformed.teachers ? '存在' : '不存在')
      console.log('[resolveAnswerType] timeSlot 字段:', transformed.timeSlot ? '存在' : '不存在')

      // 根据字段判断具体类型
      if (transformed.teachers !== undefined) {
        console.log('[resolveAnswerType] 识别为 teacher-schedule')
        return { type: 'teacher-schedule', data: transformed as TeacherScheduleQueryDTO }
      }
      if (transformed.timeSlot !== undefined) {
        console.log('[resolveAnswerType] 识别为 time-slot-check')
        return { type: 'time-slot-check', data: transformed as TimeSlotCheckDTO }
      }
    } catch (e) {
      console.log('[resolveAnswerType] JSON 解析失败:', e)
    }
  }

  console.log('[resolveAnswerType] 识别为 text')
  return { type: 'text' }
}

// 增强的 Markdown 渲染函数（支持表格）
const renderMarkdown = (text: string): string => {
  if (!text) return ''

  let html = text

  // 转义 HTML 特殊字符（除了我们要处理的 Markdown）
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 处理表格（必须在其他处理之前）
  // 匹配表格块：表头行 + 分隔行 + 数据行
  const tableRegex = /^(\|.+\|)\n(\|[-:| ]+\|)\n((?:\|.+\|\n?)+)/gm
  html = html.replace(tableRegex, (_, headerRow, separatorRow, bodyRows) => {
    // 解析表头
    const headers = headerRow.split('|').filter((h: string) => h.trim())
    const headerHtml = headers.map((h: string) => `<th>${h.trim()}</th>`).join('')

    // 解析对齐方式
    const alignments = separatorRow.split('|').filter((a: string) => a.trim())
    const alignStyles = alignments.map((a: string) => {
      const align = a.trim()
      if (align.startsWith(':') && align.endsWith(':')) return 'center'
      if (align.endsWith(':')) return 'right'
      return 'left'
    })

    // 解析数据行
    const rows = bodyRows.trim().split('\n').filter((r: string) => r.trim())
    const bodyHtml = rows.map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim())
      const cellsHtml = cells.map((c: string, i: number) => {
        const style = alignStyles[i] ? `style="text-align:${alignStyles[i]}"` : ''
        return `<td ${style}>${c.trim()}</td>`
      }).join('')
      return `<tr>${cellsHtml}</tr>`
    }).join('')

    return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`
  })

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

  // 换行处理：两个换行符变成段落（排除已经在表格等块级元素中的内容）
  html = html.replace(/\n\n/g, '</p><p>')
  html = `<p>${html}</p>`

  // 清理空段落和表格前后的空 p 标签
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/<p>\s*<table>/g, '<table>')
  html = html.replace(/<\/table>\s*<\/p>/g, '</table>')

  return html
}

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  // 初始化确认对话框引用
  if (confirmDialogRef.value) {
    setConfirmRef(confirmDialogRef.value)
  }
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
          <!-- 学期选择器 -->
          <select
            v-model="selectedSemesterUuid"
            class="semester-select"
            :disabled="isLoadingSemesters"
            title="选择学期"
          >
            <option :value="null" disabled>选择学期</option>
            <option
              v-for="sem in semesters"
              :key="sem.semester_uuid"
              :value="sem.semester_uuid"
            >
              {{ sem.semester_name }}
            </option>
          </select>
          <span class="header-actions-mobile">
            <button
              class="action-btn"
              :class="{ active: showConversationList }"
              @click="toggleConversationList"
              title="历史会话"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
            <span v-if="currentConversationId" class="new-chat" @click.stop="startNewConversation">
              新对话
            </span>
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

      <!-- 会话列表面板 -->
      <div v-if="showConversationList" class="conversation-list-panel">
        <div class="panel-header">
          <span>历史会话</span>
          <button class="refresh-btn" @click="loadConversations" :disabled="isLoadingConversations" title="刷新">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: isLoadingConversations }">
              <path d="M21 2v6h-6M3 22v-6h6M21 12A9 9 0 0 0 6 5.3L3 8M3 12a9 9 0 0 0 15 6.7l3-2.7"/>
            </svg>
          </button>
        </div>

        <!-- 加载中 -->
        <div v-if="isLoadingConversations && conversations.length === 0" class="loading-conversations">
          <span class="loading-spinner"></span>
          <span>加载中...</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="conversations.length === 0" class="empty-conversations">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>暂无历史会话</span>
        </div>

        <!-- 会话列表 -->
        <div v-else class="conversation-items">
          <div
            v-for="conv in conversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: currentConversationId === conv.id }"
            @click="switchConversation(conv.id)"
          >
            <div class="conv-info">
              <!-- 重命名模式 -->
              <input
                v-if="editingConversationId === conv.id"
                ref="renameInputRef"
                v-model="editingName"
                class="rename-input"
                @click.stop
                @keydown="handleRenameKeydown($event, conv.id)"
                @blur="confirmRename(conv.id)"
              />
              <!-- 普通显示模式 -->
              <template v-else>
                <span class="conv-name">{{ conv.name || '未命名会话' }}</span>
                <span class="conv-time">{{ formatConversationTime(conv.updated_at) }}</span>
              </template>
            </div>
            <!-- 操作按钮 -->
            <div v-if="editingConversationId !== conv.id" class="conv-actions">
              <button class="conv-action-btn" @click="startRenameConversation(conv.id, conv.name, $event)" title="重命名">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>
              <button class="conv-action-btn delete" @click="handleDeleteConversation(conv.id, $event)" title="删除">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 消息区域 -->
      <div v-show="!showConversationList" ref="messagesContainer" class="chat-messages">
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
            <!-- assistant 消息根据类型渲染 -->
            <template v-if="msg.role === 'assistant'">
              <!-- 教师课表 -->
              <TeacherScheduleTable
                v-if="resolveAnswerType(msg.content).type === 'teacher-schedule' && resolveAnswerType(msg.content).data"
                :data="resolveAnswerType(msg.content).data as TeacherScheduleQueryDTO"
              />
              <!-- 时间槽检测 -->
              <TimeSlotCheckCard
                v-else-if="resolveAnswerType(msg.content).type === 'time-slot-check' && resolveAnswerType(msg.content).data"
                :data="resolveAnswerType(msg.content).data as TimeSlotCheckDTO"
              />
              <!-- 普通 Markdown -->
              <div
                v-else
                class="message-text markdown-body"
                v-html="renderMarkdown(msg.content)"
              ></div>
            </template>
            <!-- user 消息保持纯文本 -->
            <div v-else class="message-text">{{ msg.content }}</div>
            <div class="message-time">{{ formatTime(msg.created_at) }}</div>
          </div>
        </div>

        <!-- 流式消息（正在接收） -->
        <div v-if="streamingMessage" class="message-item assistant streaming">
          <div class="message-content">
            <!-- JSON 流式期间显示 loading -->
            <div v-if="isJsonStreaming" class="json-loading">
              <span class="loading-spinner"></span>
              <span>正在查询...</span>
            </div>
            <!-- 非 JSON 流式期间正常渲染 -->
            <template v-else>
              <div
                class="message-text markdown-body"
                v-html="renderMarkdown(streamingMessage)"
              ></div><span class="cursor"></span>
            </template>
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
      <div v-show="!showConversationList" class="chat-input">
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

  <!-- 确认对话框 -->
  <ConfirmDialog ref="confirmDialogRef" />
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
  width: 480px;
  height: 640px;
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

/* 表格样式 */
.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.markdown-body thead {
  background: rgba(0, 212, 255, 0.15);
}

.markdown-body th {
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: #00d4ff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.markdown-body td {
  padding: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #fff;
}

.markdown-body tbody tr:last-child td {
  border-bottom: none;
}

.markdown-body tbody tr:hover {
  background: rgba(255, 255, 255, 0.05);
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

/* JSON 流式加载状态 */
.json-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a0aec0;
  padding: 8px 0;
  font-size: 14px;
}

.json-loading .loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

/* 标题栏按钮区域 */
.header-actions-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions-mobile .action-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #a0aec0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.header-actions-mobile .action-btn:hover,
.header-actions-mobile .action-btn.active {
  background: rgba(0, 212, 255, 0.2);
  color: #00d4ff;
}

/* 会话列表面板 */
.conversation-list-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.refresh-btn {
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

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.refresh-btn .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 加载状态 */
.loading-conversations,
.empty-conversations {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #a0aec0;
  font-size: 13px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 会话列表 */
.conversation-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-items::-webkit-scrollbar {
  width: 4px;
}

.conversation-items::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-items::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.conversation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.conversation-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.conversation-item.active {
  background: rgba(0, 212, 255, 0.15);
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.conv-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.conv-name {
  font-size: 13px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-time {
  font-size: 11px;
  color: #a0aec0;
}

.rename-input {
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 212, 255, 0.5);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 13px;
  outline: none;
}

.rename-input:focus {
  border-color: #00d4ff;
}

.conv-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.conversation-item:hover .conv-actions {
  opacity: 1;
}

.conv-action-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #a0aec0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.conv-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.conv-action-btn.delete:hover {
  background: rgba(255, 82, 82, 0.3);
  color: #ff5252;
}

/* 学期选择器 */
.semester-select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: #a0aec0;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  max-width: 150px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  transition: all 0.2s;
}

.semester-select:hover {
  border-color: rgba(0, 212, 255, 0.3);
}
.semester-select:focus {
  border-color: #00d4ff;
  background: rgba(0, 0, 0, 0.5);
}
.semester-select:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.semester-select option {
  background: #1a1a2e;
  color: #fff;
}
</style>
