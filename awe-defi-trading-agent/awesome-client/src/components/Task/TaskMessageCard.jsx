// 黑色背景卡片
'use client'
import React, { useEffect, useState} from 'react'
import { Box, Text } from '@chakra-ui/react'
import {SelectedImg, ArrowCircleDownImg, LoadingImg,  } from '@/assets/images'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { AppCopy } from '..'


export const TaskMessageCard = ({ message, defaultExpand, isLoading }) => {
    const [isExpand, setExpand] = useState(false)
        
   

    useEffect(() => {
        setExpand(defaultExpand)
    },[defaultExpand])

   

    return(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
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
                        
                        <Box className='fx-row ai-ct'>
                            <AppCopy text={message}/>
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
                        </Box>

                    </Box>                  
                    <Text 
                        mt='16px'
                        fontSize="12px"
                        fontWeight={350}
                        color="#B8B8B8"
                        whiteSpace="pre-wrap"
                        style={{
                            display: "-webkit-box",
                            WebkitLineClamp: isExpand ? "unset" : 4,
                            WebkitBoxOrient: "vertical",
                            overflow: isExpand ? "visible" : "hidden",
                        }}
                        >
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            >
                            {message}
                        </ReactMarkdown>
                    </Text>                  
                </Box>
            </motion.div>
        </AnimatePresence>
    )
}