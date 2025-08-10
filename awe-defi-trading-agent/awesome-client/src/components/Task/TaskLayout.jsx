'use client'
import React, { useRef, useState, useEffect } from 'react'
import { Box, Text, VStack, useBreakpointValue } from '@chakra-ui/react'
import { MainPage, Chat, Workflow, Generate, ButtonWrap, AgentGenerate, SaveAgent, AgentDetail, AgentMsgList, MsgItem, AppButton} from '@/components/'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { getAgentDetailApi, getConversationDetailApi } from '@/api'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {  currentChatListAction, reanalysisStatusAction, newTaskIdAction, selectActiveReanalysisStep, 
    selectCurrentChatList, selectNewTaskId, taskTitleAction, selectSendLoading, selectReanalysisStatus, 
    isSidebarExpandAction, selectUserInfo, 
    usedMcpsAction,
    selectSidebarExpand,
    selectExeTaskStatus,
    selectConfirmWorkflow,
    selectAgentChat,
    selectUsedMcps,
    agentMessagesAction,
    agentChatAction,
    confirmWorkflowAction,
    } from '@/redux/reducer'
import { motion, AnimatePresence } from 'framer-motion'
import { CollapseImg } from '@/assets/images'
import { Loading2Img,FlashCircleImg } from '@/assets/images'
import Image from 'next/image'
import { enrichAgentCategoriesWithMcpNames } from '@/utils'

