'use client'
import { Box, Text, Button } from '@chakra-ui/react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Box 
      className="flex flex-col items-center justify-center min-h-screen bg-[#010101]"
      style={{ fontFamily: 'Messina Sans' }}
    >
      <Text fontSize="6xl" fontWeight="bold" color="#E0E0E0" mb={4}>
        404
      </Text>
      <Text fontSize="xl" color="#E0E0E0" mb={8}>
        Page not found
      </Text>
      <Link href="/">
        <Button
          bg="#1F1F22"
          color="#E0E0E0"
          _hover={{ bg: '#2a2a2d' }}
          size="lg"
        >
          Go Home
        </Button>
      </Link>
    </Box>
  )
} 