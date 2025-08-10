'use client'
import React, { useState } from 'react'
import { Text, Box, useBreakpointValue,  } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Chat, TypingText, BlurText, WalletConnect, MagicCard} from '@/components'


export const Screen1 = ({ allAnimationComplete }) => {
  const [start2, setStart2] = useState(false)
  const [start3, setStart3] = useState(false)
  const [start4, setStart4] = useState(false)
  const [start5, setStart5] = useState(false)
  const [start6, setStart6] = useState(false)


  const isMobile = useBreakpointValue({ base: true, md: false })



  return (    
        <Box className="w-full h-full fx-col " zIndex={9}>
        
            {/* 动画1 */}
            {/* mt={['24px', '32px', '40px', '56px']} */}
            <Box className="" h="152px" ml={isMobile ? 0 : '78px'} mt='2%'>
                <TypingText
                lines={[
                    '～/AWE',
                    'install AWE',
                    '[1/2] Fetching packages...',
                    '[2/2] Building fresh packages...',
                    'Press any key to continue ...',
                ]}
                totalDuration={2000}
                onComplete={() => setStart2(true)}
                />
            </Box>

{/* mt={['32px', '56px', '96px', '96px']} */}
            <Box className="w-full fx-col ai-ct"  mt='4%'>
                <Box className="fx-col" maxW="1040px">
                    {/* 动画2 */}
                    <Box
                        
                        textAlign="center"
                        maxW="938px"
                        mx="auto"
                        fontSize={['32px', '32px', '40px', '56px']}
                        fontWeight={400}
                        lineHeight="120%"
                        letterSpacing="-1.68px"
                        style={{ visibility: start2 ? 'visible' : 'hidden' }}
                    >
                        {start2 && (
                        <BlurText
                            text="Autonomous World Engine Service via Open MCP Ecosystem"
                            delay={150}
                            animateBy="words"
                            direction="top"
                            onAnimationComplete={() => setStart3(true)}
                        />
                        )}
                    </Box>

                    <Box className="fx-col ai-ct" >
                        {/* 动画3 */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={start3 ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6 }}
                            style={{ visibility: start3 ? 'visible' : 'hidden' }}
                            onAnimationComplete={() => setStart4(true)}
                            >
                            <Text fontSize={['24px', '24px', '26px', '32px']} color="white" fontWeight={350} my="20px">
                                (AWESOME)
                            </Text>
                        </motion.div>

                        {/* 动画4 */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={start4 ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            style={{ visibility: start4 ? 'visible' : 'hidden' }}
                            onAnimationComplete={() => {
                                setStart5(true)
                                allAnimationComplete(true)
                            }} 
                        >
                            <WalletConnect/>

                        </motion.div>

                        {/* 动画5 */}

                        <Box pos='fixed' bottom='2%' left={0} w='100%' >
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={ start5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                transition={{ duration: 0.4 }}
                                style={{
                                
                                    width: '100%',  
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                    
                                onAnimationComplete={() => {
                                    setStart6(true)
                                }} 
                            >
                                <MagicCard width='100%' height="auto">
                                    <Chat />
                                </MagicCard>       
                            </motion.div>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
  )
}


