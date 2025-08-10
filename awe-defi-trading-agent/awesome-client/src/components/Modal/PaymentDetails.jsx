'use client'
import React, { useState } from 'react';
import { Box, Flex, Text, Button, Select, VStack, HStack,
    Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
    Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useMenu,
  useDisclosure
 } from '@chakra-ui/react';
import Image from 'next/image'
import { USDCTokenImg,USDTTokenImg, AWETokenImg, ShareImg, ArrowdownImg, LoadingImg, Loading2Img} from '@/assets/images'
import { capitalizeFirstLetter, openLink, truncateToDecimals, isBaseChain } from '@/utils';
import { ButtonWrap } from '..';
import { BUY_AWE_URL } from '@/config';
import { useAccount } from 'wagmi'
import { showToast } from '@/components'
import { parseUnits, TransactionReceiptNotFoundError } from 'viem'
import AWE_ABI from '@/config/AWE_ABI.json'
import { config } from '@/components/RainbowKitWrapper'
import { base } from 'wagmi/chains'
import { confirmAwePaymentApi, createPaymentApi, getAwePaymentStatusApi, calculateAwePriceApi } from '@/api/payApi'
import { writeContract, getTransactionReceipt, getBalance, switchChain } from '@wagmi/core'
import { useConnectModal } from '@rainbow-me/rainbowkit';


