'use client'
import React, { useState } from 'react'
import { Box, Text} from '@chakra-ui/react'
import Image from 'next/image'
import { Loading2Img, CopySuccessImg, CopyImg, ArrowRightGreenImg } from '@/assets/images'
import { showToast } from '..'
import { sleep } from '@/utils'
import { CopyToClipboard } from "react-copy-to-clipboard"

export const ButtonWrap = ({ children }) => {
    return(
        <Box className='cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity duration-200'>
            { children }
        </Box>
    )
}

export const AppButton = ({
    onClick,
    loading,
    title,
    icon,
    type = 'bg',
    px,
    maxW,
    mt
}) => {
    return(
        <Box w='100%' className='center' mt={mt || 0}>
            <Box
                maxW={maxW || 'auto'}
                className='w-full cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity duration-200 center'
                onClick={onClick}
                borderRadius="100px"
                h="34px"
                px={px || '32px'}
                border="1px solid #E0E0E0"
                bg={type === 'bg' ? "#E0E0E0" : 'none'}
                position="relative"
                
                >
                    <Box className='fx-row ai-ct' opacity={loading ? 0 : 1} transition="opacity 0.2s" >
                        {icon && <Image src={icon} alt="save" height={20} width={20} />}
                        <Text
                            ml={icon ? ['8px','2px','2px','2px','8px'] : 0} 
                            color={type === 'bg' ? "#010101" : '#fff'}
                            fontSize={['14px','14px','14px','14px','16px',]} 
                            whiteSpace='nowrap'
                            fontWeight={600}>
                            {title}
                        </Text>
                    </Box>

                    {loading && (
                        <Box
                            position="absolute"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                        >
                            <Image
                                className="rotation_animation"
                                src={Loading2Img}
                                height={24}
                                width={24}
                                alt="loading"
                            />
                        </Box>
                    )}
            </Box>
        </Box>  
    )
}


export const AppCopy = ({
    text
}) => {
    const [isCopied,setCopied] = useState(false)
    const onCopy = async () => {
        setCopied(true)
        showToast('success', 'Copied')
        await sleep(5000)
        setCopied(false)
    }

    return(
        <CopyToClipboard text={text || ''} onCopy={onCopy}>
            <Image
                src={isCopied ? CopySuccessImg : CopyImg}
                alt='copy'
                className='cursor-pointer mr-[4px]'
                height={16}
                width={16}
            />
        </CopyToClipboard>
    )
}


export const AuthRequiredButton = ({
    authRequired,
    authVerified
}) => {
    return (
        <ButtonWrap>
            {
                authRequired ? (
                    authVerified ? (
                        <Box className='fx-row ai-ct jc-sb rounded-[32px] px-[12px] py-[8px] center bg-[#313132]'>
                            <Text color='#00C11D' fontSize='12px' fontWeight={400}>✅ Auth Saved</Text>
                            <Image src={ArrowRightGreenImg} height={10} width={10} alt='go' className='ml-[4px]' />
                        </Box>
                    ) : (
                        <Text color='#E0E0E0' fontSize='12px' fontWeight={400}  className='fx-row ai-ct jc-sb rounded-[32px] px-[12px] py-[8px] center bg-[#313132]'>
                            Auth Required
                        </Text>
                    )
                ) : (
                    <Box className='fx-row ai-ct jc-sb rounded-[32px] px-[12px] py-[8px] center bg-[#313132]'>
                        <Text color='#00C11D' fontSize='12px' fontWeight={400}>No Auth Required</Text>
                        <Image src={ArrowRightGreenImg} height={10} width={10} alt='go' className='ml-[4px]' />
                    </Box>                
                )
            }
        </ButtonWrap>
    )
}