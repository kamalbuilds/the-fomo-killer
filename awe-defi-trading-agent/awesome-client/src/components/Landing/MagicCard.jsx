'use client'
import React, { useState } from 'react'
import { VStack, Text, Box, useBreakpointValue,  } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { MainPage, Chat, LandingPageBg, TypingText, BlurText, WalletConnect } from '@/components'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { keyframes, css, Global } from '@emotion/react'
import { NAV_HEIGHT } from '@/config'

export const MagicCard = ({
  children,
  height = '300px',
  width = '100%',
}) => {
  return (
    <>
      <Global
        styles={css`
          @property --rotate {
            syntax: '<angle>';
            initial-value: 132deg;
            inherits: false;
          }

          @keyframes spin {
            0% {
              --rotate: 0deg;
            }
            100% {
              --rotate: 360deg;
            }
          }
        `}
      />

      <Box
        className="magic-card"
        sx={{
          maxW: '980px',
          '--card-height': height,
          '--card-width': width,
          background: '#191c29',
          w: 'var(--card-width)',
          h: 'var(--card-height)',
          position: 'relative',
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          fontSize: '1.5em',
          color: 'rgba(88, 199, 250, 0%)',
          cursor: 'pointer',
          transition: 'color 1s',

          '&:hover': {
            color: 'rgba(88, 199, 250, 1)',
          },

          '&::before': {
            content: '""',
           

            width: '100.5%',
            height: '102%',
            borderRadius: '20px',
            backgroundImage:
              'linear-gradient(var(--rotate), #424242 0%, #E0E0E0 100%)',
            position: 'absolute',
            zIndex: -1,
            top: '-1%',
            left: '-0.25%',
            animation: 'spin 2.5s linear infinite',
          },

          '&::after': {
            content: '""',
            position: 'absolute',
            top: 'calc(var(--card-height) / 6)',
            left: 0,
            right: 0,
            zIndex: -1,
            height: '100%',
            width: '100%',
            margin: '0 auto',
            transform: 'scale(0.8)',
            filter: 'blur(calc(var(--card-height) / 6))',
            backgroundImage:
              'linear-gradient(var(--rotate), #424242 0%, #E0E0E0 100%)',
            opacity: 1,
            transition: 'opacity 0.5s',
            animation: 'spin 2.5s linear infinite',
          },

          '&:hover::before, &:hover::after': {
            animation: 'none',
            opacity: 0,
          },
        }}
      >
        {children}
      </Box>
    </>
  )
}
