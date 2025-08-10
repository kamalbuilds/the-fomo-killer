'use client'
import React, { useEffect, useState } from 'react'
import { VStack, Text, Box, Textarea, HStack, Tooltip,Popover,PopoverTrigger, PopoverContent,Flex } from '@chakra-ui/react'
import { useAppSelector } from '@/redux/hooks';
import { selectSidebarExpand } from '@/redux/reducer';
import { AppendixImg, ArrowdownImg, CommandImg, MicrophoneImg, SelectedImg, VoiceImg } from '@/assets/images'
import Image from 'next/image'
import { ButtonWrap } from '@/components';

export const PopoverOption = ({onClose, isOpen, menu, activeLLM, onSelect, placement, children }) => {


    return (
        <Box>
            <Popover
                isOpen={isOpen}
                onClose={onClose}
                placement={placement}
                className=''
            >
                <PopoverTrigger>
                    <Box />
                </PopoverTrigger>
                <PopoverContent
                     _focus={{ boxShadow: 'none', outline: 'none' }}
                    bg="rgba(55, 60, 62, 0.60)"
                    backdropFilter='blur(5px)'
                    borderRadius="8px"
                    p="8px"
                    w="251px"
                
                    mb='8px'
                    className=''
                >
               

                <VStack spacing="8px" align="stretch" className=''>
                    {menu.map((model) => (
                        <Box 
                            className='fx-row ai-ct jc-sb w100'  
                            borderRadius="8px"   
                            px="12px" 
                            py="6px"       
                            _hover={{ bg: "rgba(81,81,81,0.5)" }}    
                            cursor="pointer" 
                            key={model.label}
                            onClick={() => {
                                onSelect(model.label)
                            
                            }}
                        >
                            <Flex className='fx-col'>
                                <Text 
                                    fontWeight={400} 
                                    fontSize="14px" 
                                    color="#E0E0E0"
                                >
                                    {model.name}
                                </Text>
                                {
                                    model.label &&
                                    <Text 
                                        mt='4px'
                                        fontWeight={400} 
                                        fontSize="12px" 
                                        color="#E0E0E099"
                                    >
                                        {model.label}
                                    </Text>
                                }
                            </Flex>
                            { activeLLM === model.label && 
                            <Image src={SelectedImg} width={24} height={24} alt='selected'/>
                            }
                        </Box>
                    ))}
                </VStack>

                </PopoverContent>
                {/* <Box className='' mt='-14px'>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="18" viewBox="0 0 21 18" fill="none">
                    <path d="M10.5 18L0.107698 -1.9576e-06L20.8923 -1.40549e-07L10.5 18Z" fill="#373C3E" fill-opacity="0.6"/>
                </svg>
                </Box> */}
            </Popover>
            <ButtonWrap>
                { children }                 
            </ButtonWrap>
        </Box>
    )
}
