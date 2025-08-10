'use client'
import React, { useEffect, useState } from 'react';
import { Box, VStack, Tooltip, Text, Spacer,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue

 } from '@chakra-ui/react';
import Image from 'next/image';
import { SearchImg,ArrowupImg, ArrowdownImg, AgentImg, CollapseImg,  MarketplaceImg, 
  TaskImg, AWEImg, WalletAvatarImg, BETAImg, McpTaskImg, AgentTaskImg } from '@/assets/images'
import Link from 'next/link'
import { searchOpenAction, selectSearchOpen, selectSidebarExpand, isSidebarExpandAction, selectUserInfo,
    membershipStatusAction, selectMembershipStatus, conversationsListAction, selectConversationsList, 
    selectTaskTitle
 } from '@/redux/reducer'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { ButtonWrap, SafeImage, Search, SearchModal} from '@/components'  
import { useAccount } from 'wagmi'
import { formatAddress } from '@/utils';
import { useAccountModal } from '@rainbow-me/rainbowkit';
import { getConversationListApi, getMembershipStatusApi, getTaskListApi, deleteConversationApi } from '@/api';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { usePathname } from 'next/navigation';
import { CloseIcon, DeleteIcon } from '@chakra-ui/icons'; 
import { IconButton } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar = () => {
  const dispatch = useAppDispatch()

  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const searchOpen = useAppSelector(selectSearchOpen)
  const isSidebarExpand = useAppSelector(selectSidebarExpand)
  const { address, isConnected } = useAccount()

  if (!address || !isConnected) {
      return null
  }
  return (
    <>
      {/* 按钮用于开启 Drawer，你可以根据项目自行放置 */}
      {isMobile && (
        <Box position="fixed" top="16px" left="16px" zIndex="overlay">
          <Box
            w="36px"
            h="36px"
            bg="#1F1F22"
            rounded="8px"
            onClick={() => {
              onOpen()
             
              dispatch(isSidebarExpandAction(true))
            }}
            className="center cursor-pointer"
          >
            <Image 
              style={{ transform: isSidebarExpand ? 'rotate(0deg)' : 'rotate(180deg)' }}
              alt='collapse' 
              src={CollapseImg} 
              className='w-[24px] h-[24px] cursor-pointer'
            />
          </Box>
        </Box>
      )}

      {/* ✅ Drawer 用于移动端 */}
      {isMobile ? (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent bg="#010101" borderRight="1px solid #293033" pt="32px" maxW='223px'>
            <DrawerCloseButton color="#E0E0E0" />
              <SidebarContent onItemClick={() => {
                console.log('onClose')
                onClose()
              }} />
          </DrawerContent>
        </Drawer>
      ) : (
        // ✅ 正常桌面 Sidebar 显示
        <Box
          display={['none', 'none', 'flex']}
          w={isSidebarExpand ? '223px' : '66px'}
          transition="width 0.3s ease-in-out"
          h="100vh"
          bg="#010101"
          borderRight="1px solid #293033"
          flexDirection="column"
          position="fixed"
          left="0"
          top="0"
          pt="32px"
          px={isSidebarExpand ? '16px' : '0px'}
        >
          <SidebarContent onItemClick={onClose} />
        </Box>
      )}

      <SearchModal isOpen={searchOpen} onClose={() => dispatch(searchOpenAction(false))} />
    </>
  );

}
export const SidebarContent = ({ onItemClick,  }) => {
  
  const isSidebarExpand = useAppSelector(selectSidebarExpand)
  const { address, isConnected} = useAccount()
 
  const dispatch = useAppDispatch()

  const { openAccountModal } = useAccountModal()
  const userInfo = useAppSelector(selectUserInfo)
  const membershipStatus = useAppSelector(selectMembershipStatus)
  const conversationsList = useAppSelector(selectConversationsList)
  const taskTitle = useAppSelector(selectTaskTitle)
  const pathname = usePathname()
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [maxH, setMaxH] = useState('40vh')
  const [agentMore, setAgentMore] = useState(false)
  const [taskMore, setTaskMore] = useState(false)


  useEffect(() => {
    if(!isSidebarExpand) {
      setAgentMore(false)
    }
  },[isSidebarExpand])
  useEffect(() => {
    const updateHeight = () => {
      const height = window.innerHeight

      if (height < 500) {
        setMaxH('16vh')  // 很矮的设备
      } else if (height < 700) {
        setMaxH('25vh')  // 中等屏幕
      } else {
        setMaxH('40vh')  // 默认
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  useEffect(() => {
    if(address && userInfo && userInfo.id) {
      getMembershipStatus()
    
    }else {
      dispatch(isSidebarExpandAction(false))
    }
  },[userInfo,address])

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

  

  // console.log('conversationsList', conversationsList)

  return (
    <Box>
      <Box className='center '>
        <Link href="/landing" onClick={onItemClick}>
          <Image 
            alt='awe' 
            src={AWEImg} 
            className={isMobile ? 'w-[62px] h-[32px]' : `${isSidebarExpand ? 'w-[62px] h-[32px]' : 'w-[31px] h-[16px]'}`} 
          />
        </Link>
      </Box>

      <VStack className=''>
        <Search onCloseDrawer={onItemClick}/>
        <MenuItem 
          isActive={pathname.includes('/mcp')} 
          icon={MarketplaceImg} 
          name='MCP Marketplace'
          url='/mcp'
     
          onCloseDrawer={onItemClick}/>
        <MenuItem 
          more={true} 
          isMore={agentMore}
          isActive={pathname.includes('/agent')} 
          icon={AgentImg} 
          name='Agent Marketplace' 
          url=''  
          onCloseDrawer={onItemClick}
          handleArrow={() => {
            setTaskMore(false)
            setAgentMore(!agentMore)
          }}
        />

        <AnimatePresence initial={false}>
          {agentMore && (
            <motion.div
              key="agentMore"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              { 
              !address ? [
                { name: 'Public Agents', tag: 'public-agents', },
              ] : 
              [
                { name: 'Public Agents', tag: 'public-agents', },
                { name: 'My Private Agents', tag: 'my-private-agents', },
                { name: 'My Saved Agents', tag: 'my-saved-agents' },
              ].map(item => (
                <MenuItem
                  key={item.name}
                  isActive={pathname.includes(item.tag)}
                  name={item.name}
                  url={`/agent/${item.tag}`}
                  onCloseDrawer={onItemClick}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

       
        <MenuItem 
          more={true} 
          isMore={taskMore}
          handleArrow={() => {
            setAgentMore(false)
            setTaskMore(!taskMore)
          }}
          isActive={pathname.includes('/task')} 
          icon={TaskImg} 
          name='Tasks' 
          url='/tasks' 
          onCloseDrawer={onItemClick}
        />
        <MenuItem 
          isActive={pathname.includes('/trading')} 
          icon={MarketplaceImg} 
          name='DeFi Trading' 
          url='/trading' 
          onCloseDrawer={onItemClick}
        />
        <AnimatePresence initial={false}>
          {
            (isSidebarExpand || isMobile) && taskMore && 
            <motion.div
              key="taskMore"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
               style={{ position: 'relative', zIndex: 1,}}
            >
              <Box 
                maxH={maxH}
                overflowY="auto"     
                className=''    
                pos="relative" 
                zIndex={1}     
                mt="-12px"
              >
                {conversationsList.map(item => (
                  <ConversationItem
                    key={item.id}
                    item={item}
                    isActive={item.title === taskTitle}
                    onClick={onItemClick}
                  />
                ))}
              </Box>
            </motion.div>
          }
        </AnimatePresence>
      </VStack>

      <Spacer />

      {(isSidebarExpand || isMobile) ? (
        <Box 
          zIndex={10} 
          pos='absolute' 
          bottom={0} 
          left={0} 
          w='100%' 
          px='16px'
          h={['144px','144px','191px','191px']}
          className=" fx-col ai-ct " 
          pt={['12px','24px','32px','32px']}
          borderTop="1px solid #293033" 
        >
       
          <Box color="#E0E0E0" className="w-[191px] h-[60px] fx-col ai-ct jc-ct rounded-[8px] bg-[#1F1F22]">
            <Text fontSize="14px" fontWeight={400} color="rgba(224, 224, 224, 0.60)">
              Current Plan: <span style={{ color: '#E0E0E0' }}>
                {membershipStatus.membershipType
                  ? membershipStatus.membershipType.charAt(0).toUpperCase() + membershipStatus.membershipType.slice(1)
                  : 'Free'}
              </span>
            </Text>
            <Link href="/subscribe">
              <Box className="mt-[4px] rounded-[8px] center click" py="4px" px="12px" fontSize="12px" fontWeight={400} border="1px solid #828B8D">
                Manage Subscription
              </Box>
            </Link>
          </Box>

          <Box className="fx-row ai-ct w-full jc-sb mt-[24px] cursor-pointer" onClick={openAccountModal}>
            <Box className="fx-row ai-ct">
              <SafeImage alt="walleticon" src={userInfo?.avatar || WalletAvatarImg} height={34} width={34} className="rounded-[100px]" />
              <Box className="fx-col ml-[8px]">
                <Text fontSize="15px" fontWeight={400} color="#E0E0E0">{userInfo?.username || ''}</Text>
                <Text fontSize="12px" fontWeight={300} color="#E0E0E0">{formatAddress(address)}</Text>
              </Box>
            </Box>
            <Box>
              <Image alt="up" src={ArrowupImg} className="w-[16px] h-[16px]" />
              <Image alt="down" src={ArrowdownImg} className="w-[16px] h-[16px]" />
            </Box>
          </Box>
      
        </Box>
      ) : null}
    </Box>
  );
}



const ConversationItem = ({ item, isActive, onClick }) => {
  const dispatch = useAppDispatch()
  
  const [hover, setHover] = useState(false)

  const conversationsList = useAppSelector(selectConversationsList)

  const handleDelete = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const res = await deleteConversationApi(item.id);  
    if (res && res.conversationId === item.id) {
      const updated = conversationsList.filter(conv => conv.id !== item.id);
      dispatch(conversationsListAction(updated));
    }
  };
  const conversationId = item.id
  const agentId = item.agentId
  const taskId = 1
  return (
    <Box
      className="relative group "
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <MenuItem
        isActive={isActive}
        name={item.title}
      
        url={item.type === 'agent' ? `/agent/${conversationId}/${agentId}/${taskId}` : `/task/${conversationId}/${taskId}`}
    
        onCloseDrawer={onClick}
        icon={item.type === 'agent' ? AgentTaskImg : McpTaskImg}        
      />
      {hover && ( 
        <IconButton
          icon={<DeleteIcon color='#E0E0E0'/>}
          size="sm"
          colorScheme="#fff"
          aria-label="Delete conversation"
          position="absolute"
          right="0px"
          top="50%"
          transform="translateY(-50%)"
          onClick={handleDelete}
        />
      )}
    </Box>
  );
};

const MenuItem = ({
  icon,
  name,
  url,
  
  onCloseDrawer,
  isActive,
  more = false,
  isMore = false,
  handleArrow
}) => {
  const isSidebarExpand = useAppSelector(selectSidebarExpand)
  const isMobile = useBreakpointValue({ base: true, md: false })

  const { openConnectModal } = useConnectModal()
  const { isConnected } = useAccount()

  const handleClick = (e) => {
    if (url && !isConnected) {
      e.preventDefault()            
      openConnectModal?.()         
    } else {
      onCloseDrawer?.()          
    }
  }

  const onArrow = (e) => {
    e.preventDefault()   
    e.stopPropagation()
    handleArrow()
  }
  const clickableProps = url
    ? {
        as: Link,
        href: url,
        onClick: handleClick,
      }
    : {}

  const sharedContent = (
    <Box
      _hover={{ bg: '#1F1F22' }}
      className="mt-[14px] pl-[8px] h-[38px] cursor-pointer fx-row ai-ct jc-sb w-[191px] rounded-[8px]"
      {...clickableProps}

      bgColor={isActive ? '#1F1F22' : 'transparent'}

    >
      <Box className='fx-row ai-ct'>
        {icon && <Image alt="icon" src={icon} className="w-[16px] h-[16px]" />}
        <Text color="#E0E0E0" fontSize="14px" ml="8px" className="line1" maxW={ '150px' }  >{name}</Text>
        {
          name === 'Tasks' && <Image alt="beta" src={BETAImg} className="w-[30px] h-[18px] ml-[8px] mt-[2px]" /> 
        }
      </Box>
      {
        more ? 
        <Image 
          style={{
              transform: isMore ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out'
          }}
          alt="more" 
          src={ArrowdownImg} 
          className="w-[18px] h-[18px] mr-[8px]" 
          onClick={onArrow}/> 
          : <div/>
      }
    </Box>
  )

  const iconOnlyContent = (
    <Box
      my="14px"
      w="36px"
      h="34px"
      _hover={{ bg: '#232328' }}
      className="rounded-[8px] cursor-pointer center"
      bgColor={isActive ? '#232328' : 'transparent'}
      {...clickableProps}
    >
      {icon && <Image alt="icon" src={icon} className="w-[18px] h-[16px]" />}
            

    </Box>
  )

  const content = isMobile || isSidebarExpand ? sharedContent : iconOnlyContent

  return content

}

