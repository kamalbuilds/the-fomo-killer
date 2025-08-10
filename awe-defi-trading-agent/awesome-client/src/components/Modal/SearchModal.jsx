'use client'

import React, { useState, useEffect } from 'react'
import { Box, Text, Modal, ModalOverlay, ModalContent, ModalBody, Input, InputGroup, InputLeftElement } from '@chakra-ui/react'
import { SearchImg, CloseImg } from '@/assets/images'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { useAppSelector } from '@/redux/hooks'
import { selectConversationsList } from '@/redux/reducer'


export const SearchModal = ({ isOpen, onClose }) => {
    const [searchText, setSearchText] = useState('')
    const router = useRouter()

    const conversationsList = useAppSelector(selectConversationsList)
    // 过滤对话列表
    const filteredConversations = conversationsList.filter(conv =>
        conv.title?.toLowerCase().includes(searchText.toLowerCase())
    )


    
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
                        <InputGroup>
                            <InputLeftElement>
                                <Image src={SearchImg} alt="search" className="w-[16px] h-[16px]" />
                            </InputLeftElement>
                            <Input
                                placeholder="Search Task..."
                                bg="#1F1F22"
                                color="#E0E0E0"
                                _placeholder={{ color: '#828B8D' }}
                                border='1px solid #293033'
                                 _hover={{ borderColor: "#293033" }}
                                _focus={{
                                    borderColor: "#293033",
                                    boxShadow: "none",
                                }}
                                h="40px"
                                pl="40px"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                />

                        </InputGroup>
                        <Box 

                            onClick={onClose}
                            className="cursor-pointer ml-[24px]"
                        >
                            <Image src={CloseImg} alt="close" className="w-[24px] h-[24px]" />
                        </Box>
                    </Box>

                    <Box 
                        h="378px"                   
                        overflowY="auto"            
                        className="scrollbar-hide"  
                    >
                        {filteredConversations.length > 0 ? (
                            filteredConversations.map((chat) => (
                            <Box
                                key={chat.id}
                                className="p-[16px] rounded-[8px] hover:bg-[#1F1F22] cursor-pointer mb-[8px]"
                                onClick={() => {
                                    onClose()
                                    router.push(`/task/${chat.id}/1`)
                                }}
                            >
                                <Text color="#E0E0E0" fontSize="14px" fontWeight={500}>
                                {chat.title || 'Untitled Conversation'}
                                </Text>
                                <Text color="#828B8D" fontSize="12px" mt="4px">
                                {chat.lastMessageContent || 'No messages yet'}
                                </Text>
                            </Box>
                            ))
                        ) : (
                            <Text color="#828B8D" fontSize="14px">
                            No conversations found
                            </Text>
                        )}
                    </Box>


                </ModalBody>
            </ModalContent>
        </Modal>
    )
}


