'use client'

import React, {  } from 'react'
import { Box, Text, useBreakpointValue } from '@chakra-ui/react'
import Image from 'next/image'
import { useAppSelector } from '@/redux/hooks'
import { selectSidebarExpand } from '@/redux/reducer'
import {  CloseImg, ErrorImg,SuccessImg, WarningImg} from '@/assets/images/'
import { toast } from 'react-toastify'
import { useAccount } from 'wagmi'
import { EXPAND_SIDEBAR, NAV_HEIGHT, SYSTOLE_SIDEBAR } from '@/config'
import { usePathname } from 'next/navigation'



export const SafeImage = ({ src, ...props }) => {
  if (!src) return null
  return <Image src={src} {...props} />
}


export const MainPage = ({children}) => {
    const {  isConnected } = useAccount()
    const isSidebarExpand = useAppSelector(selectSidebarExpand)
    const leftMargin = isConnected ? (isSidebarExpand ? `${EXPAND_SIDEBAR}px` : `${SYSTOLE_SIDEBAR}px`) : 0   
    const w = isSidebarExpand ? `calc(100% - ${EXPAND_SIDEBAR}px)` : `calc(100% - ${SYSTOLE_SIDEBAR}px)`
    const pathname = usePathname()
    const landingPage = pathname.includes('landing')

    const isMobile = useBreakpointValue({ base: true, md: false })

    return (
        <Box 
            transition='width 0.3s ease-in-out, margin-left 0.3s ease-in-out '
            ml={{ base: 0, md: landingPage ? 0 : leftMargin }}
            className='center'
            w={isMobile ? '100%' : { w: '100%', md: w }}
            maxW='1900px'
            px='20px'
            pt={`${NAV_HEIGHT}px`}
            h='100vh'
        >
            {children}
        </Box>
     
    )
}







const iconMap = {
  success: <Image src={SuccessImg} alt='success' height={20} width={20}/>,  
  error: <Image src={ErrorImg} alt='error' height={20} width={20}/>,   
  warning: <Image src={WarningImg} alt='warning' height={20} width={20}/>,  
}

export const AppToast = ({ type = 'success', message, closeToast }) => {
  return (
    <Box
       display="inline-flex"
      alignItems="center"
      padding="10px 32px 10px 8px"
      gap="24px"
      borderRadius="4px"
      background="rgba(55, 60, 62, 0.60)"
      backdropFilter="blur(5px)"
      color="#FFFFFF"
      fontSize="14px"
      fontWeight="500"
      maxW="320px"
      boxShadow="lg"
    >
      {/* Icon */}
      {iconMap[type]}

      {/* Message */}
      <Text flex="1">{message}</Text>

      {/* Close Button */}
      <Image  onClick={closeToast} src={CloseImg} alt='warning' height={20} width={20} className='cursor-pointer'/>

    </Box>
  )
}



export const showToast = (type = 'success', message = '') => {
  toast(
    ({ closeToast }) => <AppToast type={type} message={message} closeToast={closeToast} />,
    {
      position: 'top-right',
      autoClose: 3000,
      closeOnClick: false,
      draggable: false,
      pauseOnHover: true,
      hideProgressBar: true,
      closeButton: false, // 我们使用自定义的 close icon
      style: {
        background: 'transparent',
        boxShadow: 'none',
        padding: 0,
      }
    }
  )
}


// export const showToast = (type = 'success', message = '') => {
//   toast(<AppToast type={type} message={message} />, {
//     position: 'top-right',
//     autoClose: 500000,
//     closeOnClick: false,
//     draggable: false,
//     pauseOnHover: true,
//     hideProgressBar: true,
//   })
// }


export const Tag = ({ title }) => {
  return(
    <Box
    borderRadius='32px'
            bg={title.includes('mcp') ? 'rgba(0,193,29,0.2)' : 'rgba(65, 129, 219, 0.20)'}
            p='4px 12px'
            className='center fm2'
            color={ title.includes('mcp') ? '#00C11D' : '#4181DB'}
            fontSize='12px'
            fontWeight={400}
        >
            { title}
        </Box>
    )
}