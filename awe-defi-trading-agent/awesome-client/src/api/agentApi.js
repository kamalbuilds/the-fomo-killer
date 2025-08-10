import { get, deletes, post, patch, put, streamPost} from './base'



// 创建Agent
// export const createAgentApi = (data) => {
//   return post('/api/agent', data);
// }
// // 从任务快速创建Agent
// export const quickCreateAgentApi = (taskId) => {
//   return post(`/api/agent/from-task/${taskId}`, { status: 'private' } );
// }
// // 发布Agent
// export const publishAgentApi = (taskId) => {
//   return post(`api/agent/${taskId}/publish`, { } );

// 1. 预览从任务创建Agent的内容（不实际创建Agent）
export const previewAgentFromTaskApi = (taskId) => {
  // GET /api/agent/preview/:taskId
  return get(`/api/agent/preview/${taskId}`, {});
}

// 2. 从任务创建Agent（支持私有/公开）
export const createAgentFromTaskApi = (taskId, data) => {
  // POST /api/agent/create/:taskId
  return post(`/api/agent/create/${taskId}`, data);
}

// 3. 获取Agent列表（支持筛选/分页/排序）
export const getAgentListApi = (params = {}) => {
  // GET /api/agent
  // params: { status, userId, limit, offset, sortBy, sortDir }
  return get('/api/agent', params);
}

// 4. 获取Agent详情
export const getAgentDetailApi = (id) => {
  // GET /api/agent/:id
  return get(`/api/agent/${id}`, {});
}

// 5. 尝试使用Agent
export const tryAgentApi = (id, data) => {
  // POST /api/agent/:id/try
  // data: { content }
  return post(`/api/agent/${id}/try`, data);
}

// 6. 更新Agent
export const updateAgentApi = (id, data) => {
  // PUT /api/agent/:id
  return put(`/api/agent/${id}`, data);
}

// 7. 删除Agent
export const deleteAgentApi = (id) => {
  // DELETE /api/agent/:id
  return deletes(`/api/agent/${id}`, {});
}
// 8. 收藏Agent
export const favoriteAgentApi = (id) => {
  // POST /api/agent/:id/favorite
  // 需要访问令牌
  return post(`/api/agent/${id}/favorite`, {});
}

// 9. 取消收藏Agent
export const unfavoriteAgentApi = (id) => {
  // DELETE /api/agent/:id/favorite
  // 需要访问令牌
  return deletes(`/api/agent/${id}/favorite`, {});
}

// 10. 检查Agent收藏状态
export const getAgentFavoriteStatusApi = (id) => {
  // GET /api/agent/:id/favorite/status
  // 需要访问令牌
  return get(`/api/agent/${id}/favorite/status`, {});
}

export const generateInfoApi = (taskId) => {
  return post(`/api/agent/generate-info/${taskId}`, {});
}

export const agentInitApi = (id) => {
  return post(`/api/agent/${id}/init`)
}

// 获取Agent对话详情:
export const agentConversationDetailApi = (conversationId) => {
  return post(`/api/agent-conversation/${conversationId}`, {});
}
// 使用专用Agent对话接口继续对话:
export const agentMessageStreamApi = (conversationId, content, onMessage) => {
  return streamPost(`/api/agent-conversation/${conversationId}/message/stream`, { content }, onMessage);
}



export const verifyAgentAuthApi = (data) => {
    return post(`/api/agent/mcp/verify-auth`, data)
}

// 获取Agent任务历史记录
export const getAgentHistoryMsgApi = (agentId, conversationId, params) => {
  return get(`/api/agent/${agentId}/conversations?conversationId=${conversationId}`, params);
}


