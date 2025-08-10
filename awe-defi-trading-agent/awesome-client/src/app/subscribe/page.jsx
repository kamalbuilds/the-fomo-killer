'use client'
import React, { useEffect, useState } from 'react'
import { Box, Text, VStack, Input } from '@chakra-ui/react'
import { MainPage, showToast, SuccessModal, PaymentDetails } from '@/components/'
import Image from 'next/image'
import { ButtonWrap } from '@/components/Button'
import { capitalizeFirstLetter, openLink, sleep, truncateToDecimals } from '@/utils'
import { getMembershipStatusApi, getPaymentsApi, getPaymentStatusApi, getPricingApi } from '@/api/payApi'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { membershipStatusAction, selectMembershipStatus, selectUserInfo } from '@/redux/reducer'
import { useRouter } from 'next/navigation'
import { LoadingImg, ShareImg } from '@/assets/images'


import AWE_ABI from '@/config/AWE_ABI.json'
import { config } from '@/components/RainbowKitWrapper'
import { BUY_AWE_URL } from '@/config'
import { BigNumber, ethers } from 'ethers'
import { useAccount } from 'wagmi'


export default function SubscribePage() {

    const [subscribeOpen, setSubscribeOpen] = useState({
        isOpen: false,
        content: ''
    })
    const [billingCycle, setBillingCycle ] = useState('monthly')
    const isMonth = billingCycle === 'monthly' 
    const membershipStatus = useAppSelector(selectMembershipStatus)
    const router = useRouter()
    const [loading, setLoading] = useState(false)
  
    const [currentType, setCurrentType] = useState('free-monthly')
    const [confirmedList, setConfirmedList] = useState([])
    const dispatch = useAppDispatch()
    
    const [isPaymentOpen, setPaymentOpen] = useState(false)

    const [price, setPrice] = useState([])
    const [aweInfo, setAweInfo] = useState({
        aweUsdPrice: 0,
        tokenAddress: '',
        receiverAddress: ''
    })
    
    const _currentType = currentType.split('-') // free-monthly
    const membershipType = _currentType[0]
    const subscriptionType = _currentType[1]
    const { address, isConnected } = useAccount()
    const userInfo = useAppSelector(selectUserInfo)
    useEffect(() => {
        const { membershipType, subscriptionType, isActive } = membershipStatus
        if(isActive) {
            setCurrentType(`${membershipType}-${subscriptionType}`)
        }
    },[membershipStatus])

 

    useEffect(() => {
        if(userInfo && userInfo.id) {
            getPaymentInfo()
        }
    }, [userInfo])


    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    const getWeiPrice = (wei) => {
        return Number(ethers.utils.formatUnits(wei, 18))
    }

    const getPaymentInfo = async () => {
        

        
        const usdtPrice = await getPricingApi()
        
        if(usdtPrice) {
            const { usdtAmountForPlusMonthlyByAwe,
            usdtAmountForPlusYearlyByAwe,
            usdtAmountForProMonthlyByAwe,
            usdtAmountForProYearlyByAwe, 
            plus,
            pro,
            aweAmountForPlusMonthlyInWei,
            aweAmountForPlusYearlyInWei,
            aweAmountForProMonthlyInWei,
            aweAmountForProYearlyInWei
            } = usdtPrice
            const priceData = [
            {
                name: 'free',
                monthly: {
                    usdtPrice: 0,
                    awePrice: 0,
                    aweAmount: 0,
                },
                yearly: {
                    usdtPrice: 0,
                    awePrice: 0,
                    aweAmount: 0,
                },
                features: [
                    'Access to all integrated MCP servers',
                    'Access to all agent marketplace',
                    'Up to 3 tasks as free trial',
                ],
            },
            {
                name: 'plus',
                monthly: {
                    usdtPrice: Number(plus.monthly.amount),
                    aweAmount: getWeiPrice(aweAmountForPlusMonthlyInWei),
                    awePrice: usdtAmountForPlusMonthlyByAwe, 
                    
                },
                yearly: {
                    usdtPrice: Number(plus.yearly.amount),
                    aweAmount: getWeiPrice(aweAmountForPlusYearlyInWei) ,
                    awePrice: usdtAmountForPlusYearlyByAwe,
                },
                features: [
                    'Access to all integrated MCP servers',
                    'Access to all agent marketplace',
                    'Up to 10 tasks per day',
                    'Publish agent marketplace',
                ],
            },
            {
                name: 'pro',
                monthly: {
                    usdtPrice: Number(pro.monthly.amount),
                    aweAmount:getWeiPrice(aweAmountForProMonthlyInWei),
                    awePrice: usdtAmountForProMonthlyByAwe,
                },
                yearly: {
                    usdtPrice: Number(pro.yearly.amount),
                    aweAmount: getWeiPrice(aweAmountForProYearlyInWei),
                    awePrice: usdtAmountForProYearlyByAwe,
                },
                features: [
                    'Access to all integrated MCP servers',
                    'Access to all agent marketplace',
                    'Unlimited tasks per day',
                    'Publish agent marketplace',
                ],
            },
            ]
    
            setPrice(priceData)
        }



        const raw = localStorage.getItem('waitingPaymentInfo')
        const waitingPaymentInfo = JSON.parse(raw)
        
        if (waitingPaymentInfo) {
            const {
            paymentId,
            membershipType,
            subscriptionType,
            amount,
            currency
            } = waitingPaymentInfo
            if(paymentId) {
                const statusRes = await getPaymentStatusApi(paymentId)
                
                // ✅ 避免重复 toast 的关键逻辑
                const toastShownKey = `toast_shown_${paymentId}`
                const hasShownToast = localStorage.getItem(toastShownKey)
    
                if (statusRes && statusRes.status === 'confirmed' && !hasShownToast) {
                    showToast('success', 'Payment successful')
                    localStorage.setItem(toastShownKey, 'true')  // ✅ 标记为已提示
                    localStorage.removeItem('waitingPaymentInfo')
                }
            }
        }

        const history = await getPaymentsApi()
        if (history && history.length > 0) {
            setConfirmedList(filterConfirmed(history))
        }

        const membership = await getMembershipStatusApi()
        if (membership) {
            dispatch(membershipStatusAction(membership))
        }
    }

    
    const filterConfirmed = (list) => {
        return list
            .filter(item => item.status === 'confirmed')
            .map(({ id, membershipType, subscriptionType }) => ({
                id,
                membershipType,
                subscriptionType
            }))
    }



    const onUpgrade = async(type, _isLoading) => {   

        if(type === 'free') {
            router.push('/')
        }else {
            setCurrentType(`${type}-${billingCycle}`)
            setPaymentOpen(true)
        }
    
    }

    const awePaySuccess = () => {
        
        setSubscribeOpen({
            isOpen: true,
            content: `Your purchase of the ${capitalizeFirstLetter(membershipType)} version has been successfully paid.`,
        })
    }
    return (
        <MainPage>
            <Box className="w-full max-w-965px] mx-auto h-full" overflowY="scroll" pb='24px'>
                <Text 
                    
                    className="fm2 mt-[48px]  text-center text-[32px] font-bold leading-[120%]"
                    style={{
                        background: 'linear-gradient(90deg, #393749 28.55%, #ADADAD 48.89%, #393749 69.22%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                SUBSCRIBE TO AWESOME
                </Text>
                {/* tab切换 */}
                <Box className="flex justify-center mt-[40px] ">
                    <Box className="flex bg-[#111111]  rounded-lg" fontWeight={600}>
                        <ButtonWrap>
                            <Box
                            
                                className={` ${
                                    isMonth ? 'bg-[#E0E0E0] text-[#1F1F22]'  : 'text-[#E0E0E0]'
                                }`}
                                onClick={() => {
                                    setBillingCycle('monthly')
                                    dispatch(membershipStatusAction({
                                        isActive: membershipStatus.isActive,
                                        membershipType: membershipStatus.membershipType,
                                        subscriptionType: 'monthly',
                                        expiresAt: membershipStatus.expiresAt
                                    }))
                                }}
                                padding='10px 24px'
                                whiteSpace='nowrap'
                                fontSize='14px'
                                style={{
                                    display: 'flex',
                                    
                                    alignItems: 'center',
                                    alignSelf: 'stretch',
                                    borderRadius: '8px',
                                }}
                            >
                            Monthly Billing
                            </Box>
                        </ButtonWrap>
                        <ButtonWrap>
                            <Box
                                className={`${
                                    !isMonth 
                                    ? 'bg-[#E0E0E0] text-[#1F1F22]'
                                    : 'text-[#E0E0E0]'
                                }`}
                                onClick={() => {
                                    setBillingCycle('yearly')
                                     dispatch(membershipStatusAction({
                                        isActive: membershipStatus.isActive,
                                        membershipType: membershipStatus.membershipType,
                                        subscriptionType: 'yearly',
                                        expiresAt: membershipStatus.expiresAt
                                    }))
                                }}
                                padding='10px 24px'
                                fontSize='14px'
                                whiteSpace='nowrap'
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                
                                    borderRadius: '8px',
                                }}
                            >
                            Yearly Billing
                            </Box>
                        </ButtonWrap>
                    </Box>
                </Box>
                <Box h='14px' mt='14px' className='center' >
                    { !isMonth && <Text className='text-[#FF8C00] text-[12px]'>Switch to Yearly to save 17%</Text>}
                </Box>
                                
                <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-[984px] mx-auto mt-[40px] justify-items-center md:justify-items-stretch">
                    {price.map((plan) => {
                        
                        const isActiveCard = currentType === `${plan.name}-${billingCycle}`
                        const isLoading = loading && isActiveCard
                        const isFree = plan.name === 'free'
                        
                        return (
                            
                            <Box
                                className={`rounded-[12px] p-[20px] w-full max-w-[309px] bg-[#010101] border border-[#293033]`}
                                _hover={{
                                    border:"1px solid transparent",
                                    borderRadius:"12px",
                                    background:"linear-gradient(#010101, #010101) padding-box, linear-gradient(to bottom, #B8B8B8, #FFC57F) border-box",
                                    backgroundClip:"padding-box, border-box",
                                }}
                               
                                key={plan.name}
                            >
                                <Box className='h-[225px]'>                                    
                                    <Text className="text-[16px] font-bold text-[#E0E0E0] mb-[24px]">{plan.name.toLocaleUpperCase()}</Text>
                                    <Box className="">
                                        <Text className="fx-row ai-ct text-[24px] font-bold text-[#E0E0E0]">
                                            ${isMonth ? plan.monthly.usdtPrice : plan.yearly.usdtPrice}
                                            <Text mt='6px' color='rgba(224, 224, 224, 0.60)' fontSize='12px' fontWeight={400}> &nbsp;/&nbsp;{isMonth ? 'month' : 'year'}</Text>
                                        </Text>
                                        {!isFree && <Text color='rgba(224, 224, 224, 0.60)' fontSize='12px' fontWeight={400}>Paid in $USDT / $USDC</Text>}
                                        {!isFree && <Text mt='6px' color='rgba(224, 224, 224, 0.60)' fontSize='12px' fontWeight={400}>OR</Text>}
                                        {
                                            !isFree&& 
                                            <Text className="mt-[6px] fx-row ai-ct text-[24px] font-bold text-[#E0E0E0]">
                                                ${isMonth ? plan.monthly.awePrice : plan.yearly.awePrice}
                                                <Text mt='6px' color='rgba(224, 224, 224, 0.60)' fontSize='12px' fontWeight={400}> &nbsp;/&nbsp;{isMonth ? 'month' : 'year'}</Text>
                                            </Text>
                                        }
                                        {!isFree && <Text color='rgba(224, 224, 224, 0.60)' fontSize='12px' fontWeight={400}>Paid in $AWE (20% discount)</Text>}
                                        
                                    </Box>
                                </Box>


                                {/*  会员按钮 */}
                                <ButtonWrap>
                                    <Box 
                                        cursor={isLoading ? 'no-drop' : ''}
                                        bgColor={isFree ? '#1F1F22' : (isActiveCard ? '#1F1F22' : '#E0E0E0')}
                                        className='fx-row ai-ct jc-ct'
                                        px='32px'
                                        py='8px'
                                        gap='6px'
                                        borderRadius='8px'
                                        onClick={() => isLoading ? () => null : onUpgrade(plan.name, isLoading)}                            
                                    >   
                                    
                                        { isLoading && <Image  className="rotation_animation" src={LoadingImg} height={24} width={24} alt='loading'/> }
                                        
                                        <Text color={isFree ? '#E0E0E0' : (isActiveCard ? '#E0E0E0' : '#1F1F22')} fontSize='14px' fontWeight={500}>
                                            { 
                                                isFree ? 'Explore' : (isActiveCard ? 'Explore' : 'UPGRADE')
                                            }
                                        </Text>
                                    </Box>
                                </ButtonWrap>
                                {
                                    isFree ? <Box mt='12px' className='' h='17px'/> : (

                                    <Box mt='12px' className='fx-row ai-ct center h-[17px] cursor-pointer'>
                                        <Text 
                                            className=' text-[14px] underline'
                                            fontWeight={400} 
                                            color='#E0E0E0' 
                                            onClick={() => openLink(BUY_AWE_URL)} 
                                            mr='8px'
                                        >Buy $AWE on Base</Text>
                                        <Image src={ShareImg} height={14} width={14} alt='buy' />
                                    </Box>
                                    )
                                }

                                <VStack align="stretch" mt="48px" className=''>
                                    {plan.features.map((feature) => (
                                        <Box key={feature} className="flex items-center" >
                                            <Box className="w-[2px] h-[2px] bg-[#878787] mr-[12px]" />
                                            <Text className="text-[#878787] " fontSize='12px' fontWeight={350}>{feature}</Text>
                                        </Box>
                                    ))}
                                </VStack>                                
                            </Box>
                        )
                    })}
                </Box>
                <SuccessModal
                    isOpen={subscribeOpen.isOpen} 
                    onClose={() => setSubscribeOpen({ isOpen: false, content: ''})} 
                    title='🎉 Congratulations!' 
                    content={subscribeOpen.content}
                />

                <PaymentDetails
                    aweInfo={aweInfo}
                    price={price}
                    isOpen={isPaymentOpen}
                    onCancel={() => setPaymentOpen(false) }
                    currentType={currentType}
                    awePaySuccess={awePaySuccess}
                />
            </Box>
        </MainPage>
    )
}



