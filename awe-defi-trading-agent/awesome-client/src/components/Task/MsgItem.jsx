
'use client'
import React, { useRef, useState, useEffect } from 'react'
import { Box, Text, } from '@chakra-ui/react'


import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'


export const MsgItem = ({ type, content }) => {
    // type: user, "assistant",  "system"
    return (
        <Box>
            {
                type === 'user' ? 
                <Box className='fx-row ai-ct jc-sb' mt='16px'>
                        <div/>
                        <Box className='bg-[#1F1F22] rounded-[20px] px-[12px] py-[8px] center'>
                            <Text color='#E0E0E0' fontSize={['12px','12px','14px','15px']} fontWeight={400}>{content}</Text>
                        </Box>
                    </Box>
                : 
                <Box 
                    className='fx-row ai-ct jc-sb' 
                    mt='16px'
                    style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word", 
                        wordWrap: "break-word", 
                    }}
                >
                    <Box fontSize={['12px','12px','14px','15px']} color='#B3B3B3'>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeHighlight]}
                        >
                            {content}
                        </ReactMarkdown>

                    </Box>

                    <div/>
                </Box>
            }
        </Box>
    )
}