import { get, deletes, post, patch, put } from './base'

// 获取所有MCP信息
export const getAllMcpApi = () => {
  return get('/api/mcp', {});
}

// 获取所有MCP类别
export const getMcpCategoriesApi = () => {
  return get('/api/mcp/categories', {});
}

// 获取指定类别的MCP
export const getMcpByCategoryApi = (category) => {
  return get(`/api/mcp/category/${category}`, {});
}

// 获取指定ID的MCP详情
export const getMcpDetailApi = (id) => {
  return get(`/api/mcp/${id}`, {});
}

// 测试Playwright MCP
export const testPlaywrightMcpApi = (data) => {
  // data: { url: string, searchText: string }
  return post('/api/task/test-playwright-mcp', data);
}