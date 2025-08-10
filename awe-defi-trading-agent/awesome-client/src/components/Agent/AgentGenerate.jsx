'use client'
import React, { useEffect, useState, useRef, useImperativeHandle } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { AttentionImg,} from '@/assets/images'
import Image from 'next/image'
import { agentMessageStreamApi } from '@/api'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {
  sendLoadingAction,
  selectAgentChat,
  agentChatAction,
  exeTaskStatusAction,
  selectExeTaskStatus,
  selectAgentMessages,
  agentMessagesAction,
  createAgentMessagesAction,
  updateAgentMessagesAction,

  
} from '@/redux/reducer'
import { sleep } from '@/utils'
import { ExecuteTool, SuccessModal, showToast,} from '@/components'
import { v4 as uuidv4 } from 'uuid';



export const AgentGenerate = ({ agentId, ref }) => {
    const agentChat = useAppSelector(selectAgentChat)
    const [executeModal, setExecuteModal] = useState({ isOpen: false, content: '' })
    const containerRef = useRef(null)
    const bottomRef = useRef(null)

    const dispatch = useAppDispatch()
 
    const { status, agentConversationId, chatContent, errorMsg} = agentChat


    useEffect(() => {
        if(status === 'start' && agentConversationId && chatContent) {
            executeTask()
            scrollToBottom()            
        }
    },[status, agentConversationId])


     useImperativeHandle(ref, () => ({
        clearMsg, 
    }))

    const clearMsg = () => {
        dispatch(agentMessagesAction([]))
    }
    // console.log(' thinkingMsg===', thinkingMsg)
    // console.log(' tempMsg===', tempMsg)

    const scrollToBottom = async() => {
        await sleep(500)
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    const executeTask = async () => {

        dispatch(agentChatAction({ 
            status: 'notStart',
            agentConversationId: null,
            chatContent: null,
            errorMsg
        }))
        try {
            await agentMessageStreamApi(agentConversationId, chatContent, (raw) => {
                const data = typeof raw === 'string' ? JSON.parse(raw) : raw

                const { event, data: d } = data

                // console.log('agentMessageStreamApi data===', data)

                if(event === 'error') {
                    const { error, message } = data.data 
                    if(error) {
                        dispatch(agentChatAction({ 
                            status: 'notStart',
                            agentConversationId: null,
                            chatContent: null,
                            errorMsg: error
                        }))    
                        dispatch(exeTaskStatusAction('notStart'))
                        dispatch(sendLoadingAction(false))
                        showToast('error', message || 'error')

                        dispatch(updateAgentMessagesAction({
                            intent: 'chat',
                            chatContent: '',
                            loading: false,
                        }))
                    }

                    return
                }

                if(event === 'agent_loading') {
                    dispatch(createAgentMessagesAction({
                        id: uuidv4(),
                        type: 'assistant',            
                        intent: 'chat',
                        chatContent: null,
                        thinkingContent: null,
                        finalResultContent: null,
                        loading: true
                    }))
                }

                // chat
                if(event === 'chat_chunk') {
                    const msg = d.content
                    dispatch(updateAgentMessagesAction({
                        intent: 'chat',
                        chatContent: msg,
                        loading: true,
                    }))
                }

                 // request 
                if (event === 'task_execution_progress' && d.event === 'step_executing') {
                    // setToolLoading(1)
                    console.log('参数 step_executing request=== ', d )
                    const { toolDetails } = d.data
                    const { toolName, args } = toolDetails
                                     


                    dispatch(updateAgentMessagesAction({
                        intent: 'request',
                        request: {
                            toolName: toolName,
                            args: JSON.stringify(args)
                        },
                        loading: true,
                    }))
                    scrollToBottom()
                    return
                }

                // response
                if (event === 'task_execution_progress' && d.event === 'step_raw_result') {
                    // console.log('参数 step_raw_result response ===', d )
                    const { result } = d.data 
                    dispatch(updateAgentMessagesAction({
                        intent: 'request',
                        response: JSON.stringify(result.content[0]) || '',
                        loading: true,
                    }))

                    scrollToBottom()
                    return
                }

                
                // thinking
                if (event === 'task_execution_progress' && d.event === 'step_result_chunk') {
                    const chunk = d.data?.chunk || ''
                    //  console.log('更新thinking消息', chunk)
                    dispatch(updateAgentMessagesAction({
                        intent: 'task',
                        thinkingContent: chunk,
                        loading: true,
                        requestEnd: true 
                    }))

                    scrollToBottom()
                    return
                }
                // 最终交付结果
                if (event === 'task_execution_progress' && d.event === 'final_result_chunk') {
                   
                    const finalResult = d.data?.chunk || ''
                  
                    dispatch(updateAgentMessagesAction({
                        intent: 'task',
                        finalResultContent: finalResult,
                        loading: true,
                        thinkingEnd: true 
                    }))
                 
                    scrollToBottom()
                    return
                }   

               

                if (event === 'stream_complete') {
                    // console.log('消息完成',)
                    dispatch(updateAgentMessagesAction({
                        loading: false
                    }))

                    
                    setExecuteModal({
                       isOpen: true,
                       content: 'Agent has completed your task'
                   })
                   dispatch(exeTaskStatusAction('end'))
                   dispatch(sendLoadingAction(false))
                }
            })
        } catch (err) {
            dispatch(exeTaskStatusAction('notStart'))
            dispatch(sendLoadingAction(false))
           
            showToast('error', 'Server error, please try again')
            console.error('Stream error:', err)
        } 
        await sleep(500)
        dispatch(exeTaskStatusAction('notStart'))
        dispatch(sendLoadingAction(false))
      
        // dispatch(agentChatAction({ 
        //     status: 'notStart',
        //     agentConversationId: null,
        //     chatContent: null,
        //     errorMsg
        // }))
    }


    return (
        <Box ref={containerRef} overflowY='auto' py='32px' className='' >
          
        {/* attention */}
        {
            errorMsg && 
            <Box>
                <Box className='fx-row ai-ct '>
                    <Image src={AttentionImg} height={16} width={16} alt='attention'/>
                    <Text color='#CE5E56' ml='4px' mt='2px' fontSize='16px' fontWeight={400}>Attention</Text>
                </Box>
                <Box bg='#3B2425' className='w-full fx-row ai-ct' borderLeft='2px solid #CE5E56' mt='12px' py='2px'>
                    <Box className='h-[2px] w-[2px] bg-[#CE5E56]' mx='8px'/>
                    <Text color='#CE5E56' fontSize='12px' fontWeight={350}>{errorMsg}</Text>
                </Box>
            </Box>
        }
        
        <div ref={bottomRef} />

        <SuccessModal
            isOpen={executeModal.isOpen}
            onClose={() => setExecuteModal({ isOpen: false, content: '' })}
            title='🎉 Congratulations!'
            content={executeModal.content}
        />
        </Box>
    )
}







