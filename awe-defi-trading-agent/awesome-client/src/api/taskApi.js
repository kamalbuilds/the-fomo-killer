import { get, deletes, post, patch, put, streamPost } from './base'

// 创建任务
export const createTaskApi = (data) => {
    return post('/api/task', data)
}

// 生成任务标题
export const generateTaskTitleApi = (data) => {
    return post('/api/task/title', data)
}

// 获取任务列表
export const getTaskListApi = () => {
    return get('/api/task', {})
}

// 获取任务详情
export const getTaskDetailApi = (id) => {
    return get(`/api/task/${id}`,)
}

// 任务分析接口

// 分析任务
export const analyzeTaskApi = (id) => {
    return post(`/api/task/${id}/analyze`, {})
}

// 流式分析任务（SSE，需前端特殊处理）
export const analyzeTaskStreamApi = (taskId, onMessage) => {
  return streamPost(`/api/task/${taskId}/analyze/stream`, {}, onMessage)
}


// MCP授权接口

// 验证MCP授权
export const verifyMcpAuthApi = (id, data) => {
    return post(id ? `/api/task//verify-auth?${id}` : '/api/task//verify-auth', data)
}



// 替换MCP
export const replaceMcpApi = (id, data) => {
    return post(`/api/task/${id}/replace-mcp`, data)
}


//  批量替换MCP并重新分析任务（流式版本）
export const replaceMCPStreamApi = (taskId, data, onMessage) => {
  return streamPost(`/api/task/${taskId}/batch-replace-mcp/stream`, data, onMessage)
}
// export const replaceMCPStreamApi = (taskId, data, onMessage) => {
//   return streamPost(`/api/task/${taskId}/replace-mcp-smart/stream`, data, onMessage)
// }



// 任务执行接口



// 流式执行任务（SSE，需前端特殊处理）
export const executeTaskStreamApi = (taskId, onMessage) => {
  return streamPost(`/api/task/${taskId}/execute/stream`, {}, onMessage)
}

// 会话管理接口

// 创建新会话
export const createConversationApi = (data) => {
    return post('/api/conversation', data)
}

// 获取会话列表
export const getConversationListApi = (params = {}) => {
    // params: { limit?, offset?, sortBy?, sortDir?, userId? }
    return get('/api/conversation', params)
}

// 获取会话详情
export const getConversationDetailApi = (id, params = {}) => {
    // id: conversationId, params: { userId? }
    return get(`/api/conversation/${id}`, params)
}

// 发送消息
export const sendConversationMessageApi = (conversationId, data) => {
    // data: { content: string, userId? }
    return post(`/api/conversation/${conversationId}/message`, data)
}

// 流式发送消息（SSE，需前端特殊处理）
// export const sendConversationMessageStreamApi = (conversationId, payload, onMessage) => {
//   return streamPost(`/api/conversation/${conversationId}/message/stream`, payload, onMessage)
// }

export const sendConversationMessageStreamApi = (conversationId, data) => {
    return post(`/api/conversation/${conversationId}/message/stream`, data)
}

// 获取会话关联的任务
export const getConversationTasksApi = (conversationId, params = {}) => {
    // params: { userId? }
    return get(`/api/conversation/${conversationId}/tasks`, params)
}
export const deleteConversationApi = (conversationId) => {
    return deletes(`/api/conversation/${conversationId}`, {})
}



