// 绿色背景卡片
'use client'
import React, { useEffect, useState } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { ArrowCircleDownImg, AgentMsgImg, } from '@/assets/images'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { AppCopy } from '..'

export const AgentMessageCard = ({ title, message, defaultExpand, isTask }) => {
  const [isExpand, setExpand] = useState(false)

  useEffect(() => {
    setExpand(defaultExpand)
  },[defaultExpand])

  if (!message) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box

          bg="rgba(0, 193, 29, 0.10)"
          p="16px 12px"
          borderRadius="12px"
          mt={isTask ? '0px' : '32px'}
          border="1px solid rgba(41, 48, 51, 0.50)"

          className=''
          style={{
            wordBreak: "break-word",
            overflowWrap: "break-word", 
            wordWrap: "break-word", 
          }}
        >
          <Box className="fx-row ai-ct jc-sb" mb="16px">
            <Box className="fx-row ai-ct">
              <Image src={AgentMsgImg} height={16} width={16} alt="msg" />
              <Text fontSize="16px" color="#00C11D" fontWeight={600} ml="8px">
                {title}
              </Text>
            </Box>
            <Box className='fx-row ai-ct'>
              <AppCopy text={message}/>
              <Image
                src={ArrowCircleDownImg}
                height={20}
                width={20}
                alt="toggle"
                className="click"
                onClick={() => setExpand(!isExpand)}
                style={{
                  transform: !isExpand ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out',
                }}
              />
            </Box>
          </Box>

          <Box
            fontSize="12px"
            fontWeight={350}
            color="#90EE90"
            className=''
            whiteSpace="pre-wrap"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: isExpand ? "unset" : 4,
              WebkitBoxOrient: "vertical",
              overflow: isExpand ? "visible" : "hidden"            
            }}
          >
              {
                  isTask ? message :
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {message}
                  </ReactMarkdown>
              }
          </Box>
        </Box>
      </motion.div>
    </AnimatePresence>
  )
}