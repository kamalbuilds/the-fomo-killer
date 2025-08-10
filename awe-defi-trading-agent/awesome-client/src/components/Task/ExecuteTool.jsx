'use client'
import React, { useEffect, useState } from 'react'
import { Box, Text,  } from '@chakra-ui/react'
import { ElectricityImg, ArrowCircleDownImg, ShowMoreImg } from '@/assets/images'
import Image from 'next/image'

import { motion, AnimatePresence } from 'framer-motion'
import { sleep } from '@/utils'
import { AppCopy, showToast } from '..'
import { selectSendLoading } from '@/redux/reducer'
import { useAppSelector } from '@/redux/hooks'
const MotionBox = motion(Box)

export const ExecuteTool = ({
    loading,
    request,
    response,
    responseCollapse
}) => {
    const { toolName, args } = request

    const isSuccess = true

    const sendLoading = useAppSelector(selectSendLoading)

    return (
        <Box mt='16px'>
            <Box className='fx-row ai-ct jc-sb' mb='12px'>
                <Box className='fx-row ai-ct' pl='2px'>
                    <Box mr="4px" h="14px" w="14px" borderRadius="full"  className="center " position="relative">
                        <MotionBox                       
                            h="10px"
                            w="10px"
                            borderRadius="full"
                            bg="#00C11D"
                            animate={{
                                scale: sendLoading ? [1, 1.8, 1] : 1,
                                opacity: sendLoading ? [1, 0.4, 1] : 1,
                            }}
                            transition={{
                                duration: 1.8,
                                ease: 'easeInOut',
                                repeat: Infinity,
                            }}
                        />
                        <Box
                            position="absolute"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                            h="4px"
                            w="4px"
                            borderRadius="full"
                            bg="#00C11D"
                        />
                    </Box>

                    <Image src={ElectricityImg}  height={16} width={16} alt='tool'/>
                    <Text color='#E0E0E0' fontWeight={600} fontSize='16px'>{toolName}</Text>
                
                    <Box 
                        ml='12px' 
                        p='2.5px 8px' 
                        borderRadius='12px' 
                        border={ isSuccess ? '1px solid #00C11D' : '1px solid #FF1E00'} 
                        className='center' 
                        color={isSuccess ? '#00C11D' : '#FF1E00'} 
                        fontSize='12px' 
                        fontWeight={400}
                    >
                        { isSuccess ? 'Success' : 'Error' }
                    </Box>
                </Box>
            </Box>
            
            <AnimatePresence initial={false}>
                    <MotionBox
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        overflow="hidden"
                    >
                        <CopyContent
                            title="Request"
                            content={args}
                            expandable={false}
                            isCollapse={false}
                        />
                        <CopyContent
                            title="Response"
                            content={response}
                            expandable={true}
                            isCollapse={responseCollapse || false}
                        />
                    </MotionBox>
           
            </AnimatePresence>

        </Box>
    )
}

const CopyContent = ({ title, content, expandable, isCollapse }) => {

    const [isExpand, setExpand] = useState(true)

    useEffect(() => {
        if(isCollapse) {
            setExpand(false)
        }
    },[isCollapse])
    return (
        <>
            {
                content && 
                <Box 
                    borderRadius='8px' 
                    border='1px solid #293033' 
                    bg='#1F1F22' 
                    p='8px 12px'
                    color='#E0E0E0CC' 
                    fontSize='12px' 
                    fontWeight={350}
                    mb='20px'
                >
                    <Box className='fx-row ai-ct jc-sb'>
                        <Text>{title}</Text>
                        <Box className='fx-row ai-ct'>
                            <AppCopy text={content}/>       
                            {
                                expandable && 
                                <Image 
                                    src={ArrowCircleDownImg} 
                                    className='cursor-pointer' 
                                    width={20} 
                                    height={20}
                                    alt='showmore' 
                                    onClick={() => setExpand(!isExpand)}
                                    style={{
                                        transform: !isExpand ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease-in-out',
                                    }}
                                />
                            }                 

                        </Box>
                    </Box>
                    {
                        isExpand && 
                        <Text >{content}</Text>
                    }
                </Box>
            }
        </>
    )
}

