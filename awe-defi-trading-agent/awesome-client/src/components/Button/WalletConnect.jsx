'use client'
import { Box, Button } from '@chakra-ui/react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ButtonWrap } from '..'

export const WalletConnect = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <Box>
            {!connected ? (
              <ButtonWrap>
                <Box
                  onClick={openConnectModal}
                  p='8px 32px'
                  bg="#E0E0E0"
                  color="#010101"
                  fontSize='16px'
                  fontWeight={600}
                  borderRadius='8px'

                >
                  Connect
                </Box>

              </ButtonWrap>
            ) : (
              <Box
                  onClick={openAccountModal}
                  p='8px 32px'
                  bg="#E0E0E0"
                  color="#010101"
                  fontSize='16px'
                  fontWeight={600}
                  borderRadius='8px'

                >
                   {account.displayName}
                </Box>            
            )}
          </Box>
        )
      }}
    </ConnectButton.Custom>
  )
}
