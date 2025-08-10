
'use client'
import React, { useEffect, useState } from 'react'
import { Box, Text, } from '@chakra-ui/react'
import { Tag, MsgItem, TaskMessageCard, AgentMessageCard, ExecuteTool } from '@/components/'
import { useAppSelector } from '@/redux/hooks'
import { selectAgentMessages } from '@/redux/reducer'
import {SelectedImg, ArrowCircleDownImg, LoadingImg} from '@/assets/images'
import Image from 'next/image'


export const AgentMsgList = () => {
    const agentMessages = useAppSelector(selectAgentMessages)
    // console.log('agentMessages', agentMessages)
    
    const lastMsg = agentMessages[agentMessages.length - 1]
    // console.log('lastMsg', lastMsg)

    return (
        <Box className='w-full' >
           
            {
                agentMessages.map(item => {
                    const { 
                        id,
                        type,
                        intent,
                        chatContent,
                        thinkingContent,
                        finalResultContent,
                        loading,
                        request,
                        response,
                        requestEnd,
                        thinkingEnd
                    } = item
                    return(
                        <Box key={id}>
                            {
                                // chatContent || thinkingContent || loading && 
                                // <TaskMessageCard
                                //     message={chatContent || thinkingContent}
                                //     defaultExpand={false}
                                //     isLoading={loading}
                                // />
                            }
                            {
                                chatContent && 
                                <Box mb="16px">
                                    <MsgItem
                                        type={type}
                                        content={chatContent}
                                    />
                                </Box>
                            }
                            {
                                request && 
                                <ExecuteTool
                                    loading={true}
                                    request={request}                                  
                                    response={response || ''}
                                    responseCollapse={requestEnd}
                                />
                            }
                            {
                                intent === 'task' && thinkingContent && (
                                    <TaskMessageCard
                                        message={thinkingContent}
                                        defaultExpand={thinkingEnd ? false : true}
                                        isLoading={false}
                                    />
                                )
                            }
                            {
                                intent === 'task' && finalResultContent && (
                                    <AgentMessageCard
                                        title='Deliverables'
                                        message={finalResultContent}
                                        defaultExpand={true}
                                    />
                                )
                            }
                    </Box>
                    )
                })
            }
             {
                lastMsg?.loading && 
                <LoadingComp isLoading={lastMsg?.loading}/>
                
            }

        </Box>
    )
}


const LoadingComp = ({
    isLoading
}) => {
    return(
        <Box 
            className='fx-col' 
            border='1px solid #293033'                   
            p="16px 12px"
            borderRadius="12px"
            style={{
                wordBreak: "break-word",
                overflowWrap: "break-word", 
                wordWrap: "break-word", 
            }}
        >
            <Box className='fx-row ai-ct jc-sb'>
                <Box className='fx-row ai-ct'>
                    <Image src={isLoading ? LoadingImg : SelectedImg} className={isLoading ? 'rotation_animation' : ''} alt='selected' width={14} height={14} />
                    <Text fontSize={['14px','14px','16px','16px',]} color='#E0E0E0' fontWeight={600} ml='4px'>Running agent...</Text>
                </Box>
                <Image 
                    src={ArrowCircleDownImg} 
                    className='cursor-pointer' 
                    width={20} 
                    height={20}
                    alt='showmore' 

                    style={{
                        transform: true ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease-in-out',
                    }}
                />

            </Box>                  
            <Text 
                mt='16px'
                fontSize="12px"
                fontWeight={350}
                color="#B8B8B8"
                whiteSpace="pre-wrap"
                style={{
                    display: "-webkit-box",
                    WebkitLineClamp: false ? "unset" : 4,
                    WebkitBoxOrient: "vertical",
                    overflow: false ? "visible" : "hidden",
                }}
                >
               
            </Text>                  
        </Box>
    )
}