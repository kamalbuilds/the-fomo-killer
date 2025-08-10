
'use client'
import React from 'react'
import { Box, Text, VStack } from '@chakra-ui/react'
import { NoticeImg, TriangleImg } from '@/assets/images'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const MotionBox = motion(Box)

export const ExpandCard = ({
    title,
    isOpen,
    onOpen,
    children
}) => {
    return(
        <Box mt='12px' className=''>
            <Box px={['4px','8px','12px','14px','16px']} py='12px' className='bg-[#18181A] rounded-[8px]'>
                <Box className='fx-row ai-ct jc-sb click'  onClick={onOpen}>
                    <Box className='fx-row ai-ct'>
                        <Text mr='4px' color='#E0E0E0' fontSize='16px' fontWeight={600}>{title}</Text>                                                        
                        <Image 
                            src={NoticeImg} 
                            height={14}
                            width={14} 
                            alt='notice' 
                            // className={isX ? 'cursor-pointer' : 'cursor-default'} 
                            // onClick={isX ? () => openLink('https://docs.x.com/x-api/getting-started/getting-access') : () => null }
                        />
                    </Box>
                    <Image 
                        src={TriangleImg} 
                        height={10} 
                        width={10} 
                        alt='open' 
                        style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease-in-out',
                        }}
                    />
                </Box>
                <AnimatePresence initial={false}> 
                    <MotionBox
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        overflow="hidden"
                    >
                        { isOpen ? children : null}
                    </MotionBox>
                </AnimatePresence>
            </Box>
        </Box>
    )
}