const TokenSelect = ({ selectedToken, onChange }) => {
    const current = paymentTokens.find((t) => t.value === selectedToken);
        const getTokenLogo = (token) => {
        const t = paymentTokens.find((item) => item.value === token);
        return t ? t.logo : null;
    };

    const getTokenName = (token) => {
        const t = paymentTokens.find((item) => item.value === token);
        return t ? t.name : '';
    };  

    

    const { isOpen, onOpen, onClose } = useDisclosure() 


    return(
        <Menu isOpen={isOpen} onOpen={onOpen} onClose={onClose} matchWidth>
            <MenuButton as={Button} w="100%" textAlign="left" bg="#1F1F22">
                <Box className="fx-row ai-ct jc-sb">
                <Box spacing="10px" className="fx-row ai-ct">
                    <Image src={getTokenLogo(selectedToken)} alt="logo" width={24} height={24} />
                    <Text color="#E0E0E0" ml="8px">{getTokenName(selectedToken)}</Text>
                </Box>

                <Image
                    src={ArrowdownImg}
                    alt="menu"
                    height={16}
                    width={16}
                    style={{
                    transition: 'transform 0.2s ease-in-out',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
                </Box>
            </MenuButton>

            <MenuList bg="#1F1F22" border="1px solid #353535" w="100%" minW="unset">
                {paymentTokens.map((token) => (
                    <MenuItem
                        key={token.value}
                        bg="#1F1F22"
                        _hover={{ bg: '#232328' }}
                        onClick={() => {
                            onChange(token.value)
                            onClose() 
                        }}
                    >
                        <HStack spacing="10px">
                            <Image src={token.logo} alt="logo" width={24} height={24} />
                            <Text color="#E0E0E0">{token.name}</Text>
                        </HStack>
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
)
};


const paymentTokens = [
  {
    name: 'USDT',
    value: 'usdt',
    logo: USDTTokenImg,
  },
  {
    name: 'USDC',
    value: 'usdc',
    logo: USDCTokenImg,
  },
  {
    name: 'AWE',
    value: 'awe',
    logo: AWETokenImg,
  },
];

export const PaymentDetails = ({ isOpen, onCancel, currentType, price, aweInfo, awePaySuccess }) => { 
    const [selectedToken, setSelectedToken] = useState('usdt');
    const [loading, setLoading] = useState(false)
    const { isConnected, address, chainId} = useAccount()
    const { openConnectModal } = useConnectModal()

    if(price.length === 0) {
        return
    }
    

    const _currentType = currentType.split('-') // free-monthly
    const membershipType = _currentType[0]
    const subscriptionType = _currentType[1]

    const currentPrice = price.find(item => item.name === membershipType)

    const isAWE = selectedToken === 'awe'

   
    async function waitForTxConfirmed(hash, maxRetries = 120) {
        let receipt = null
        let retries = 0

        while (!receipt && retries < maxRetries) {
            await new Promise((res) => setTimeout(res, 1500))
            retries++

            try {
                receipt = await getTransactionReceipt(config, { hash })
            } catch (err) {
                if (err instanceof TransactionReceiptNotFoundError) {
                    continue
                }
                throw err
            }
        }

            if (!receipt) {
                throw new Error('Transaction not confirmed within expected time.')
            }

            return receipt
        }



        
    const payByAWE = async() => {
        try {
            if (!address || !isConnected) {
                openConnectModal?.()
                return
            }

            setLoading(true)
            // 1. 检查当前链是否正确（Base）
            if(!!!isBaseChain(chainId)) {
                try {            
                    await switchChain(config, { chainId: base.id })
                    await sleep(500)
                    showToast('success', 'Switched to correct network')
                } catch (e) {
                    setLoading(false)
                    showToast('error', 'Failed to switch network to Base')
                    return
                }
            }    

             const awePriceRes = await calculateAwePriceApi({
                membershipType,
                subscriptionType
            })
            //  console.log('awePriceRes' ,awePriceRes)

            const { tokenAddress, receiverAddress, 
                    aweAmountForPlusMonthly,
                    aweAmountForPlusYearly,
                    aweAmountForProMonthly,
                    aweAmountForProYearly } = awePriceRes
            
        
            let aweAmount = 0
            if(currentType === 'plus-monthly') {
                aweAmount =  aweAmountForPlusMonthly
            }
            if(currentType === 'pro-monthly') {
                aweAmount = aweAmountForProMonthly
            }
            if(currentType === 'plus-yearly') {
                aweAmount = aweAmountForPlusYearly
            }
            if(currentType === 'pro-yearly') {
                aweAmount = aweAmountForProYearly
            }

            // console.log('aweAmount' ,aweAmount)

            // const aweAmount = subscriptionType === 'monthly' ? currentPrice.monthly.awePrice : currentPrice.yearly.awePrice
            const aweAmountInWei = parseUnits(`${aweAmount}`, 18) 
            
            // 2. 检查 AWE 余额是否足够
            const aweBalance = await getBalance(config, {
                address,
                token: tokenAddress,
            })
        
            if (BigInt(aweBalance.value) < BigInt(aweAmountInWei)) {
                setLoading(false)
                showToast('error', `Insufficient AWE balance: required ${aweAmount}`)
                return
            }
            
            // 3. 发起合约调用
            const hash = await writeContract(config, {
                address: tokenAddress,
                abi: AWE_ABI,
                functionName: 'transfer',
                args: [receiverAddress, aweAmountInWei],
                account: address,
            })
        
        
            const receipt = await waitForTxConfirmed(hash)
        
            if (receipt && receipt.status === 'success') {
                const b = await confirmAwePaymentApi({
                    membershipType: membershipType,
                    subscriptionType: subscriptionType,
                    transactionHash: hash,
                })
        
                if (b) {
                        if(b.error) {
                            setLoading(false)
                            showToast('error', b.error)
                        }else {
                            const c = await getAwePaymentStatusApi(b.paymentId)
                            setLoading(false)
                            if (c && c.status === 'confirmed') {
                                showToast('success', 'Transaction sent successfully')
                                onCancel()
                                awePaySuccess()
                            }
                        }
                }
            }
        } catch (err) {
                setLoading(false)
                console.error('Transfer error', err)
                showToast('error', err?.shortMessage || 'Transaction failed')
        }
    }
    const payByUSDT = async() => {
        setLoading(true)
        const a = await createPaymentApi({
            membershipType,
            subscriptionType
        })
        setLoading(false)
    
        if(a && a.error) {
            showToast('error', a.error)
        }else {
            const { paymentId,
                checkoutUrl,
                amount,
                currency,
                membershipType,
                subscriptionType,
                expiresAt} = a

            localStorage.setItem('waitingPaymentInfo', JSON.stringify({
                paymentId,
                membershipType,
                subscriptionType,
                amount,
                currency
            }))
            openLink(checkoutUrl)
        }
    }
    const onPay = async() => {
        isAWE ? payByAWE() : payByUSDT()    
    }

    
    const getCurrentPriceValue = () => {
        if (!currentPrice) return 0;
        if (subscriptionType === 'monthly') {
        return isAWE ? currentPrice.monthly.aweAmount : currentPrice.monthly.usdtPrice;
        } else {
        return isAWE ? currentPrice.yearly.aweAmount : currentPrice.yearly.usdtPrice;
        }
    };
    const getCurrentPriceValue1 = () => {
        if (!currentPrice) return 0;
        if (subscriptionType === 'monthly') {
        return isAWE ? currentPrice.monthly.awePrice : currentPrice.monthly.usdtPrice;
        } else {
        return isAWE ? currentPrice.yearly.awePrice : currentPrice.yearly.usdtPrice;
        }
    };

    
    return (
        <Modal isOpen={isOpen} onClose={onCancel} isCentered>
            <ModalOverlay />
            <ModalContent 
                bg="#010101" 
                border="1px solid #353535" 
                borderRadius="12px"
                maxW="645px"
                background="#010101"
                p='46px'
            >        
                <ModalBody >
                    <Box
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        gap="48px"
                        alignSelf="stretch"
                        borderRadius="12px"               
                        minW="400px"
                        maxW="100vw"
                    >
                    {/* Title */}
                    <Text
                        color="#E0E0E0"
                        fontSize="32px"
                        fontStyle="normal"
                        fontWeight="700"
                        lineHeight="120%"
                    >
                        Payment Details
                    </Text>

                    {/* Select Payment Method */}
                    <VStack align="stretch" w="100%" spacing="16px">
                        <Text color="#E0E0E0" fontSize="16px" fontWeight="600" mb="4px">
                        Select Payment Method
                        </Text>
                        <Box
                            border="1px solid #353535"
                            borderRadius="8px"
                            bg="#18181A"
                            px="16px"
                            py="10px"
                            w="100%"
                        >
                        
                        <TokenSelect
                            selectedToken={selectedToken}
                            onChange={(value) => setSelectedToken(value)}
                        />
                        </Box>
                    </VStack>

                    {/* Subscription & Amount */}
                    <VStack align="stretch" w="100%" >
                        <Flex justify="space-between" align="center">
                            <Text color="#E0E0E0" fontSize="18px" fontWeight="700">
                                &lt;{capitalizeFirstLetter(currentPrice.name)}&gt; Subscription
                            </Text>
                                <Text color="#E0E0E0" fontSize="18px" fontWeight="700">
                                ${getCurrentPriceValue1()}
                            </Text>
                        </Flex>

                        <Flex justify="space-between" align="center" mt='-8px' >
                            <Text color='#878787' fontWeight={400} fontSize='12px'>Billed {capitalizeFirstLetter(subscriptionType)}, starting today</Text>
                        </Flex>
                        <Flex justify="space-between" align="center" mt='12px'>
                            <Text color="#828B8D" fontSize="16px" fontWeight="500">
                                Amount Due Today
                            </Text>
                            <Text color="#E0E0E0" fontSize="16px" fontWeight="700">
                                $
                                {
                                    subscriptionType === 'monthly' ? (truncateToDecimals(getCurrentPriceValue1() / 30)) : truncateToDecimals(getCurrentPriceValue1() / 365)
                                }
                            </Text>
                        </Flex>
                        {/* 按年 */}
                        {
                            // subscriptionType === 'yearly' && 
                            // <VStack>
                            //     <Box className=' w100 fx-row ai-ct jc-sb' color='#FF8C00'>
                            //         <Text fontSize="16px" fontWeight="500">Yearly Discount</Text>
                            //         <Text fontSize="16px" fontWeight="700">-$123</Text>
                            //     </Box>
                            //     <Box className='fx-row ai-ct jc-sb w100' mt='-8px'>
                            //         <Text color='#878787' fontWeight={400} fontSize='12px'>Switch to Yearly to save 17%</Text>
                            //         <div/>
                            //     </Box>
                            // </VStack>
                        }

                        {
                            !isAWE && 
                            <Flex justify="space-between" align="center" color='#FF8C00' mt='12px'>
                                <Text fontSize="16px" fontWeight="500">
                                    Paid in $AWE (20% discount)
                                </Text>
                                <Text fontSize="16px" fontWeight="700">
                                    {`-$${truncateToDecimals(getCurrentPriceValue() * 0.2)}`}
                                </Text>
                            </Flex>
                        }
                        <Box w="100%" borderBottom="1px solid #353535" mt='8px' mb='40px'/>
                        <Flex justify="space-between" align="center">
                            <Text color="#E0E0E0" fontSize="16px" fontWeight="500">
                                Payment Method
                            </Text>
                            <HStack>
                                <Text color="#E0E0E0" fontSize="16px" fontWeight="700">
                                    {getCurrentPriceValue()}{selectedToken.toLocaleUpperCase()}
                                </Text>
                            </HStack>
                        </Flex>

                        <Flex justify="space-between" align="center">
                            <div/>
                            <Text color='#878787' fontWeight={400} fontSize='14px'>≈${
                            isAWE ? 
                            truncateToDecimals(getCurrentPriceValue1()) 
                            : getCurrentPriceValue()}</Text>
                        </Flex>
                    </VStack>
                    </Box>
                </ModalBody>
                
                <ModalFooter className='fx-col'>
                    <Flex w="100%" justify="space-between" mt="24px" gap="24px">
                        <ButtonWrap>
                            <Box
                                onClick={onCancel}
                                borderRadius="8px"
                                color="#E0E0E0"
                                bg="#1F1F22"
                                fontWeight="600"
                                fontSize="16px"
                                px='75px'
                                py='10px'
                                maxW='250px'
                                className='center'
                            >
                                Cancel
                            </Box>
                        </ButtonWrap>
                        <ButtonWrap>
                            <Box
                                onClick={() => loading ? () => null : onPay(selectedToken)}
                                borderRadius="8px"
                                color="#010101"
                                bg="#E0E0E0"
                                fontWeight="700"
                                fontSize="16px"
                                px='75px'
                                py='10px'
                                maxW='250px'
                                className='fx-row ai-ct'
                            
                            >
                            { loading ? 
                            <Box className=' center' w='70px'>
                                <Image className="rotation_animation" src={Loading2Img} height={24} width={24} alt='loading'/> 
                            </Box>
                            : 'Pay now'
                            }
                                
                            
                            </Box>
                        </ButtonWrap>
                    </Flex>
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

                </ModalFooter>
            </ModalContent>
        </Modal>

    );
};

export default PaymentDetails;
