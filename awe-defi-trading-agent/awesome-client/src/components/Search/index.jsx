import React from 'react'
import { Box, Text,Tooltip, useBreakpointValue } from '@chakra-ui/react'
import { SearchImg } from '@/assets/images'
import Image from 'next/image'
import { searchOpenAction, selectSidebarExpand } from '@/redux/reducer'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

export const Search = ({ onCloseDrawer }) => {
  const isSidebarExpand = useAppSelector(selectSidebarExpand)
  const dispatch = useAppDispatch()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const { openConnectModal } = useConnectModal()
  const { address, isConnected } = useAccount()

  const handleClick = () => {
    if (!address || !isConnected) {
      openConnectModal?.()
      return
    }

    dispatch(searchOpenAction(true))

    if (isMobile) {
      onCloseDrawer?.()
    }
  }

  if (isMobile) {
    return (
      <Box
        onClick={handleClick}
        className='pl-[8px] h-[38px] cursor-pointer fx-row ai-ct w-[191px] rounded-[8px] bg-[#1F1F22]'
      >
        <Image alt='search' src={SearchImg} className='w-[16px] h-[16px]' />
        <Text color='#828B8D' fontSize='14px' ml='8px'>Search</Text>
      </Box>
    )
  }

  return (
    <Box onClick={handleClick} mt=''>
      {isSidebarExpand ? (
        <Box className='pl-[8px] h-[38px] cursor-pointer fx-row ai-ct w-[191px] rounded-[8px] bg-[#1F1F22] mt-[32px]'>
          <Image alt='search' src={SearchImg} className='w-[16px] h-[16px]' />
          <Text color='#828B8D' fontSize='14px' ml='8px'>Search</Text>
        </Box>
      ) : (
          <Box
            my='14px'
            w='36px'
            h='34px'
            _hover={{ bg: "#232328" }}
            className='rounded-[8px] cursor-pointer center'
            bgColor='transparent'
          >
            <Image alt='search' src={SearchImg} className='w-[18px] h-[16px]' />
          </Box>
   
      )}
    </Box>
  )
}
