'use client'
import React, { useEffect, useState } from 'react'
import { Box, useBreakpointValue } from '@chakra-ui/react'
import { Screen1, Screen2 } from '@/components'
import { NAV_HEIGHT } from '@/config'
import ReactFullpage from '@fullpage/react-fullpage'

export default function LandingPage() {
  const isMobile = useBreakpointValue({ base: true, md: false })
  const [start6, setStart6] = useState(false)
  const [start7, setStart7] = useState(false)
  const [pt, setPt] = useState(0)


  useEffect(() => {
    setTimeout(() => {
      setPt(NAV_HEIGHT)
    },500)
  },[])


  return (
    <Box      
      px={['4px', 0, 0, 0, '20px']}
      className='h-full'
    >
      <ReactFullpage
        credits={{ enabled: false }}
        scrollingSpeed={500}
        anchors={[]} 
        render={({ fullpageApi }) => {
          return (
            <div 
              id="fullpage-wrapper" 
              className='h-full'            
              >
              {/* 第一屏 */}
              <div className="section h-full" style={{display: 'flex', justifyContent: 'flex-start' }}>
                <Box px={['8px','20px','20px','20px']} className='h-full ' pt={NAV_HEIGHT}>
                  <Screen1 allAnimationComplete={a => setStart6(a)} />
                </Box>
              </div>

              {/* 第二屏 */}
              <div className="section h-full" >
                <Box px={['8px','20px','20px','20px']} className=' h-full' pt={NAV_HEIGHT } >
                  <Screen2 start6={start6} start6Complete={a => setStart7(a)} />
                </Box>
              </div>
            </div>
          )
        }}
      />
    </Box>
  )
}
