'use client'
import React, { useState } from 'react'
import { VStack, Text, Box, useBreakpointValue,  } from '@chakra-ui/react'
import { MainPage, Chat } from '@/components'


export default function TasksPage() {
  const isMobile = useBreakpointValue({ base: true, md: false })

  return (
    <MainPage>
      <Box className="w-full h-full" zIndex={8}>      
        <Box className="center">
          <VStack
            mt="170px"
            align="flex-start"
            fontWeight={400}
            fontSize={['20px', '20px', '32px', '40px']}
            letterSpacing="8%"
            className="w-full h-full  "
            maxW="810px"
          >
            <Text color="#fff"  className='fm2'>Hello!<br /></Text>

            <Text color="#828B8D"  className='fm2'>What can I do for you?</Text>
            {
              !isMobile ? 
              <Box mt='48px' w='100%' className=''>
                <Chat />
              </Box> : 
              <Box pos='absolute' bottom={`32px`} w='100%' left={0} className='' px='20px'>
                <Chat />
              </Box>
            }
            
          </VStack>
        </Box>
      </Box>
    </MainPage>
 
  )
}


