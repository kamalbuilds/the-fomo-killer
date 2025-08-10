'use client'
import React, { useEffect } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { TaskLayout } from '@/components'
import { getAgentHistoryMsgApi } from '@/api'
import { useAppDispatch } from '@/redux/hooks'
import { agentConversationIdAction, agentMessagesAction } from '@/redux/reducer'
import { v4 as uuidv4 } from 'uuid';
export default function AgentPage() {
    const params = useParams()
    const agentId = params.agentId
    const taskId = params.taskId
    const conversationId = params.conversationId

    const dispatch = useAppDispatch()

    // console.log('conversationId', conversationId)
    // console.log('agentId', agentId)
    // console.log('taskId', taskId)

    useEffect(() => {
        agentId && taskId === '1' && fetchData()
        
        return () => {
            dispatch(agentConversationIdAction(null))
        }
    },[agentId])

    
    const fetchData = async() => {            
        const h = await getAgentHistoryMsgApi(agentId,conversationId,{
            limit: 1000,
            offset: 0,
        })
        // console.log('getAgentHistoryMsgApi',h)
        if(h) {
            const { agent, conversation, messages } = h
            let list = []
            messages.forEach(m => {
                const { id, type, intent, content, metadata } = m
                const baseObj = {
                    id,
                    type,
                    intent,
                    loading: false
                }
                if(intent === 'chat') {
                    list.push({
                        ...baseObj,
                        chatContent: content,
                        thinkingContent: null,
                        finalResultContent: null
                    })                       
                }

                if(intent === 'task') {
                    if(type === 'user') {
                        list.push({
                            ...baseObj,
                            chatContent: content,
                            thinkingContent: null,
                            finalResultContent: null
                        })  
                    }else {
                        if(metadata) {
                            const _metadata = JSON.parse(metadata)
                            const { contentType } = _metadata // contentType : user_input chat_response step_thinking final_result
                            if(contentType === 'step_thinking') {
                                 list.push({
                                    ...baseObj,
                                    chatContent: null,
                                    thinkingContent: content,
                                    finalResultContent: null
                                })   
                            }
                            if(contentType === 'final_result') {
                                list.push({
                                    ...baseObj,
                                    chatContent: null,
                                    thinkingContent: null,
                                    finalResultContent: content
                                })   
                            }
                        }
                                           
                    }
                }
            })
            dispatch(agentMessagesAction(list))
        }
    }

    return (
        <TaskLayout
            type='agent'
            agentId={agentId}
            taskId={taskId}
        />
    )
}


