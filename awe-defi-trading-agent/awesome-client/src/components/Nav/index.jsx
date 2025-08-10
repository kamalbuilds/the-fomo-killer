'use client'
import React,  { useEffect, useRef, useState }  from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Box, Text,useBreakpointValue } from '@chakra-ui/react'
import { AWEImg,SlogenImg,CollapseImg } from '@/assets/images/index'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { callWalletSignAction, isSidebarExpandAction, selectCallWalletSign, selectSidebarExpand } from '@/redux/reducer/navbarReducer'
import { useWalletLogin } from '@/utils/loginWithWallet'
import { getConversationListApi, getMembershipStatusApi, logoutApi, userInfoApi } from '@/api'
import { ButtonWrap, showToast, WalletConnect } from '..'
import { conversationsListAction, membershipStatusAction, userInfoAction } from '@/redux/reducer'
import { selectTaskTitle } from '@/redux/reducer'
import { NAV_HEIGHT } from '@/config'
import { usePathname, useRouter} from 'next/navigation'
import Link from 'next/link'


const menus = [
  { url: '/mcp', name: 'MCP MARKETPLACE' },
  { url: '/agent/public-agents', name: 'AGENT MARKETPLACE' },
  { url: '/tasks', name: 'TASKS' },
 
]

export const Nav = () => {
  const { address, status } = useAccount()
  const dispatch = useAppDispatch()
  const isSidebarExpand = useAppSelector(selectSidebarExpand)

  const { isLoggedIn, loginWithWallet } = useWalletLogin()
  const taskTitle = useAppSelector(selectTaskTitle)
  
  const pathname = usePathname()
  const router = useRouter()
  
  const isTaskPage = pathname === '/task'
  const isLandingPage = pathname.includes('landing')
  const isMobile = useBreakpointValue({ base: true, md: false })
  
  
  const loginInProgressRef = useRef(false)
  const callWalletSign = useAppSelector(selectCallWalletSign)
  
  const [statusHistory, setStatusHistory] = useState([])
  
  const [isWalletConnected, setIsWalletConnected] = useState('loading') 
  
  const isConnected = isWalletConnected === 'connected'

  const prevConnectedRef = useRef(isConnected)

  // console.log('isWalletConnected', isWalletConnected)
  // console.log('isConnected', isConnected)
  // console.log('statusHistory', statusHistory)
  // console.log('isLoggedIn', !isLoggedIn)
  // console.log('loginInProgressRef.current', !loginInProgressRef.current)

  useEffect(() => {
    setStatusHistory(prev => [...prev, status])
  }, [status])
  
  useEffect(() => {
    if (statusHistory.length > 2) {
      const lastStatus = statusHistory[statusHistory.length - 1]
      if (lastStatus === 'connected') {
        setIsWalletConnected('connected')
      } else if (lastStatus === 'disconnected') {
        setIsWalletConnected('disconnected')
      }
    }
  }, [statusHistory])

  useEffect(() => {
    getUserInfo()
  },[])
  useEffect(() => {
    if (address && !isLoggedIn) {
    // if (address && !isLoggedIn && !loginInProgressRef.current) {
      loginInProgressRef.current = true

      loginWithWallet(address, () => {
        getUserInfo()
        getMembershipStatus()
      }).finally(() => {
        dispatch(callWalletSignAction(false))
      })
    }
  }, [address, isLoggedIn, loginWithWallet])

  useEffect(() => {
    if(callWalletSign) {
      loginWithWallet(address, () => {
        getUserInfo()
        getMembershipStatus()
      }).finally(() => {
       
        dispatch(callWalletSignAction(false))
      })
    }
  },[address,callWalletSign]) 




  useEffect(() => {
    if (prevConnectedRef.current && !isConnected) {
      onLogout()
    }
    prevConnectedRef.current = isConnected
  }, [isConnected])

  useEffect(() => {
    const handleResize = () => {
      const isTabletOrSmaller = window.innerWidth <= 768 // 平板宽度阈值
      if (isTabletOrSmaller && isSidebarExpand) {
        dispatch(isSidebarExpandAction(false))
      }
    }

    // 初始检查
    handleResize()

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)

    // 清理监听器
    return () => window.removeEventListener('resize', handleResize)
  }, [dispatch, isSidebarExpand])

  
  const onLogout = async () => {
    const refresh_token = localStorage.getItem('refresh_token')
    if (refresh_token) {
      try {
        await logoutApi(refresh_token)
      } catch (e) {
        console.error('Logout failed silently:', e)
      }
    }

    showToast('success', 'Logout successful')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token')
    dispatch(userInfoAction(null))
  }


  const getUserInfo = async() => {
    const info = await userInfoApi()
    if(info && info.user) {
      dispatch(userInfoAction(info.user))
    }
  }

 
  const getMembershipStatus = async() => {
    const a = await getMembershipStatusApi()
    if(a) {
      dispatch(membershipStatusAction(a))
    }
    const b = await getConversationListApi({
      limit: 1000,
      offset: 0
    })

    if(b && b.conversations && !!b.conversations.length) {
      dispatch(conversationsListAction(b.conversations))
    }
  }

  
  const leftMargin = isConnected ? (isSidebarExpand ? '223px' : '66px') : 0

  if(isWalletConnected === 'loading') {
    return null
  }
  return (
    <Box 
        zIndex={2}
        height={NAV_HEIGHT}
        className='fx-col jc-ct w-full bg-[#010101] ' 
        pos='fixed' 
        top={0} 
        transition='margin-left 0.3s ease-in-out'
        ml={{ base: 0, md: isLandingPage ? 0 : leftMargin }}
      >
        {
          isLandingPage && !isMobile ? (
            <Box className=' fx-row ai-ct jc-sb w100 ' px='20px'>
              {/* left */}
              <Box className='fx-row ai-ct  click' onClick={() => router.push('/landing')}>
                <Image alt='awe' src={AWEImg} className='w-[62px] h-[32px]'/>
               
                <Box className='fm2' color='#828B8D' fontSize='12px' fontWeight={300} ml='16px' >
                  <Text>Autonomous World Engine Service via </Text>
                  <Text>Open MCP Ecosystem (AWESOME) </Text>
                </Box>
             
            </Box>

              {/* right */}
              <Box className='fx-row ai-ct'>
                <Box className='fx-row ai-ct' mr='32px' gap='8px'>
                  {
                    menus.map(item => (
                      <Link href={item.url} key={item.name}>
                          <ButtonWrap>
                            <Box className='no-underline' bgColor='#1F1F23' borderRadius='8px' px='18px' py='6px'>
                              <Text color='#E0E0E0' fontSize='13px' fontWeight={300}>{item.name}</Text>
                            </Box>
                          </ButtonWrap>
                      </Link>
                    ))
                  }
                </Box>
                <WalletConnect/>
              </Box>
             
            </Box>
          ): (
            <>
              {
                isConnected ? (
                  <Box className='h-[35px] fx-row ai-ct pl-[20px] h100' borderBottom='1px solid #293033'>
                    <Box className=' w-[40px]' borderRight={ taskTitle ? '1px solid #293033' : ''}>
                      <Image 
                        style={{ transform: isSidebarExpand ? 'rotate(0deg)' : 'rotate(180deg)' }}
                        alt='collapse' 
                        src={CollapseImg} 
                        onClick={() => dispatch(isSidebarExpandAction(!isSidebarExpand))} 
                        className='w-[24px] h-[24px] cursor-pointer'
                      />
                    </Box>
                    <Text color='#E0E0E0' fontSize='16px' fontWeight={600} ml='8px'>{isTaskPage ? taskTitle : ''}</Text>
                  </Box>
                ) : (
                <Box className=' fx-row ai-ct jc-sb px-[20px]' height={NAV_HEIGHT}>
                    <Box className='fx-row ai-ct click' onClick={() => router.push('/landing')}>
                        <Image alt='awe' src={AWEImg} className='w-[62px] h-[32px]'/>
                        {
                          !isMobile && 
                          <Box className='fm2' color='#828B8D' fontSize='12px' fontWeight={300} ml='16px' >
                            <Text>Autonomous World Engine Service via </Text>
                            <Text>Open MCP Ecosystem (AWESOME) </Text>
                          </Box>
                        }
                    </Box>
                    <WalletConnect/>
                </Box>
                )
              }
            </>
          )
        }
    </Box>
  )
}
