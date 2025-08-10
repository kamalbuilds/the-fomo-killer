'use client'

import React, { useEffect, useState } from 'react'
import { Box, Text, Input, } from '@chakra-ui/react'
import { EyeImg, EyeClosedImg, } from '@/assets/images'
import Image from 'next/image'

export const PasswordInput = ({
    inputTitle,
    value,
    onChange,
    showPassword,
    togglePassword
    // defaultValue,

}) => {

    // const [value, setValue] = useState('')
    // const [showPassword, setShowPassword] = useState(false)

    const hasPasswordKeyword = /key|secret|access|token|password/i.test(inputTitle.toLowerCase());

    
    // useEffect(() => {
    //     if(defaultValue) {
    //         setValue(defaultValue)
    //     }
    // },[defaultValue])


    // const onChange = (e) => {
    //     setValue(e.target.value)
    // }
    // const isX = /^(x|twitter).*mcp$/.test(inputTitle)
    const isXUserName =  inputTitle.includes('Twitter Username')


    return(
        <Box className='fx-col gap-[8px] '>
            <Text color='#E0E0E0' fontSize='14px' fontWeight={500}>
                {`${inputTitle}:`}
            </Text>
            <Box position="relative">
                <Input
                    zIndex={1}
                    value={value}
                    onChange={onChange}
                    type={ hasPasswordKeyword ? (showPassword ? "text" : "password") : 'text' } 
                    _placeholder={{ color: "rgba(130, 139, 141, 0.50)" }}
                    placeholder="Enter"
                    bg="#1A1A1A"
                    border="1px solid #293033"
                    borderRadius="8px"
                    color="#E0E0E0"
                    fontSize="14px"
                    pr='12px'
                    pl={isXUserName ? '42px' : '12px'}
                    py="8px"
                    _hover={{ borderColor: "#293033" }}
                    _focus={{
                        borderColor: "#293033",
                        boxShadow: "none",
                    }}
                />


                        
                {
                    isXUserName && 
                    <Box
                        zIndex={2}
                        borderRadius="8px"
                        className='center'
                        position="absolute"
                        top="50%"
                        left={0}
                        w='42px'
                        h='100%'
                        transform="translateY(-50%)"
                    >
                        <Text color='#fff' fontSize='14px' fontWeight={500}>@</Text>
                    </Box>
                }
                {hasPasswordKeyword && (
                    <Box    
                        zIndex={2}
                        position="absolute"
                        top="50%"
                        right="12px"
                        transform="translateY(-50%)"
                        cursor="pointer"
                        onClick={togglePassword} 
                    >
                        <Image
                            style={{ filter: "invert(1)" }}
                            src={showPassword ? EyeImg : EyeClosedImg}
                            alt="eye"
                            height={20}
                            width={20}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    )
}