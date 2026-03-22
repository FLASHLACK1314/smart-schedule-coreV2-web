import request from './index'

// ========== 类型定义 ==========

/**
 * 发送消息请求体
 */
export interface DifyChatVO {
  query: string // 用户消息内容
  conversation_id?: string // 会话ID（可选，首次为空）
  semester_uuid?: string // 学期UUID（可选，用于 MCP 工具调用时指定学期上下文）
  forceNew?: boolean // 强制创建新会话（可选，为 true 时跳过自动续接逻辑）
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
 * 注意：后端返回的字段是 id，不是 conversation_id
 */
export interface DifyConversationDTO {
  id: string // 会话ID（后端返回的字段名）
  name: string // 会话名称
  inputs?: Record<string, any> // 输入参数
  status?: string // 会话状态
  introduction?: string // 会话介绍
  created_at: number // 创建时间（时间戳）
  updated_at: number // 更新时间（时间戳）
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

// ========== MCP 工具返回类型 ==========

/**
 * 教师课表查询结果
 * 由 queryTeacherScheduleByTime 工具返回
 */
export interface TeacherScheduleQueryDTO {
  /** 请求是否成功 */
  success: boolean
  /** 错误消息（仅 success=false 时有值） */
  errorMessage?: string
  /** 教师课表列表 */
  teachers: TeacherSchedule[]
}

export interface TeacherSchedule {
  teacherUuid: string
  teacherName: string
  teacherNum: string
  /** 筛选条件描述（如 "全部" 或 "周五"） */
  filterDescription: string
  /** 该教师排课数量 */
  scheduleCount: number
  /** 排课列表 */
  schedules: ScheduleItem[]
}

export interface ScheduleItem {
  scheduleUuid: string
  courseName: string
  classroomName: string
  /** 星期几 (1-7) */
  dayOfWeek: number
  /** 星期几中文描述（如 "周一"） */
  dayOfWeekStr: string
  /** 起始节次 */
  sectionStart: number
  /** 结束节次 */
  sectionEnd: number
  /** 上课周次 JSON 数组字符串，如 "[1,2,3,4,5]" */
  weeksJson: string
}

/**
 * 时间槽可用性检测结果
 * 由 checkTimeSlotAvailability 工具返回
 */
export interface TimeSlotCheckDTO {
  /** 请求是否成功 */
  success: boolean
  /** 错误消息（仅 success=false 时有值） */
  errorMessage?: string
  /** 检测的时间槽信息 */
  timeSlot: TimeSlotInfo
  /** 检测结果列表（教室和教师各一项） */
  results: CheckResult[]
  /** 是否有任何冲突 */
  hasConflict: boolean
  /** 冲突类型汇总列表（如 ["教室冲突", "教师冲突"]） */
  conflictTypes: string[]
}

export interface TimeSlotInfo {
  /** 星期几 (1-7) */
  dayOfWeek: number
  /** 星期几中文描述 */
  dayOfWeekStr: string
  /** 起始节次 */
  sectionStart: number
  /** 结束节次 */
  sectionEnd: number
}

export interface CheckResult {
  /** 检测类型："classroom" 或 "teacher" */
  checkType: 'classroom' | 'teacher'
  /** 检测对象名称 */
  name: string
  /** 是否找到该对象 */
  found: boolean
  /** 是否有冲突 */
  hasConflict: boolean
  /** 冲突排课列表（仅 hasConflict=true 时有值） */
  conflicts?: ConflictItem[]
}

export interface ConflictItem {
  /** 课程名称 */
  courseName: string
  /** 教师/教室名称 */
  relatedName: string
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
 * SSE 消息结束事件
 * 文档说明：conversation_id 和 message_id 由 message_end 事件提供
 */
export interface SSEMessageEndEvent {
  event: 'message_end'
  message_id: string
  conversation_id: string
  metadata?: {
    usage?: {
      total_tokens: number
    }
    retriever_resources?: any[]
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
  | SSEMessageEndEvent
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
  /** 消息结束回调 - 包含 conversation_id 和 message_id */
  onMessageEnd?: (data: { conversation_id: string; message_id: string }) => void
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
  if (data.forceNew) {
    params.append('force_new', 'true')
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
      let currentEventType = ''
      let currentEventData = ''

      while (true) {
        const { done, value } = await reader.read()
        console.log('[SSE] 读取数据块, done:', done, 'bytes:', value?.length || 0)
        if (done) {
          console.log('[SSE] 流结束, buffer 剩余:', buffer.length, '内容:', buffer.substring(0, 200))
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // 解析 SSE 事件
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一个不完整的行

        // 注意：eventType 和 eventData 需要跨数据块保持状态
        // 但我们这里在每次 split 后会丢失状态，所以需要在外部维护
        // 简化方案：使用 trim() 检测空行，并确保空行后立即重置

        console.log('[SSE] 解析行数:', lines.length)

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i] as string

          if (line.startsWith('event:')) {
            currentEventType = line.slice(6).trim()
            console.log('[SSE] 检测到 event:', currentEventType)
          } else if (line.startsWith('data:')) {
            currentEventData = line.slice(5).trim()
            console.log('[SSE] 检测到 data, 长度:', currentEventData.length)
          } else if (line.trim() === '' && currentEventType && currentEventData) {
            // 空行表示事件结束，处理事件
            console.log('[SSE] 收到事件:', currentEventType, '数据长度:', currentEventData.length)
            try {
              const parsedData = JSON.parse(currentEventData)
              console.log('[SSE] 解析成功, eventType:', currentEventType, 'conversation_id:', parsedData.conversation_id)
              handleSSEEvent(currentEventType, parsedData, callbacks)
            } catch (e) {
              console.warn('[SSE] 解析失败:', e)
            }
            // 重置状态
            currentEventType = ''
            currentEventData = ''
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
  console.log('[handleSSEEvent] 处理事件:', eventType)
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
        node_id: data.data?.node_id || data.node_id,
        node_type: data.data?.node_type || data.node_type,
        title: data.data?.title || data.title,
      })
      break

    case 'message':
      callbacks.onMessage?.(data.answer || '')
      break

    case 'message_end':
      callbacks.onMessageEnd?.({
        conversation_id: data.conversation_id || '',
        message_id: data.message_id || '',
      })
      break

    case 'workflow_finished':
      console.log('[handleSSEEvent] workflow_finished - data:', data)
      console.log('[handleSSEEvent] workflow_finished - data.data:', data.data)
      console.log('[handleSSEEvent] workflow_finished - answer:', data.data?.outputs?.answer?.substring?.(0, 200))
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
      // 这些事件暂不处理，保留扩展性
      break

    default:
      console.warn('[handleSSEEvent] 未知事件类型:', eventType)
  }
}
