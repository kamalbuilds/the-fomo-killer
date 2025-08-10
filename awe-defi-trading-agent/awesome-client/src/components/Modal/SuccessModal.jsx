import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Box,
  
} from '@chakra-ui/react';
import Image from 'next/image'
import { CloseImg } from '@/assets/images';
import { ButtonWrap } from '@/components'

export const SuccessModal = ({ isOpen, onClose, title, content }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent 
        bg="#010101" 
        border="1px solid #293033" 
        borderRadius="12px"
        maxW="400px"
      >
        <ModalHeader 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center"
          borderBottom="1px solid #293033"
          pb="16px"
        >
          <Text 
            color="#E0E0E0" 
            fontSize="18px" 
            fontWeight="600"
          >
            { title }
          </Text>
          <Image 
            src={CloseImg} 
            className='click w-[20px] h-[20px]'
            alt="close" 
           
            onClick={onClose}
           
          />
        </ModalHeader>
        
        <ModalBody pt="24px" pb="32px">
          <Text 
            color="#E0E0E0" 
            fontSize="14px" 
            fontWeight="400"
            lineHeight="1.5"
          >
            { content }
          </Text>
        </ModalBody>
        
        <ModalFooter justifyContent="flex-end" pt="0" pb="24px" pr="24px" className=''>
            <ButtonWrap>
                <Box
                    onClick={onClose}
                    
                
           
                    borderRadius="23.368px"
                    border="1px solid #E0E0E0"
                    bg="transparent"
                    color="#E0E0E0"
                    fontSize="14px"
                    fontWeight="500"
                   
                    w='174px'
                    className='center'
                    py='8px'
                    
                >
                    OK
                </Box>
            </ButtonWrap>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};


