import request from './index'

// ========== 类型定义 ==========

/**
 * 发送消息请求体
 */
export interface DifyChatVO {
  query: string // 用户消息内容
  conversation_id?: string // 会话ID（可选，首次为空）
  semester_uuid?: string // 学期UUID（可选，用于 MCP 工具调用时指定学期上下文）
}

/**
 * 发送消息响应
 */
export interface DifyChatResponseDTO {
  message_id: string // 消息ID
  conversation_id: string // 会话ID（用于后续对话）
  answer: string // AI 回复内容
}

/**
 * 会话信息
 */
export interface DifyConversationDTO {
  conversation_id: string // 会话ID
  name: string // 会话名称
  created_at: string // 创建时间
  updated_at: string // 更新时间
}

/**
 * 消息信息
 */
export interface DifyMessageDTO {
  message_id: string // 消息ID
  conversation_id: string // 会话ID
  content: string // 消息内容
  role: 'user' | 'assistant' // 消息角色
  created_at: string // 创建时间
}

// ========== SSE 流式类型定义 ==========

/**
 * SSE 工作流开始事件 - 扁平结构
 */
export interface SSEWorkflowStartedEvent {
  event: 'workflow_started'
  workflow_run_id: string
  message?: string
}

/**
 * SSE 节点开始执行事件 - 扁平结构
 */
export interface SSENodeStartedEvent {
  event: 'node_started'
  node_id: string
  node_type: string
  title: string
}

/**
 * SSE 消息片段事件
 */
export interface SSEMessageEvent {
  event: 'message'
  answer: string
}

/**
 * SSE 工作流结束事件（替代原来的 done）
 * 后端实际返回格式
 */
export interface SSEWorkflowFinishedEvent {
  event: 'workflow_finished'
  conversation_id: string
  data: {
    status: string
    outputs: {
      answer: string
      files: any[]
    }
    total_tokens: number
    elapsed_time: number
  }
}

/**
 * SSE 错误事件
 */
export interface SSEErrorEvent {
  event: 'error'
  code: string
  message: string
}

/**
 * SSE 事件联合类型
 */
export type SSEEvent =
  | SSEWorkflowStartedEvent
  | SSENodeStartedEvent
  | SSEMessageEvent
  | SSEWorkflowFinishedEvent
  | SSEErrorEvent

/**
 * SSE 流式回调函数
 */
export interface StreamCallbacks {
  /** 工作流开始回调 */
  onWorkflowStarted?: (event: SSEWorkflowStartedEvent) => void
  /** 节点开始执行回调 */
  onNodeStarted?: (event: SSENodeStartedEvent) => void
  /** 消息片段回调 - 接收到部分消息 */
  onMessage?: (text: string) => void
  /** 工作流完成回调 - 包含完整的 answer */
  onWorkflowFinished?: (data: { conversation_id: string; answer: string; total_tokens?: number }) => void
  /** 流结束回调 - 无论是否收到 workflow_finished 事件都会触发，用于兜底处理 */
  onStreamEnd?: () => void
  /** 错误回调 */
  onError?: (error: Error) => void
}

// ========== API 函数 ==========

/**
 * 发送消息（创建或继续会话）
 * @param data 消息数据
 * @returns AI 回复
 */
export const sendMessage = (data: DifyChatVO): Promise<DifyChatResponseDTO> => {
  return request({
    url: '/v1/dify/chat/message',
    method: 'POST',
    data,
  })
}

/**
 * 获取会话列表
 * @returns 会话列表
 */
export const getConversations = (): Promise<DifyConversationDTO[]> => {
  return request({
    url: '/v1/dify/chat/conversations',
    method: 'GET',
  })
}

/**
 * 获取会话历史消息
 * @param conversationId 会话ID
 * @returns 消息列表
 */
export const getMessages = (conversationId: string): Promise<DifyMessageDTO[]> => {
  return request({
    url: `/v1/dify/chat/conversations/${conversationId}/messages`,
    method: 'GET',
  })
}

/**
 * 删除会话
 * @param conversationId 会话ID
 */
export const deleteConversation = (conversationId: string): Promise<void> => {
  return request({
    url: `/v1/dify/chat/conversations/${conversationId}`,
    method: 'DELETE',
  })
}

/**
 * 重命名会话
 * @param conversationId 会话ID
 * @param name 新名称
 */
export const renameConversation = (conversationId: string, name: string): Promise<void> => {
  return request({
    url: `/v1/dify/chat/conversations/${conversationId}/name`,
    method: 'PUT',
    params: { name },
  })
}

// ========== SSE 流式 API ==========

/**
 * 发送消息（SSE 流式模式）
 * @param data 消息数据
 * @param callbacks 回调函数集合
 * @returns abort 函数，用于取消请求
 */
export const sendMessageStream = (
  data: DifyChatVO,
  callbacks: StreamCallbacks
): { abort: () => void } => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''
  const token = localStorage.getItem('token')

  // 构建 query string
  const params = new URLSearchParams()
  params.append('query', data.query)
  if (data.conversation_id) {
    params.append('conversation_id', data.conversation_id)
  }
  if (data.semester_uuid) {
    params.append('semester_uuid', data.semester_uuid)
  }
  const url = `${baseURL}/v1/dify/chat/message/stream?${params.toString()}`

  const abortController = new AbortController()

  // 异步处理 SSE 流
  ;(async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: token } : {}),
          Accept: 'text/event-stream',
        },
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = '请求失败'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error_message || errorJson.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        callbacks.onError?.(new Error(errorMessage))
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError?.(new Error('无法获取响应流'))
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // 解析 SSE 事件
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一个不完整的行

        let eventType = ''
        let eventData = ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            eventData = line.slice(5).trim()
          } else if (line === '' && eventType && eventData) {
            // 空行表示事件结束，处理事件
            try {
              const parsedData = JSON.parse(eventData)
              handleSSEEvent(eventType, parsedData, callbacks)
            } catch (e) {
              console.warn('解析 SSE 数据失败:', e)
            }
            eventType = ''
            eventData = ''
          }
        }
      }

      // 流结束时，触发 onStreamEnd 回调（用于兜底处理）
      callbacks.onStreamEnd?.()
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // 请求被取消，不触发错误回调
        return
      }
      callbacks.onError?.(error)
    }
  })()

  return {
    abort: () => abortController.abort(),
  }
}

/**
 * 处理 SSE 事件
 */
function handleSSEEvent(eventType: string, data: any, callbacks: StreamCallbacks): void {
  switch (eventType) {
    case 'workflow_started':
      callbacks.onWorkflowStarted?.({
        event: 'workflow_started',
        workflow_run_id: data.workflow_run_id,
        message: data.message,
      })
      break

    case 'node_started':
      callbacks.onNodeStarted?.({
        event: 'node_started',
        node_id: data.node_id,
        node_type: data.node_type,
        title: data.title,
      })
      break

    case 'message':
      callbacks.onMessage?.(data.answer || '')
      break

    case 'workflow_finished':
      callbacks.onWorkflowFinished?.({
        conversation_id: data.conversation_id || '',
        answer: data.data?.outputs?.answer || '',
        total_tokens: data.data?.total_tokens,
      })
      break

    case 'error':
      callbacks.onError?.(new Error(data.message || '未知错误'))
      break

    case 'ping':
      // 心跳事件，忽略
      break

    case 'node_finished':
    case 'message_end':
      // 这些事件暂不处理，保留扩展性
      break

    default:
      console.warn('未知的 SSE 事件类型:', eventType)
  }
}
