'use client'

import React, { useState, useEffect } from 'react'
import { Box, Text, Modal, ModalOverlay, ModalContent, ModalBody, } from '@chakra-ui/react'
import { CloseImg, TriangleImg } from '@/assets/images'
import Image from 'next/image'

import { AppButton, AuthSavedMask, PasswordInput, showToast, ToolsCard } from '@/components'
import { sleep } from '@/utils'
import { verifyMcpAuthApi } from '@/api'
import { motion, AnimatePresence } from 'framer-motion'

const MotionBox = motion(Box)

export const MCPDetail = ({ isOpen, onClose, mcpInfo,  }) => {
    const [isLoading, setLoading] = useState(false)
    const [maskVisible, setMaskVisible] = useState(true)

    const { imageUrl, description, name, predefinedTools, authParams , authRequired, authVerified} = mcpInfo

    
    
    const [authInputsMap, setAuthInputsMap] = useState({}) 
    const [showPasswordMap, setShowPasswordMap] = useState({})

    const verifyAndSave = async() => {
        setLoading(true)
        const authData = authInputsMap[name] || {};
       
        const res = await verifyMcpAuthApi(null, {
            mcpName: name,
            authData,
            saveForLater: true,
        })
        setLoading(false)
        if(res) {
            showToast('success', `Auth saved`)
        }
    }


    const handleInputChange = (mcpName, key, value) => {
        setAuthInputsMap(prev => ({
            ...prev,
            [mcpName]: {
            ...prev[mcpName],
            [key]: value
            }
        }))
    }   

    const togglePasswordVisibility = (mcpName, fieldName) => {
        setShowPasswordMap(prev => ({
            ...prev,
            [mcpName]: {
                ...prev[mcpName],
                [fieldName]: !prev[mcpName]?.[fieldName] 
            }
        }));
    };



    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" >
            <ModalOverlay />
            <ModalContent 
                bg="#101012" 
                borderRadius="12px"
                maxW="800px"
                maxH="460px"  
                h="auto"
                mt="100px"
            >
                <ModalBody 
                    p="24px" 
                    style={{
                        border:"1px solid transparent",
                        borderRadius:"12px",
                        background:"linear-gradient(#0E0E10, #0E0E10) padding-box, linear-gradient(135deg, #777979 0%, #393C3D 100%) border-box",
                        backgroundClip:"padding-box, border-box"
                    }}
                >
                    <Box className="fx-row ai-ct jc-sb mb-[24px]">
                        <Box className='fx-row ai-ct'>
                            <Image src={imageUrl} width={32} height={32} alt='mcp'/>
                            <Text ml='8px' color='#E0E0E0' fontSize='24px' fontWeight={600}>{name}</Text>
                        </Box>
                        <Box 
                            onClick={onClose}
                            className="cursor-pointer ml-[24px]"
                        >
                            <Image src={CloseImg} alt="close" className="w-[24px] h-[24px]" />
                        </Box>
                    </Box>
                    <TitleContent expandable={false} title='Dscription' isVisible={true}>
                        <Text color='#E0E0E0' fontSize='14px' fontWeight={400}>{description}</Text>
                    </TitleContent>
                    
                    <TitleContent expandable={true} title='Authentication' isVisible={authParams && !!Object.keys(authParams).length}>
                        <Box className='' pos='relative'>
                            {
                                authParams && !!Object.keys(authParams).length && Object.entries(authParams).map(([key,value],idx) => {
                                    const inputTitle = value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')                                                    
                                    return(
                                        <Box key={inputTitle} mt={idx === 0 ? 0 : '12px'}  className='' >
                                            <PasswordInput 
                                                inputTitle={inputTitle}
                                                value={authInputsMap[name]?.[value] || ""}
                                                showPassword={showPasswordMap[name]?.[value]}
                                                togglePassword={() => togglePasswordVisibility(name, value)}
                                                onChange={(e) => handleInputChange(name, value, e.target.value)}
                                            />
                                        </Box>
                                    )
                                })
                            }
                            {
                                authRequired && authVerified && maskVisible && 
                                <Box pos='absolute' left={0} top={0} className='w-full h-full' zIndex={2}>
                                    <AuthSavedMask refill={() => setMaskVisible(false)}/> 
                                </Box>
                            }
                        </Box>
                    </TitleContent>
                        
                    <TitleContent isTools={true} expandable={true} title='Tools' isVisible={predefinedTools && !!predefinedTools.length}>
                        <Box>
                            {
                                predefinedTools && !!predefinedTools.length && predefinedTools.map(item => (
                                    <ToolsCard
                                        key={item.name}
                                        toolName={item.name}
                                        toolDesc={item.description}
                                    />
                                ))
                            }
                        </Box>

                    </TitleContent>

                    
                    
                    <AppButton
                        mt='24px'
                        onClick={verifyAndSave}
                        loading={isLoading}
                        title="Save Auth"
                        maxW='132px'
                    />
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}


const TitleContent = ({
    title,
    children,
    isVisible,
    expandable,
    isTools = false
}) => {
    const [isOpen, setOpen] = useState(true)
    return(
        <>
            {
                isVisible && 
                <Box className='fx-col' mt='24px'>
                    <Box className='fx-row ai-ct jc-sb' cursor={expandable ? 'pointer' : 'default'} onClick={expandable ? () => setOpen(!isOpen) : () => null}>
                        <Text color='#E0E0E0' fontWeight={700} fontSize='16px'>{title}</Text>
                        {
                            expandable && 
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
                        }
                    </Box>
                        
                    <AnimatePresence initial={false}> 
                        <MotionBox
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            overflow="hidden"
                        >
                            {
                                isOpen ? 
                                <Box 
                                    mt='12px'
                                    borderRadius='12px'
                                    bgColor={isTools ? 'transparent' : 'rgba(31, 31, 34, 0.50)'}
                                    p={isTools ? '0px' : '12px 16px 16px 16px'}
                                    border={isTools ? 'none' : '1px solid #293033'}
                                >
                                    {children}
                                    
                                </Box> : null 
                            }
                            
                        </MotionBox>
                    </AnimatePresence>
                </Box>
            }
        </>
    )
}