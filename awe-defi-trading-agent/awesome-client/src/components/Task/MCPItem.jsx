'use client'

import React, { useState } from 'react'
import { Box, Text,  HStack,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,  } from '@chakra-ui/react'
import Image from 'next/image'
import { openLink } from '@/utils'
import { GithubImg, Checkbox2Img, ArrowRightImg, ArrowRightGreenImg } from '@/assets/images/'
import { AuthRequiredButton, ButtonWrap, MCPDetail } from '..'

export const MCPItem = ({
    category,
    githubUrl,
    imageUrl,
    name,
    description,
    maxW='380px',
    predefinedTools,
    authParams,
    authRequired,
    authVerified,
    isWorkflow = false,
   
}) => { 
    const [isOpen, setOpen] = useState(false)

    return(
        <Box className='w-full center'>
            <Box
                onClick={() =>{ !!!isWorkflow && setOpen(true) }}
                border='1px solid #293033'
                maxW={maxW} 
                className='cursor-pointer w-full p-[16px] bg-[#101012] rounded-[12px]'
                _hover={{
                    background: 'radial-gradient(88.34% 85.35% at 50% 50%, #010101 0%, #0E3263 100%)'
                }}
            >
                <Box
                    className='w-full fx-row ai-ct jc-sb'
                    h='48px'
                    gap={{ base: '12px', sm: '0' }}
                    mb={{ base: '12px', sm: '0' }}
                >
                    <Box className='fx-row ai-ct'>
                        <Box borderRadius='100px' bg='#fff'>
                            <Image 
                                src={imageUrl} 
                                width={48} 
                                height={48} 
                                alt='logo' 
                                className='rounded-[100px]'
                            />
                        </Box>
                        <Text
                            color='#E0E0E0'
                            fontSize={{ base: '15px', sm: '16px', md: '18px' }}
                            ml={{ base: '4px', sm: '6px' }}
                            fontWeight={600}
                            maxW={{ base: '70vw', sm: '180px', md: '220px' }}
                            whiteSpace="nowrap"
                            overflow="hidden"
                            className='line1'
                            title={name}
                            textOverflow="ellipsis"
                        >
                            {name}
                        </Text>
                    </Box>
                    <Box
                        className='rounded-[32px] center'
                        py={{ base: '2px', sm: '4px' }}
                        px={{ base: '8px', sm: '12px' }}
                        minW="fit-content"
                        bgColor='rgba(255, 140, 0, 0.20)'
                    >
                        <Text
                            className='fm2'
                            color='#FF8C00'
                            fontSize={{ base: '11px', sm: '12px' }}
                            fontWeight={400}
                        >
                            { category}
                        </Text>
                    </Box>
                </Box>
                <Text
                    className='line2'
                    mt={{ base: '10px', sm: '16px' }}
                    h={{ base: '32px', sm: '40px' }}
                    color='rgba(224, 224, 224, 0.60)'
                    fontSize={{ base: '13px', sm: '14px' }}
                    fontWeight={350}
                    lineHeight={{ base: '18px', sm: '20px' }}
                    maxW="100%"
                    overflow="hidden"
                    textOverflow="ellipsis"
                >
                    {description}
                </Text>
                
                            
                <Box className='fx-row ai-ct jc-sb mt-[34px]'>
                    <Image 
                        src={GithubImg} 
                        className='w-[24px] h-[24px] cursor-pointer' 
                        alt='github' 
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            openLink(githubUrl)}
                        }/>
                        <AuthRequiredButton  authRequired={authRequired} authVerified={authVerified}/>
                </Box>  
            </Box>
            {
                isOpen && 
                <MCPDetail 
                    isOpen={isOpen} 
                    onClose={() => setOpen(false)} 
                    mcpInfo={{
                        authParams,
                        predefinedTools,
                        imageUrl,
                        name,
                        description,
                        authRequired,
                        authVerified,
                    }}
                />
            }
        </Box>
    )
}

export const MCPItemLoading = () => {
    return (
        <Box
         
            className="w-full p-[16px] bg-[#101012] rounded-[12px]"
        >
            <Box
                className="w-full fx-row ai-ct jc-sb "
                h="48px"
                gap={{ base: "12px", sm: "0" }}
                mb={{ base: "12px", sm: "0" }}
            >
                <Box className="fx-row ai-ct ">
                    <SkeletonCircle size="48px" />
                </Box>
                <Skeleton height="5" width="38%" /> 
            </Box>

            <Stack flex="1" mt={{ base: "10px", sm: "16px" }} spacing={4}>
                <Skeleton height="5" />
                <Skeleton height="5" width="80%" />
            </Stack>

            <Box className="fx-row ai-ct jc-sb mt-[34px]">
                <SkeletonCircle size="24px" />
                <Skeleton height="6" width="30%" />
            </Box>
        </Box>
    );
};

export const CategoryButtonLoading = () => {
    return(
        <Skeleton 
            height="48px"
            borderRadius='8px'
            width="20%" 
        /> 
    )
}

