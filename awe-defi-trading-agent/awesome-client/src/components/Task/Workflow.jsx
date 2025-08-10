
'use client'
import React, { useEffect, useRef, useState, useMemo, useImperativeHandle} from 'react'
import { Box, Text, VStack, useBreakpointValue} from '@chakra-ui/react'
import { MCPItem, OtherMCPOptions, showToast, ToolsCard, AppButton, PasswordInput, AuthSavedMask } from '@/components/'
import { 
NoticeImg,
Checkbox1Img,
Checkbox2Img,
TriangleImg
} from '@/assets/images'
import Image from 'next/image'
import { verifyMcpAuthApi, verifyAgentAuthApi } from '@/api'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { confirmWorkflowAction, reanalysisStatusAction, selectReanalysisStatus, reanalysiMCPInfoAction, selectConfirmWorkflow, selectUsedMcps, sendLoadingAction } from '@/redux/reducer'
import { ExpandCard, } from './ExpandCard'

export const Workflow = ({ taskId, type, agentId, ref, mcpSwitchChange}) => {
    const [activeLLM, setActiveLLM] = useState('gpt') 
    const [openItemName, setOpenItemName] = useState(null)
    const [mcpOptionsMap, setMcpOptionsMap] = useState({})
    const [selectedMcpMap, setSelectedMcpMap] = useState({}) 
    const dispatch = useAppDispatch()
    const [authInputsMap, setAuthInputsMap] = useState({}) 
    const [isCheckedMap, setIsCheckedMap] = useState({})   
    const [isVeriryMap, setIsVeriryMap] = useState({})
    const [isWarningMap, setWarningMap] = useState({})   
    const [authLoadingMap, setAuthLoadingMap] = useState({})  
    const [showPasswordMap, setShowPasswordMap] = useState({})

    const [openAuthMap, setOpenAuthMap] = useState({})
    const [openToolsMap, setOpenToolsMap] = useState({})
    const [maskVisibleMap, setMaskVisibleMap] = useState({})
    
    const confirmWorkflow = useAppSelector(selectConfirmWorkflow)
    const [hasSwitchedMcp, setHasSwitchedMcp] = useState(false)
    const [reanalysisMap, setReanalysisMap] = useState({})
    const reanalysisStatus = useAppSelector(selectReanalysisStatus)  
    const isMobile = useBreakpointValue({ base: true, md: false })


    const isVeriryMapRef = useRef(isVeriryMap);

    useEffect(() => {
        isVeriryMapRef.current = isVeriryMap;
    }, [isVeriryMap]);


    const mcpUsed = useAppSelector(selectUsedMcps)
    
    // const mcpUsed = [
    //     {
    //         authRequired: true,
    //         authVerified: true,
    //         category: "Market Data",
    //         description: "CoinGecko official MCP server for cryptocurrency market data, historical prices, and OHLC candlestick data (LOCAL BUILD)",
    //         githubUrl: "https://docs.coingecko.com/reference/mcp-server",
    //         imageUrl: "https://mcp-server-tool-logo.s3.ap-northeast-1.amazonaws.com/coingecko.ico",
    //         name: "coingecko-mcp",
    //         authParams: {
    //             COINGECKO_API_KEY: "COINGECKO_API_KEY"
    //         },
    //         alternatives: [
    //             {
    //                 authParams: {
    //                     COINMARKETCAP_API_KEY1: "COINMARKETCAP_API_KEY1",
    //                     COINMARKETCAP_API_KEY2: "COINMARKETCAP_API_KEY2"
    //                 },
    //                 authRequired: true,
    //                 authVerified: false,
    //                 category: "Market Data",
    //                 description: "CoinMarketCap cryptocurrency market data and analytics",
    //                 githubUrl: "https://github.com/shinzo-labs/coinmarketcap-mcp",
    //                 imageUrl: "https://mcp-server-tool-logo.s3.ap-northeast-1.amazonaws.com/coinmarket.png",
    //                 name: "coinmarketcap-mcp",
    //             }
    //         ]
    //     },
    //     {
    //         authRequired: true,
    //         authVerified: false,
    //         category: "xxxx",
    //         description: "CoinGecko official MCP server for cryptocurrency market data, historical prices, and OHLC candlestick data (LOCAL BUILD)",
    //         githubUrl: "https://docs.coingecko.com/reference/mcp-server",
    //         imageUrl: "https://mcp-server-tool-logo.s3.ap-northeast-1.amazonaws.com/coingecko.ico",
    //         name: "22222",
    //         authParams: {
    //             COINGECKO_API_KEY: "COINGECKO_API_KEY"
    //         },
    //         alternatives: [
    //             {
    //                 authParams: {
    //                     COINMARKETCAP_API_KEY1: "COINMARKETCAP_API_KEY1",
    //                     COINMARKETCAP_API_KEY2: "COINMARKETCAP_API_KEY2"
    //                 },
    //                 authRequired: true,
    //                 authVerified: false,
    //                 category: "Market Data",
    //                 description: "CoinMarketCap cryptocurrency market data and analytics",
    //                 githubUrl: "https://github.com/shinzo-labs/coinmarketcap-mcp",
    //                 imageUrl: "https://mcp-server-tool-logo.s3.ap-northeast-1.amazonaws.com/coinmarket.png",
    //                 name: "2222",
    //             }
    //         ]
    //     }
    // ]

    const memoizedMcpUsed = useMemo(() => mcpUsed, [JSON.stringify(mcpUsed)])


    // console.log('mcpUsed', mcpUsed)
    // console.log('maskVisibleMap', maskVisibleMap)

    useEffect(() => {
        if (mcpUsed && mcpUsed.length) {
            const initVerifyMap = {}
            const newOptionsMap = {}
            const newSelectedMap = {}
            const defaultCheckedMap = {}  

            const _maskVisibleMap = {}

            mcpUsed.forEach(item => {
                initVerifyMap[item.name] = false
                defaultCheckedMap[item.name] = true
                const options = [item, ...(item.alternatives || [])]
                newOptionsMap[item.name] = options
                newSelectedMap[item.name] = item

                openAuthMap[item.name] = true
                openToolsMap[item.name] = true


                _maskVisibleMap[item.name] = (item.authRequired && item.authVerified)
               
            })

            setMcpOptionsMap(newOptionsMap)
            setSelectedMcpMap(newSelectedMap)
            setIsVeriryMap(initVerifyMap)
            setWarningMap(initVerifyMap)
            setIsCheckedMap(defaultCheckedMap)
            setMaskVisibleMap(_maskVisibleMap)
        }
    }, [memoizedMcpUsed])



     
    const togglePasswordVisibility = (mcpName, fieldName) => {
        setShowPasswordMap(prev => ({
            ...prev,
            [mcpName]: {
                ...prev[mcpName],
                [fieldName]: !prev[mcpName]?.[fieldName] 
            }
        }));
    };

    
    const handleInputChange = (mcpName, key, value) => {
        setAuthInputsMap(prev => ({
            ...prev,
            [mcpName]: {
            ...prev[mcpName],
            [key]: value
            }
        }))
    }

    // Save for later use 切换
    const toggleSaveForLater = (mcpName) => {
        setIsCheckedMap(prev => ({
            ...prev,
            [mcpName]: !prev[mcpName]
        }))
    }

    // console.log('isVeriryMap', isVeriryMap)
    // console.log('mcpUsed', mcpUsed)
    // 点击 Verify Auth
    const onVerifyAuth = async (item) => {
        const { name: originalMcpName, authVerified, authRequired } = item
        const selected = selectedMcpMap[originalMcpName];
        const mcpName = selected?.name || originalMcpName; // 当前选中的 MCP 名称

        const authData = authInputsMap[originalMcpName] || {};
        const saveForLater = isCheckedMap[originalMcpName] || false;

   
      
        if(!authRequired) {
            if(type === 'agent') {
                showToast('warning', 'This MCP does not require verification')
            }
            return
        }
        // if(authVerified) {
        //     showToast('warning' ,'The MCP verification information has been saved')
        //     return
        // }


        // console.log('saveForLater', saveForLater)
       
        if (authLoadingMap[mcpName]) return;

        try {
            setAuthLoadingMap(prev => ({
                ...prev,
                [mcpName]: true
            }));

            let res
            if(type === 'task') {
                res = await verifyMcpAuthApi(taskId, {
                    mcpName,
                    authData,
                    saveForLater,
                });
            }
            if(type === 'agent') {
                res = await verifyAgentAuthApi({
                    mcpName,
                    authData,
                    saveAuth: true,
                });
            }
      

            setAuthLoadingMap(prev => ({
                ...prev,
                [mcpName]: false
            }));

            
            if (res) {
                if (res.error) {
                    showToast('error', res.error);
                    setWarningMap(prev => ({
                        ...prev,
                        [originalMcpName]: true
                    }));
                    setIsVeriryMap(prev => ({
                        ...prev,
                        [originalMcpName]: false
                    }));
                }
                if (res.verified) {
                    showToast('success', 'Auth saved');

                    setIsVeriryMap(prev => ({
                        ...prev,
                        [originalMcpName]: true
                    }));
                    setWarningMap(prev => ({
                        ...prev,
                        [originalMcpName]: false
                    }));

                    setMaskVisibleMap(prev => ({
                        ...prev,
                        [originalMcpName]: true
                    }))
                                                                        
                }
            }
        } catch (e) {
            setAuthLoadingMap(prev => ({
                ...prev,
                [mcpName]: false
            }));
            setWarningMap(prev => ({
                ...prev,
                [originalMcpName]: true
            }));
            setIsVeriryMap(prev => ({
                ...prev,
                [originalMcpName]: false
            }));
        }
    };




    useEffect(() => {
        if (reanalysisStatus === 'end') {
            setHasSwitchedMcp(false)
        }
    }, [reanalysisStatus])
 

    const onCheckVerify = async () => {
        if (confirmWorkflow.loading) return

        
        for(const item of mcpUsed) {
            await onVerifyAuth(item)            
        }

        const _isVeriryMap = isVeriryMapRef.current
            
        // console.log('_isVeriryMap', _isVeriryMap)
       
        
        const newWarningMap = {} 
        let allVerified = true

        mcpUsed.forEach((item) => {
            const { name, authRequired } = item

            // 只有需要验证的才检查验证状态
            if (authRequired) {
                const isVerified = _isVeriryMap[name] === true
                newWarningMap[name] = !isVerified
            if (!isVerified) allVerified = false
            } else {
                newWarningMap[name] = false // 不需要验证的，不显示 warning
            }
        })

   
        console.log("allVerified", allVerified)
        
        setWarningMap(newWarningMap)
        
        if (!allVerified) return     
        if(type === 'task') {
                if (hasSwitchedMcp) {
                    dispatch(sendLoadingAction(true))
                    dispatch(reanalysisStatusAction('restart'))
                } else {
                    dispatch(confirmWorkflowAction({
                        run: true,
                        loading: true
                    }))
                }        
            }
    }

    useImperativeHandle(ref, () => ({
        onCheckVerify, 
    }))

    useEffect(() => {
        if (mcpSwitchChange) {
            mcpSwitchChange(hasSwitchedMcp);
        }
    }, [hasSwitchedMcp, mcpSwitchChange]);


    // console.log('mcpUsed', mcpUsed)
    // console.log('mcpOptionsMap', mcpOptionsMap)
    // console.log('setSelectedMcpMap', selectedMcpMap)

  

    return(
        <Box pos='relative' className=' h-full'  >
            <Box  className="flex-1  overflow-y-scroll h-full">
                {
                    mcpUsed && !!mcpUsed.length && mcpUsed.map((item, index) => {
                        const isCurrentOpen = openItemName === item.name
                        const isLatestIdx = index === mcpUsed.length - 1

                        return(
                            <Box  key={item.name} className='fx-row'>
                                {/* 序号 */}
                                {
                                    !isMobile && 
                                    <Box className='fx-col ai-ct' pr={['0px','20px','20px','20px','20px']}>
                                        <Text className='w-[18px] h-[18px] rounded-[100px] bg-[white] center ' color='#010101' fontSize='14px' fontWeight={400}>{index + 1}</Text>
                                        <Box className='bg-[#293033] w-[1px]' h={isLatestIdx ? '90%' : '100%'} my='10px'/>
                                    </Box>
                                }

                                <Box 
                                
                                    p={['4px','8px','16px','18px','20px']}
                                    className='rounded-[12px] mb-[24px] bg-[#111111]  w-full'
                                    border={ isWarningMap[item.name] ? '1px solid rgba(255, 140, 0, 0.50)' : '1px solid transparent'}
                                    >
                                        {
                                            type === 'task' && 
                                            <OtherMCPOptions
                                                openOptions={() => setOpenItemName(isCurrentOpen ? null : item.name)}
                                                onClose={() => setOpenItemName(null)}
                                                isOpen={isCurrentOpen}
                                                menu={(mcpOptionsMap[item.name] || []).map(opt => ({
                                                        name: opt.name,
                                                        description: opt.description,
                                                        authVerified: opt.authVerified,
                                                        authRequired: opt.authRequired
                                                        

                                                }))}
                                                onSelect={(mcpName) => {
                                                    const originalMcpName = item.name
                                                    const selected = (mcpOptionsMap[originalMcpName] || []).find(opt => opt.name === mcpName)

                                                    if (selected) {
                                                        // 设置选中项（展示用）
                                                        setSelectedMcpMap(prev => ({ ...prev, [originalMcpName]: selected }))

                                                        // ✅ 2. 重置验证状态与警告状态
                                                        setIsVeriryMap(prev => ({ ...prev, [originalMcpName]: false }))
                                                        setWarningMap(prev => ({ ...prev, [originalMcpName]: false }))

                                                        // 更新 map
                                                        const updatedMap = {
                                                            ...reanalysisMap,
                                                            [originalMcpName]: mcpName,
                                                        }

                                                        setReanalysisMap(updatedMap)

                                                        // 将 map 转成数组存入 store
                                                        const reanalysisArray = Object.entries(updatedMap).map(([key, value]) => ({
                                                            originalMcpName: key,
                                                            newMcpName: value,
                                                        }))
                                                        dispatch(reanalysiMCPInfoAction(reanalysisArray))
                                            
                                                        // 标记为已切换
                                                        setHasSwitchedMcp(true)
                                                    }
                                                    

                                                        setOpenItemName(null)
                                                    }}
                                            />
                                       
                                        }
                                     
                                        <MCPItem
                                            isWorkflow={true}
                                            authRequired={selectedMcpMap[item.name]?.authRequired}
                                            maxW="auto"
                                            {...selectedMcpMap[item.name]}
                                        /> 

                                        

                                        {/* 输入auth */}
                                        {
                                            selectedMcpMap[item.name]?.authParams && !!Object.keys(selectedMcpMap[item.name]?.authParams).length &&    
                                            <Box>
                                                <ExpandCard
                                                    title="Authentication"
                                                    isOpen={!!openAuthMap[item.name]}
                                                    onOpen={() => {
                                                        setOpenAuthMap(prev => ({
                                                        ...prev,
                                                        [item.name]: !prev[item.name],
                                                        }))
                                                    }}
                                                >
                                                    <Box pos='relative'>
                                                        <Box className='fx-col gap-[12px] mt-[12px] '>
                                                            {Object.entries(selectedMcpMap[item.name]?.authParams || {}).map(([key, value]) => {
                                                                const inputTitle = value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')                                                    
                                                            
                                                                return (
                                                                    <PasswordInput
                                                                        key={inputTitle}
                                                                        inputTitle={inputTitle}
                                                                        value={authInputsMap[item.name]?.[value] || ""}
                                                                        onChange={(e) => handleInputChange(item.name, value, e.target.value)}
                                                                        showPassword={showPasswordMap[item.name]?.[value]}
                                                                        togglePassword={() => togglePasswordVisibility(item.name, value)}
                                                                    />
                                                                )
                                                                
                                                            })}
                                                        </Box>
                                                    
                                                        {
                                                            maskVisibleMap[item.name] &&  
                                                            <Box pos='absolute' left={0} top={0} className='w-full h-full' zIndex={2}>
                                                                <AuthSavedMask 
                                                                    refill={() => {
                                                                        setMaskVisibleMap(prev => ({
                                                                            ...prev,
                                                                            [item.name]: !prev[item.name]
                                                                        }))
                                                                    }}/> 
                                                            </Box>
                                                        }
                                                    </Box>
                                                </ExpandCard>
                                                 {/* Save for later use  */}
                                                <VStack className='fx-col' mt='12px'>
                                                    <Box className='fx-row ai-ct  cursor-pointer'  onClick={() => toggleSaveForLater(item.name)}>
                                                        <Box h='14px' w='14px' className='center'>
                                                        <Image
                                                            src={isCheckedMap[item.name] ? Checkbox2Img : Checkbox1Img}
                                                            height={isCheckedMap[item.name] ? 14 : 12}
                                                            width={isCheckedMap[item.name] ? 14 : 12}
                                                            alt='checkbox'
                                                            className=''
                                                        />
                                                        </Box>
                                                        <Text className='ml-[4px]' fontSize='12px' fontWeight={400} color='#E0E0E0'>
                                                            Save for later use
                                                        </Text>
                                                    </Box>
                                                    {/* <AppButton
                                                        onClick={() => onVerifyAuth(item.name)}
                                                        loading={authLoadingMap[selectedMcpMap[item.name]?.name]}
                                                        title='Verify Auth'
                                                    />                                                 */}
                                                </VStack>
                                            </Box>
                                        }
                                        {
                                            item.predefinedTools && !!item.predefinedTools.length && 
                                            <ExpandCard
                                                title="Tools"
                                                isOpen={!!openToolsMap[item.name]}
                                                onOpen={() => {
                                                    setOpenToolsMap(prev => ({
                                                    ...prev,
                                                    [item.name]: !prev[item.name],
                                                    }))
                                                }}
                                            >
                                                <Box className='fx-col'>
                                                    {
                                                        item.predefinedTools.map(toolItem => (
                                                            <ToolsCard
                                                                key={toolItem.name}
                                                                toolName={toolItem.name}
                                                                toolDesc={toolItem.description}
                                                            />
                                                        ))
                                                    }
                                                </Box>
                                            </ExpandCard>
                                        }                                                                       

                                         

                                </Box>
                            </Box>
                        )
                    })
                }            
            </Box>

        </Box>
    )
}


