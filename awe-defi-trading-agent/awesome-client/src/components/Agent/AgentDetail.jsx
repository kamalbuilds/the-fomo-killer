
'use client'
import React, { useEffect, useState } from 'react'
import { Box, Text, } from '@chakra-ui/react'
import { AWEImg, IdeaImg } from '@/assets/images/'
import Image from 'next/image'
import { Tag } from '@/components/'
import { getAgentDetailApi } from '@/api'


export const AgentDetail = ({ detail, onQuickChat}) => {
    if(!!!detail) {
        return null
    }
    
    return (
        <Box className='w-full' >
            <Box className='fx-col ai-ct' p='32px' borderRadius='12px' border='1px solid #293033' bgColor='#1B1B1E'>
                <Image src={detail.agentAvatar} height={56} width={56} alt='agent' className='rounded-[100px]'/>
                <Text mt='12px' color='#E0E0E0' fontSize='16px' fontWeight={600}>{detail.name}</Text>
                <Box className='fx-row ai-ct mt-[16px]' fontSize='12px' color='#E0E0E0'>
                    <span>Created by:</span>
                    <Image src={detail.avatar} alt='logo' height={15} width={15} className='rounded-[15px] mr-[2px] ml-[4px]' /> 
                    <span>@{detail.username}</span>
                </Box>
                <Text color='rgba(224, 224, 224, 0.60)' fontSize='14px' fontWeight={350} mt='24px'>{detail.description}</Text>
                
                <Box className='fx-row' gap='6px' flexWrap='wrap' mt='24px' maxW='306px'>
                    {
                        detail.categories.map(c => <Tag title={c} key={c}/>)
                    }
                </Box>     
            </Box>            

            <Box className='fx-col' mt='32px'>
                <Box className='fx-row ai-ct'>
                    <Image src={IdeaImg} height={16} width={16} alt='idea'/>
                    <Text fontSize='16px' fontWeight={400} color='#E0E0E0' ml='2px'>Illustrative tasks:</Text>
                </Box>

                <Box mt='12px'>
                    {
                        detail.relatedQuestions.map(r => (
                            <Box key={r} className='fx-row ai-ct'>
                                <Box w='2px' h='2px' bg='#828B8D' mx='8px'/>
                                <Text className='click' fontSize='12px' color='#828B8D' fontWeight={350} onClick={() => onQuickChat(r)}>{r}</Text>
                            </Box>
                        ))
                    }
                </Box>
            </Box>

        </Box>
    )
}