export const TaskLayout = ({
    type, // task | agent
    conversationId,
    taskId,
    agentId
}) => {
    const dispatch = useAppDispatch()
    const containerRef = useRef(null)
    
    const newTaskId = useAppSelector(selectNewTaskId)

    const pathname = usePathname()
    const router = useRouter()
   
    const activeReanalysisStep = useAppSelector(selectActiveReanalysisStep)
    const currentChatList = useAppSelector(selectCurrentChatList)
   
    const leftBottomRef = useRef(null)
    const agentGenerageRef = useRef(null)
    const isMobile = useBreakpointValue({ base: true, md: false })

    const sendLoading = useAppSelector(selectSendLoading)
    const reanalysisStatus = useAppSelector(selectReanalysisStatus)
    const userInfo = useAppSelector(selectUserInfo)
    const [quickMsg, setQuickMsg] = useState('')
    const [agentDetail, setAgentDetail] = useState(null)
    const isSidebarExpand = useAppSelector(selectSidebarExpand)
    const exeTaskStatus = useAppSelector(selectExeTaskStatus)
    const confirmWorkflow = useAppSelector(selectConfirmWorkflow)
    const workflowRef = useRef()
    const [hasSwitchedMcp, setHasSwitchedMcp] = useState(false)

    const usedMcps = useAppSelector(selectUsedMcps)
    const [isExpand, setExpand] = useState(true)

    
    const [rightWidth, setRightWidth] = useState(390)
    // 序号宽度64px
    const [sortWidth, setSortWidth] = useState(64)
    
    // console.log('usedMcps', usedMcps)

 

    useEffect(() => {
        dispatch(isSidebarExpandAction(false))
        getConversationDetail()
        getAgentDetail()
        return () => {
            dispatch(usedMcpsAction([]))
            dispatch(taskTitleAction(''))
            dispatch(currentChatListAction([]))
            dispatch(reanalysisStatusAction('notStart'))
            dispatch(agentMessagesAction([]))
            agentGenerageRef?.current?.clearMsg()


            dispatch(agentChatAction({ 
                status: 'notStart',
                agentConversationId: null,
                chatContent: null,
                errorMsg: null
            }))

            dispatch(confirmWorkflowAction({
                loading: false,
                run: false
            }))

        }
    },[])
    
    useEffect(() => {
        if (newTaskId) {
            // 当前路径：/task/:oldTaskId/:xxx
            const segments = pathname.split('/')
            
            if (segments.length >= 3 && segments[1] === 'task') {
                // 替换最后一个参数为新的 taskId
                segments[3] = newTaskId
                const newUrl = segments.join('/')
                router.replace(newUrl)
                dispatch(newTaskIdAction(null))
            }
        }
    }, [newTaskId])


    const getAgentDetail = async() => {
        if(agentId) {
            const a = await getAgentDetailApi(agentId)
           
            if(a) {
                const { mcpWorkflow } = a
                const { mcps, workflow } = mcpWorkflow
                const _a = enrichAgentCategoriesWithMcpNames([a])
                setAgentDetail(_a[0])
                dispatch(usedMcpsAction(mcps))
            }
        }
    }
    const getConversationDetail = async() => {
        if(conversationId) {
            const a = await getConversationDetailApi(conversationId)
            // console.log('获取会话详情', a)
            if(a ) {
                const { conversation, messages, lastUsedMcp } = a
                const { id, title } = conversation
            
                dispatch(currentChatListAction(messages))
                dispatch(taskTitleAction(title))
                lastUsedMcp && !!lastUsedMcp.length && dispatch(usedMcpsAction(lastUsedMcp))

                if (leftBottomRef.current) {
                    messages.length > 15 && leftBottomRef.current.scrollIntoView({ behavior: 'smooth' })
                }
            }            
        }
    }


    
    const handleExpand = () => {
        setExpand(!isExpand)
        if(isExpand) {
            setRightWidth(84)
            setSortWidth(0)
        }   else {
            setRightWidth(390)
            setSortWidth(64)
        }
    }
    
    if(!!!userInfo){
        return null
    }
    
    const leftWidth = `calc(100% - ${rightWidth}px - ${sortWidth}px)`
    
    const reanalysisEnd = (agentId && agentDetail) ? true : (!!usedMcps.length  || reanalysisStatus === 'end')
 
    return (    
        <MainPage>
            <Box
                ref={containerRef}
                className="flex flex-col md:flex-row w-full h-full "
                justifyContent={reanalysisEnd ? 'start' : 'center'}
                overflowY={isMobile ? 'scroll' : 'auto'}
                pb={isMobile ? '216px' : '32px'} // <Chat/>的最小高度 216px
                pt='20px'
            >
                {/* 左侧区域 */}
                <Box
                    className="flex flex-col w-full md:w-auto"
                    style={{ width: isMobile ? '100%' : (reanalysisEnd ? leftWidth  : '70%')   }}
                    h="100%"
                    position="relative" 
                    px={['8px','16px','20px','20px']}
                >
                    <Box className="flex-1 overflow-y-scroll" h='100%'  >
                        {
                            type === 'agent'  && (
                                <Box className='h-full w-full' >
                                    <AgentDetail detail={agentDetail} onQuickChat={m => setQuickMsg(m)}/>
                                    { agentId && <AgentMsgList/> }
                                    { agentId && <AgentGenerate agentId={agentId} ref={agentGenerageRef}/> }
                                </Box>
                            )
                        }
                        
                        {
                            currentChatList.map(msgItem => (
                                <MsgItem
                                  key={msgItem.id}
                                  type={msgItem.type}
                                  content={msgItem.content}
                                />
                            ))
                        }
                        { (type === 'task' && taskId ) && <Generate taskId={taskId} /> }

                       <div ref={leftBottomRef} />
                    </Box>
                    { !isMobile && <Chat tId={taskId} cId={conversationId} defaultMsg={quickMsg} maxW="100%"/>}
                </Box>
        

                {/* 右侧区域 */}
                
                <AnimatePresence>
                    { reanalysisEnd && ( 
                        <motion.div
                            key="mcp-right"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            style={{
                                width: isMobile ? '100%' : `${rightWidth + sortWidth}px`,
                                height: '100%',
                            }}
                        >
                            <Box 
                                border='1px solid #293033'
                                className="flex flex-col w-full md:w-auto rounded-[12px]  "
                                h='100%'
                                py='22px'
                                px={['8px','8px','16px','18px','20px']}
                            >
                                <Box className='fx-row ai-ct ' mb='24px' pl={isExpand ? 0 : '10px'}>
                                    {
                                        !isMobile && 
                                        <Image 
                                            style={{ transform: isExpand ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                            alt='collapse' 
                                            src={CollapseImg} 
                                            onClick={handleExpand} 
                                            className='w-[24px] h-[24px] cursor-pointer'

                                        />
                                    }
                                    {
                                        isExpand && 
                                        <Text 
                                            ml='10px'
                                            color="#E0E0E0" 
                                            fontSize={['16px','18px','20px','24px']} 
                                            fontWeight={600} 
                                        >
                                            { type === 'task' ? 'Suggested MCP Workflow' : `Agent's MCP Workflow`}
                                        </Text>
                                    }
                                </Box>
                                {
                                    isExpand && 
                                    <Box 
                                        className="flex-1" 
                                        h={`calc(100% - 220px)`}
                                     
                                     > 
                                        {
                                            (taskId || agentId) && 
                                                <Workflow 
                                                    taskId={taskId} 
                                                    agentId={agentId} 
                                                    type={type} 
                                                    ref={workflowRef}
                                                    mcpSwitchChange={m => setHasSwitchedMcp(m) }
                                                />
                                        }       
                                        {
                                            type === 'task' && isExpand && 
                                            <ButtonContainer>
                                                <Box zIndex={13}>
                                                    <AppButton
                                                        mt='20px'
                                                        onClick={() => workflowRef.current.onCheckVerify()}
                                                        loading={confirmWorkflow.loading}
                                                        title={hasSwitchedMcp ? 'Rebuild Workflow' : 'Confirm Workflow'}
                                                    />                             
                                                </Box>
                                            </ButtonContainer>
                                        }
                                    </Box>       
                                }
                                {
                                    type === 'task' && isExpand && 
                                    <ButtonContainer>
                                        <SaveAgent taskId={taskId} />                                     
                                    </ButtonContainer>
                                   
                                }

                                {
                                     type === 'agent' && isExpand &&
                                        <ButtonContainer>
                                            <AppButton
                                                onClick={() => workflowRef.current.onCheckVerify()}
                                                loading={confirmWorkflow.loading }
                                                title='Save Auth (If Required)'
                                            />
                                        </ButtonContainer>
                                      
                                    
                                }

                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* 移动端chat输入框 */}
                {isMobile && (
                    <Box
                        className="fixed bottom-0 left-0 w-full z-50 bg-[#010101] border-t border-[#293033]"
                        px="16px"
                        py="8px"
                    >
                        <Chat tId={taskId} cId={conversationId} defaultMsg={quickMsg}/>
                    </Box>
                )}                
            </Box>
        </MainPage>
    )
}



const ButtonContainer = ({children}) => (
     <Box zIndex={12} className='fx-col' pl={['0px','40px','40px','40px','40px']}>
        {children}
     </Box>
)