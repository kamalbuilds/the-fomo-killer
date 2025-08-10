'use client'
import { ChakraProvider } from "@chakra-ui/react"
import RainbowKitWrapper from './RainbowKitWrapper'
import { ToastContainer } from 'react-toastify'
import {
  Box,
} from '@chakra-ui/react'
import { Nav, Sidebar, LandingPageBg } from '@/components'
import { ReduxProvider } from '@/redux/ReduxProvider'
import theme from "../app/theme/index"
import { usePathname } from "next/navigation"

export default function ClientLayout({ children }) {
  const pathname = usePathname()
  
  return (
    <ReduxProvider>
      <RainbowKitWrapper>
        <ChakraProvider theme={theme}>
          <Box bg="#010101" h='100vh'>
            <Nav />         
            <Sidebar />
            {pathname === '/landing' && <LandingPageBg />}           
              {children}
          </Box>
        </ChakraProvider>
      </RainbowKitWrapper>
      <ToastContainer />
    </ReduxProvider>
  );
} 