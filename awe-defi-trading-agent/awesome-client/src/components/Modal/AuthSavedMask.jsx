'use client'

import React, { useState, useEffect } from 'react'
import { Box, Text, Modal, ModalOverlay, ModalContent, ModalBody, } from '@chakra-ui/react'
import { CloseImg, RefillImg } from '@/assets/images'
import Image from 'next/image'

import { AppButton, PasswordInput, showToast, ToolsCard } from '@/components'
import { verifyMcpAuthApi } from '@/api'
import { motion, AnimatePresence } from 'framer-motion'

const MotionBox = motion(Box)

export const AuthSavedMask = ({ refill }) => {
    


    return (
       <Box 
        borderRadius='8px'
        bg='rgba(39, 39, 39, 0.20)'
        backdropFilter='blur(10px)'
        className='center h-full w-full'
       >
        <Box className='fx-col ai-ct'>
            <Text color='#fff' fontSize='14px' fontWeight={600}>✅ Auth Already Saved</Text>
            <AppButton
                onClick={refill}
                loading={false}
                title='Click to Refill'
                icon={RefillImg}
                type = 'line'
                maxW='164px'
                mt='12px'
            />
        </Box>
       </Box>
    )
}


