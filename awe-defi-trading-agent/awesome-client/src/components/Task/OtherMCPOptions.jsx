'use client'
import React, { useEffect, useState } from 'react'


import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { sleep } from '@/utils'
import {  ButtonWrap} from '..'
import { VStack, Text, Box, Popover,PopoverTrigger, PopoverContent,Flex } from '@chakra-ui/react'
import { OptionsImg, SearchImg} from '@/assets/images'




const MotionBox = motion(Box)

export const OtherMCPOptions = ({
    openOptions,
    onClose,
    isOpen,
    menu,
    onSelect
}) => {
  
    const [searchKeyword, setSearchKeyword] = useState('')
    // console.log('menu', menu)

    const filterBySearch = (list) => {
        if (!searchKeyword.trim()) return list
        const keyword = searchKeyword.trim().toLowerCase()
        return list.filter(mcp =>
            mcp.name.toLowerCase().includes(keyword) 
            // || mcp.description.toLowerCase().includes(keyword)
        )
    }

    const filterMenu = filterBySearch(menu)

    
    const isSelected = false
    return (
        <Box className='fx-row ai-ct jc-sb mb-[20px]'>
            <Box>
                <Popover
                    isOpen={isOpen} // 
                    onClose={onClose}
                    placement='bottom-end'
                >
                    <PopoverTrigger>
                        <Box />
                    </PopoverTrigger>
                    <PopoverContent
                        _focus={{ boxShadow: 'none', outline: 'none' }}
                        bg="rgba(55, 60, 62, 0.60)"
                        backdropFilter='blur(5px)'
                        borderRadius="8px"
                        px="6px"
                        py='8px'
                        w="262px"
                        border='none'
                    >
                    
                         <Box className="fx-row ai-ct jc-sb" h='42px' pl='12px'>
                            <Image src={SearchImg} height={16} width={16} alt="search" className='mr-[8px]' />
                            <input                                
                                type="text"
                                placeholder="Search"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="w-full h-full bg-transparent border-none outline-none text-[12px] text-[#E0E0E0] placeholder:text-[#878787]"

                            />
                        </Box>

                        <VStack className=''>
                            {filterMenu.map((model) => (
                                <Box 
                                    className='fx-row ai-ct jc-sb w100'  
                                    borderRadius="8px"   
                                    p='6px 12px'
                                    border={isSelected ? '1px solid #464648' : 'none'}
                                    _hover={{ bg: "#111111" }}    
                                    cursor="pointer" 
                                    key={model.description}
                                    onClick={() => onSelect(model.name)}
                                >
                                    <Flex className='fx-col'>
                                        <Text 
                                            fontWeight={400} 
                                            fontSize="14px" 
                                            color="#E0E0E0"
                                        >
                                            {model.name}
                                        </Text>
                                     
                                          
                                        <Text 
                                            mt='4px'
                                            fontWeight={400} 
                                            fontSize="12px" 
                                            color="#E0E0E099"
                                        >
                                            {model.name}
                                        </Text>
                                       
                                    </Flex>
                                    <Box 
                                        className='center' 
                                        borderRadius='4px'
                                        p='4px' 
                                        bg={model.authRequired ? (model.authVerified ? '#1C2F21' : '#1F1F22') : '#1C2F21'}
                                        fontSize='12px'
                                        fontWeight={400}
                                        color={model.authRequired ? (model.authVerified ? '#00C11D' : '#E0E0E0') : '#00C11D'}
                                        whiteSpace='nowrap'
                                    >
                                        {
                                            model.authRequired ? (model.authVerified ? 'Auth Saved' : 'Auth Required') : 'No Auth Required'
                                        }
                                    </Box>
                                </Box>
                            ))}
                        </VStack>
                    </PopoverContent>
                </Popover>

                <ButtonWrap>
                      <Flex 
                        onClick={openOptions} 
                        className='fx-row ai-ct bg-[#1F1F22] rounded-[8px]'  
                        p='8px 12px'
                    >
                        <Text color='#E0E0E0' mr='4px' fontSize='14px' fontWeight={600}>Other MCP Options</Text>
                        <Image src={OptionsImg} height={6} width={6} alt='options'/>
                    </Flex>
                </ButtonWrap>
            </Box>
           <div/>
        </Box>
    )
}



