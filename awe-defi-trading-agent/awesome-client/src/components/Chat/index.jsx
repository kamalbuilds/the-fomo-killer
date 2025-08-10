'use client';
import React, { useEffect, useState } from 'react'
import { VStack, Text, Box, Textarea, HStack, Tooltip,Flex } from '@chakra-ui/react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {  agentChatAction, agentConversationIdAction, agentMessagesAction, callWalletSignAction, currentChatListAction, selectAgentChat, selectAgentConversationId, selectAgentMessages, selectCurrentChatList, selectSendLoading, selectSidebarExpand, selectUserInfo, sendLoadingAction, usedMcpsAction } from '@/redux/reducer';
import { AppendixImg, ArrowdownImg, CommandImg, MicrophoneImg, SendImg, VoiceImg, LoadingImg} from '@/assets/images'
import Image from 'next/image'
import { MainPage, PopoverOption, showToast } from '@/components';
import { createConversationApi, getConversationListApi, sendConversationMessageApi, sendConversationMessageStreamApi } from '@/api/taskApi';
import { taskTitleAction, conversationsListAction } from '@/redux/reducer';
import { useRouter, usePathname, useParams } from 'next/navigation'
import { reanalysisStatusAction, newTaskIdAction } from '@/redux/reducer';
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { v4 as uuidv4 } from 'uuid';

