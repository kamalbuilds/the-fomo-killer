
'use client'
import React from 'react'
import { Box, useBreakpointValue } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Footer } from '@/components'
import { NAV_HEIGHT } from '@/config'



// | 名称 (`key`) | 宽度下限 (`min-width`) | 典型设备             |
// | ---------- | ------------------ | ---------------- |
// | `base`     | 0px（默认）            | 所有设备（最小起点）       |
// | `sm`       | 30em = **480px**   | 小屏手机、老iPhone 等   |
// | `md`       | 48em = **768px**   | 平板竖屏、iPad mini 等 |
// | `lg`       | 62em = **992px**   | 平板横屏、小笔记本        |
// | `xl`       | 80em = **1280px**  | 桌面显示器、高清屏        |
// | `2xl`      | 96em = **1536px**  | 大屏 2K+ 显示器       |


export const Screen2 = ({ start6, start6Complete}) => {
    
    const isMobile = useBreakpointValue({ base: true, md: false })
    const TOP = useBreakpointValue({
        base: '-14vw',
        sm: '-24vw',
        md: '-17vw',
        lg: '-14vw',
        xl: '-9vw',
        '2xl': '-9vw',
    })
  
    const BLUR = useBreakpointValue({
        base: '16vw',
        sm: '8vw',
        md: '8vw',
        lg: '8vw',
        xl: '5vw',
        '2xl': '5vw',
    })   

    const WIDTH = useBreakpointValue({
        base: 30,
        sm: 26,
        md: 24,
        lg: 26,
        xl: 24,
        '2xl': 26,
    })


    const PT2 = useBreakpointValue({
            base: '2vw',
            sm: '2vw',
            md: '2vw',
            lg: '6vw',
            xl: '6vw',
            '2xl': '8vw',
        })
   

    const BORDER = useBreakpointValue({
        base: '1px solid #fff',
        sm: '1px solid yellow',
        md: '1px solid red',
        lg: '1px solid blue',
        xl: '1px solid green',
        '2xl': '1px solid #fff',
    })

    return (
        <Box className='h-full w-full' pos='relative' pt={PT2}  overflowY={isMobile ? 'hidden' : 'auto'}>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={start6 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                onAnimationComplete={() => {
                    start6Complete(true)
                }} 
                
                // style={{ width: '100%', height: '100%' }}
            >
            
                <Box
                    maxW="1200px" mx="auto" w="full"
                    className='h-full '
                    px={[0,'12px', '24px', '24px', '44px']}
                    // pt={PT}          

                >
                    <Box
                        position="relative"
                        width="100%"                           
                        height={`calc(100vh - ${PT2} - ${PT2} )`}                   
                        className=''
                        borderRadius={['12px 12px 0px 0px','32px 32px 0px 0px','32px 32px 0px 0px','32px 32px 0px 0px',]}
                    >
                        {/* 渐变边框 */}
                        <Box
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            bottom={0}
                            bgGradient="linear(to-b, #A2BDFF, #151823)"
                            zIndex={0}
                            borderRadius={['12px 12px 0px 0px','32px 32px 0px 0px','32px 32px 0px 0px','32px 32px 0px 0px',]}

                            p="2px" // 控制边框粗细
                        >
                            {/* 实际内容区域 */}
                            <Box
                                bg="rgb(1,1,1)"
                                height="100%"
                                borderRadius={['12px 12px 0px 0px','32px 32px 0px 0px','32px 32px 0px 0px','32px 32px 0px 0px',]}
                                zIndex={1}
                                p={['12px','24px','34px','34px']}
                            >
                                

                                <video
                                    src="/landingpage.mp4"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    style={{
                                        borderRadius: isMobile ? '12px 12px 0px 0px'  : '32px 32px 0px 0px' ,
                                        width: '100%',
                                        height: isMobile ? '67%' : '77%',
                                        objectFit: isMobile ? 'cover' : 'contain',
                                    }}
                                />

                                <Box
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, #010101 100%)',
                                    }}
                                />

                                {/* Pseudo-element .card:after converted to a Box */}
                                <Box
                                    style={{
                                        position: 'absolute',
                                        content: '',
                                        zIndex: -1,
                                        top: TOP,
                                        filter: `blur(${BLUR})`,
                                        height: '110%',
                                        left: `-${WIDTH/2}%`,
                                        width: `${WIDTH + 100}%`,
                                        margin: '0 auto',
                                        transform: 'scale(0.75)',
                                        background: 'linear-gradient(270deg, #0fffc1, #7e0fff)',
                                        backgroundSize: '200% 200%',
                                        animation: 'animateGlow 10s ease infinite',
                                    }}
                                />

                                {/* 输入框 */}
                            

                            </Box>



                        </Box>
                    </Box>
            
                {/* Animations retained in a style tag */}
                <style jsx>{`
                    @keyframes animateGlow {
                        0% {
                            background-position: 0% 50%;
                        }
                        50% {
                            background-position: 100% 50%;
                        }
                        100% {
                            background-position: 0% 50%;
                        }
                    }
                    @keyframes card_animation {
                        0% {
                            color: #7e0fff;
                        }
                        50% {
                            color: #0fffc1;
                        }
                        100% {
                            color: #7e0fff;
                    }
                    }
                `}</style>
                </Box>
            </motion.div>


            <Box 
                pos='absolute' 
                left={0} 
                bottom={isMobile ? '0.5%' : '2%'} 
                w='100%'>
                <Footer />
            </Box>
        </Box>
      
    );
};
