import { get, deletes, post, patch, put } from './base'

export const chatApi = () => {
    return post(`/api/chat`, { })
}
export const chatStreamApi = () => {
    return post(`/api/chat/stream`, { })
}