export const Chat = ( { tId, cId, defaultMsg, maxW } ) => {
    const isSidebarExpand = useAppSelector(selectSidebarExpand)
    const [inputValue, setInputValue] = useState('')
    
    const [activeLLM, setActiveLLM] = useState('GPT-4o')
    const [isOpen, setOpen] = useState(false)
    const dispatch = useAppDispatch()
    const router = useRouter()

    const pathname = usePathname()

    const params = useParams()
    const agentId = params.agentId
    const url_agentConversationId = params.conversationId

 
    const isTaskPage = pathname === '/task'
    const isAgentPage = pathname.startsWith('/agent') 

    const { address, isConnected} = useAccount()
    const { openConnectModal } = useConnectModal()
    const currentChatList = useAppSelector(selectCurrentChatList)

    const sendLoading = useAppSelector(selectSendLoading)
    const agentChat = useAppSelector(selectAgentChat)

    const userInfo = useAppSelector(selectUserInfo)


    const agentConversationId = useAppSelector(selectAgentConversationId)
    const agentMessages = useAppSelector(selectAgentMessages)

    useEffect(() => {
      return () => {
        dispatch(sendLoadingAction(false))
      }
    },[])
    useEffect(() => {
      if(defaultMsg) {
        setInputValue(defaultMsg)
      }
    },[defaultMsg])


    const handleSendMessage = async () => {
      try {
        await sendConversationMessageStreamApi(conversationId, { content: inputValue }, (data) => {
          const { event, data: eventData } = data

          switch (event) {
            case 'processing_start':
              console.log('🔄 处理开始 messageId:', eventData.messageId)
              break

            case 'intent_detection':
              console.log('🎯 意图识别:', eventData)
              break

            case 'chat_response':
              setResponseText(prev => prev + (eventData?.content || '')) // ✅ 流式拼接
              break

            case 'processing_complete':
              console.log('✅ 处理完成:', eventData)
              break

            default:
              console.log('📦 其他事件:', data)
          }
        })
      } catch (err) {
        console.error('流式消息发送失败:', err)
      }
    }


    const onSend = async() => {
      if (!address || !isConnected) {
          openConnectModal?.()
          return
      }

      if(!!!userInfo.id) {
        dispatch(callWalletSignAction(true))
        return showToast('warning', 'Please complete the wallet signature')
      }
      if(sendLoading || inputValue === '') return
      if(inputValue) {
      
        dispatch(sendLoadingAction(true))

        if(isTaskPage) {
          // 继续对话
          // await sendConversationMessageStreamApi(cId, { content: inputValue}, (data) => {
          // })
          dispatch(usedMcpsAction([]))
          const s = await sendConversationMessageApi(cId, { content: inputValue})
                
          if(s) {
            const { taskId, intent, assistantResponse, userMessage } = s
            if(intent === 'chat') {
                // 普通对话
                const newMsg = [
                   {
                    id: userMessage.id,
                    type: userMessage.type,
                    content: userMessage.content
                  },
                  {
                    id: assistantResponse.id,
                    type: assistantResponse.type,
                    content: assistantResponse.content
                  }
                ]
                dispatch(currentChatListAction([...currentChatList, ...newMsg]))
                dispatch(sendLoadingAction(false))
            }
  
            if(intent === 'task') {
              dispatch(reanalysisStatusAction('start'))
              dispatch(newTaskIdAction(taskId))
            }           
          }
          setInputValue('')

          return false
        }

        if(isAgentPage) {
          dispatch(agentChatAction({ 
            status: 'notStart',
            agentConversationId: null,
            chatContent: null,
            errorMsg: null
          }))  
        
          dispatch(agentChatAction({
            status: 'start',
            agentConversationId: agentConversationId || url_agentConversationId,
            chatContent: inputValue
          }))
          setInputValue('')

          dispatch(agentMessagesAction([...agentMessages, {
            id: uuidv4(),
            type: 'user',            
            intent: 'chat',
            chatContent: inputValue,
            thinkingContent: null,
            finalResultContent: null,
            loading: true
          }]))

          return
        }

     
        // 创建新会话
        dispatch(usedMcpsAction([]))
        const a = await createConversationApi({ firstMessage: inputValue })          
      

        if(a ) {
          if(a.remainingCount === 0) {
            dispatch(sendLoadingAction(false))
            return showToast('error', `You've reached the conversation limit for current plan. Please upgrade your plan to unlock more.`)
          }
           
          if(a.conversation) {
            const { title, id: conversationId} = a.conversation              
            const s = await sendConversationMessageApi(conversationId, { content: inputValue})
              
            if(s) {
              const { intent, taskId, userMessage } = s
              if(intent === 'chat') {
                  // 普通对话
                  dispatch(sendLoadingAction(false))
                  router.push(`/task/${conversationId}/1`)
              }
              if(intent === 'task') {               
                dispatch(reanalysisStatusAction('start'))
                router.push(`/task/${conversationId}/${taskId}`)
              }

              dispatch(taskTitleAction(title))
              handleChat()
            }
          }
        }               
      }
    } 


    const handleChat = async() => {
       const a = await getConversationListApi({
        limit: 1000,
        offset: 0
       })
        
      if(a && a.tasks && !!a.tasks.length) {
        dispatch(conversationsListAction(a.tasks))
      }

      setInputValue('')
    }

    return (
        <Box bg="#1F1F22" borderRadius="20px" p={['8px','8px','16px','18px','20px']} w="full" className='' minH='176px' maxW={maxW || '980px'}>
            <VStack align="stretch" spacing="24px" className=''>
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSend()
                  }
                }}
                _placeholder={{
                    color: "rgba(130, 139, 141, 0.50)"
                }}
                placeholder="Give AWESOME a task to work on ..."
                size="lg"
                resize="none"
                bg="transparent"
                border="none"
                _focus={{
                  boxShadow: "none",
                  border: "none"
                }}
                _hover={{
                  border: "none"
                }}
                color="#E0E0E0"
                fontSize="16px"
                minH="118px"      
                p={['4px','4px','6px','8px','12px']}        
              />
            </VStack>
            <Flex justify="space-between" align="center" w="full" className=''>
              <HStack spacing="16px">
                  <Tooltip label='coming soon' fontSize="sm" hasArrow placement="bottom">
                    <Image alt='appendix' src={AppendixImg} className='w-[24px] h-[24px] cursor-pointer'/>                     
                  </Tooltip>
                  <PopoverOption
                    placement='top-start'
                    menu={
                      [
                          {name: 'GPT-4o', label: 'GPT-4o'},
                          {name: 'Claude-3-7-sonnet', label: 'Claude-3-7-sonnet'},
                          {name: 'Gemini-2.0-pro', label: 'Gemini-2.0-pro'},
                          {name: 'Grok-3', label: 'Grok-3'},
                      ]
                    }
                    activeLLM={activeLLM}
                    onSelect={m => {
                      setActiveLLM(m)
                      setOpen(false)
                    }}
                    isOpen={isOpen}
                    onClose={() => setOpen(false)}
                  >
                    <Flex onClick={() => setOpen(true)} align="center" bg="rgba(81,81,81,0.5)" borderRadius="8px" px="12px" py="4px" className=' cursor-pointer'>
                        <Image alt='command' src={CommandImg} className='w-[16px] h-[16px] cursor-pointer'/>
                        <Text className='mx-[4px]' fontWeight={400} fontSize="12px" color="#E0E0E0">{activeLLM}</Text>
                          <Image 
                            src={ArrowdownImg} 
                            height={16} 
                            width={16} 
                            alt='arrowdown'
                            className='cursor-pointer'
                            style={{
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease-in-out'
                            }}
                          />
                    </Flex>  
                  </PopoverOption>
              </HStack>
          
              {
                sendLoading ? 
                <Box className='w-[40px] h-[40px] rounded-[100px] bg-[#353536] center'>
                  <Image onClick={onSend}  alt='send' src={LoadingImg} className='rotation_animation w-[24px] h-[24px]'/> 
                </Box>:
                <Image onClick={onSend}  alt='send' src={SendImg} className='cursor-pointer w-[40px] h-[40px]'/>
              }
              {/* <HStack spacing="20px">
                  <Image alt='microphone' src={MicrophoneImg} className='cursor-pointer w-[24px] h-[24px]'/>
                  <Image alt='voice' src={VoiceImg} className='w-[40px] h-[40px] cursor-pointer'/>
              </HStack> */}
            </Flex>
        
        </Box>
    )
}