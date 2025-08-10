'use client'

import React from 'react'
import Image from 'next/image'

import { openLink } from '@/utils'
import { AWEImg} from '@/assets/images/'
import { ButtonWrap } from '..'
import { useAccount } from 'wagmi'
import { usePathname } from 'next/navigation'
import { Box, Text, SimpleGrid, Link as ChakraLink, useBreakpointValue } from '@chakra-ui/react'


  

const links = [
  { title: 'Docs', url: 'https://docs.awenetwork.ai/' },
  { title: 'Litepaper', url: 'https://open.awenetwork.ai/litepaper.pdf' },
  { title: 'Github', url: 'https://github.com/STPDevteam/' },
  { title: 'Discord', url: 'https://discord.com/invite/srqXY7SnSc' },
  { title: 'Telegram', url: 'https://t.me/AWEofficial' },
  { title: 'X', url: 'https://x.com/awenetwork_ai' },
  { title: 'BLOG', url: 'https://www.awenetwork.ai/blog' },
  { title: 'PRIVACY', url: 'https://www.awenetwork.ai/privacy-policy' },
  { title: 'TERMS', url: 'https://www.awenetwork.ai/terms-of-service' },
]

export const Footer = () => {

  const isMobile = useBreakpointValue({ base: true, md: false })
  return (
    <Box
      className='fx-row ai-ct jc-sb '
      color='#E0E0E0'
      fontSize={['12px', '12px', '13px', '14px']}
      px={['24px','40px','40px','40px']}
      flexWrap='wrap'
      gap='32px'
    
    >
      <Box 
        className='fx-col jc-sb' 
        // display="flex" 
        // flexDirection={['row','column','column','column']} 
        // justifyContent={['space-between','space-between','space-between','space-between']}
        // alignItems={['center','flex-start','flex-start','flex-start']}
        w='286px' 
        h={['58px','88px','108px','108px']}>
        <Text>Autonomous Worlds Engine</Text>
        <Image src={AWEImg} height={isMobile ? 28 : 52} width={isMobile ? 55 : 102} alt="AWE" />
      </Box>

      <SimpleGrid
        columns={3}
        flex='1'
        minW='240px'
        className=''
        mt={['-24px',0,0,0]}
      >
        {links.map((item, idx) => (
          <ButtonWrap key={idx}>
            <Text 
              className='fm2 fx ai-ct' 
              h={['24px','36px','36px','36px']} 
              onClick={item.url ? () => openLink(item.url) : () => null}>
                {item.title.toLocaleUpperCase()}
            </Text>
          </ButtonWrap>
        ))}
      </SimpleGrid>
    </Box>
  )
}
