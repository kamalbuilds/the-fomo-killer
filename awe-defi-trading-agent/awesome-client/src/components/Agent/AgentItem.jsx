'use client'

import React, { useState } from 'react'
import { Box, Text,  HStack,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,  } from '@chakra-ui/react'

import Image from 'next/image'
import { ArrowRightImg, CollectedImg, NotCollectedImg, WalletAvatarImg} from '@/assets/images/'
import { Tag, showToast, SafeImage, ButtonWrap} from '..'
import { favoriteAgentApi, unfavoriteAgentApi, getAgentFavoriteStatusApi, getAgentDetailApi, agentInitApi } from '@/api'
import { useRouter } from 'next/navigation'
import { maxText } from '@/utils'
import { ArrowRightIcon } from '@chakra-ui/icons'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { agentConversationIdAction, callWalletSignAction, selectUserInfo } from '@/redux/reducer'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit';



export const AgentItem = (item) => {
    const { 
        categories,
        name,
        username,
        description,
        isFavorited,
        id,
        avatar,
        agentAvatar,
        taskId,
    } = item

    const [favorited, setFavorited] = useState(isFavorited)
    const router = useRouter()

    const userInfo = useAppSelector(selectUserInfo)
    const { address, isConnected} = useAccount()
    const { openConnectModal } = useConnectModal()
    const dispatch = useAppDispatch()
   
    const onCollected = async(e) => {
        e.stopPropagation()
        e.preventDefault()
        if(favorited) {
            setFavorited(false)
            const b = await unfavoriteAgentApi(id)
            if(b) {
                showToast('success', 'Successfully canceled the collection')
            }
        }else {
            setFavorited(true)
            const a = await favoriteAgentApi(id)
            if(a) {
                showToast('success', 'Successfully collected')
            }
        }
    }

    const onItem = async() => {

        if (!address || !isConnected) {
            openConnectModal?.()
            return
        }

        if(!!!userInfo.id) {
            dispatch(callWalletSignAction(true))
            return showToast('warning', 'Please complete the wallet signature')
        }
        const agentId = id

        const i = await agentInitApi(agentId)
        
        if(i && i.conversationId) {
            dispatch(agentConversationIdAction(i.conversationId))
            router.push(`/agent/${i.conversationId}/${agentId}/${taskId}`)
        }
       
    }
    return(
        <Box
            border='1px solid #293033'
            maxW='380px' 
            className='cursor-pointer w-full p-[16px] bg-[#101012] rounded-[12px] '
            _hover={{
                background: 'radial-gradient(88.34% 85.35% at 50% 50%, #010101 0%, #0E3263 100%)'
            }}
            onClick={onItem}
        >
            <Box
                className='w-full fx-row ai-ct jc-sb '
                h='48px'
                gap={{ base: '12px', sm: '0' }}
                mb={{ base: '12px', sm: '0' }}
            >
                <Box className='fx-row ai-ct '>
                    <Image src={agentAvatar || WalletAvatarImg} height={48} width={48} alt='agentAvatar' className='rounded-[100px]'/> 

                    
                    <Box className='' ml='8px' h='100%'>
                        <Text
                            color='#E0E0E0'
                            fontSize={{ base: '15px', sm: '16px', md: '18px' }}
                            ml={{ base: '4px', sm: '6px' }}
                            fontWeight={600}
                            maxW={{ base: '70vw', sm: '180px', md: '220px' }}
                            whiteSpace="nowrap"
                            overflow="hidden"
                            className=''
                            title={name}
                            textOverflow="ellipsis"
                        >
                            {maxText(name, 15)}
                        </Text>
                        <Box className='fx-row ai-ct' mt='8px'>
                            <Image src={avatar} height={15} width={15} alt='user' className='rounded-[100px]'/>
                            <Text ml='2px' fontSize='12px' color='#E0E0E0' fontWeight={400}>@{username}</Text>
                        </Box>
                    </Box>
                 
                </Box>
               
                <Image src={favorited ? CollectedImg : NotCollectedImg } height={23} width={22} alt='collected' className='click' onClick={onCollected}/> 

            
            </Box>


            <Text
                className='line2 '
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
            <Box className='fx-row' gap='6px' flexWrap='wrap' mt='32px'>
                {
                    categories.map(c => <Tag title={c} key={c}/>)
                }
            </Box>        
             
             <Box className='fx-row jc-sb' mt='32px'>
                <div/>
                <ButtonWrap>
                    <Box className='click fx-row ai-ct jc-sb' px='12px' h='34px' bgColor='#1F1F22' borderRadius='32px'>
                        <Text color='#E0E0E0' fontSize='14px'>Run Agent</Text>
                        <Image src={ArrowRightImg} className='ml-[10px]' height={10} width={10} alt='1'/>
                    </Box>
                </ButtonWrap>
             </Box>
        </Box>
    )
}
export const AgentItemLoading = () => {
    return(
        <Box
            maxW='380px' 
            className='w-full p-[16px] bg-[#101012] rounded-[12px] '
        >
            <Box
                className='w-full fx-row ai-ct jc-sb '
                h='48px'
                gap={{ base: '12px', sm: '0' }}
                mb={{ base: '12px', sm: '0' }}
            >
                <Box className='fx-row ai-ct '>
                    <SkeletonCircle size="48px" />
                    <Box className='' ml='8px' h='100%'>
                        <Skeleton height="5" />
                        <Skeleton height="5" width="50%" />                      
                    </Box>
                </Box>

                 <SkeletonCircle size="22px" />
               
            
            </Box>

            <Stack 
                flex="1" 
                mt={{ base: '10px', sm: '16px' }}
                h={{ base: '32px', sm: '40px' }}
                spacing={4}>
                <Skeleton height="5" />
                <Skeleton height="5" width="80%" />
            </Stack>

    
            <Box className='fx-row' gap='6px' flexWrap='wrap' mt='32px'>
                <Skeleton height="6" width="20%" />
                <Skeleton height="6" width="20%" />
                <Skeleton height="6" width="20%" />
            </Box>        
             
             <Box className='fx-row jc-sb' mt='32px'>
                <div/>
                <Skeleton height="6" width="30%" />
             </Box>
        </Box>
    )
}