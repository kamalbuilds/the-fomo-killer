
import React from 'react'
import { Box, Text } from '@chakra-ui/react'

export const ToolsCard = ({
    toolName,
    toolDesc
}) => {
    return(
        <Box 
            mt='12px'
            borderRadius='12px'
            border='1px solid #293033'
            bgColor='rgba(31, 31, 34, 0.50)'
            p={['8px','12px','14px','16px','16px']}
        >
            <Text color='#E0E0E0' fontSize='14px' fontWeight={600}>{toolName}</Text>
            <Text color='rgba(224, 224, 224, 0.50)' fontSize='12px' fontWeight={400} mt='8px'>{toolDesc}</Text>
        </Box>
    )
}