'use client'
import React, { useEffect, useState } from 'react';
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
  Input,
  Textarea
} from '@chakra-ui/react';
import Image from 'next/image'
import { FlashCircleImg, Loading2Img, ImportImg, ExportImg} from '@/assets/images';
import { AppButton, ButtonWrap, showToast } from '@/components'
import { createAgentFromTaskApi, generateInfoApi} from '@/api'
import { useAppSelector } from '@/redux/hooks';
import { selectExeTaskStatus, selectReanalysisStatus } from '@/redux/reducer';

export const SaveAgent = ({ taskId }) => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const [saveInfo, setSaveInfo] = useState({
        isOpen: false,
        title: '',
       
    })

    const exeTaskStatus = useAppSelector(selectExeTaskStatus)
   
    useEffect(() => {
        // 只有creator可以调用
        fetchAgentInfo()
    },[])

    const fetchAgentInfo = async() => {
        const a = await generateInfoApi(taskId)
        
        if(a) {
            const { name:_name, description: _description } = a
            setName(_name)
            setDescription(_description)
        }
    }
    const checkTaskStatus = (title) => {
       
        if(exeTaskStatus !== 'end') {
            return showToast('warning', 'Please confirm workflow first')
        }   
      
        setSaveInfo({ isOpen: true, title })
    }
    const onSave = async() => {
        if(loading) return

        const nameRegex = /^[a-zA-Z0-9_]{4,50}$/

        const descRegex = /^[a-zA-Z0-9_]{1,280}$/
        if(!nameRegex.test(name)) {
            return showToast('warning', 'Only letters (A-Z), numbers (0-9), and underscores (_) are allowed')
        }
        
        if(description.length > 280) {
            return showToast('warning', 'Description cannot exceed 280 characters')
        }

        setLoading(true)
        
        const a = await createAgentFromTaskApi(taskId, {
            name,
            description,
            status: saveInfo.title === 'Save as Private Agent' ?  'private' : 'public',
        })
       
        if(a) {
            showToast('success',`Successfully ${saveInfo.title}`)
            onClose()
        }
    }

    const onClose = () => {
        setSaveInfo({ 
            isOpen: false,
            title: ''
        })
        // setName('')
        // setDescription('')
        setLoading(false)
    }

    return (
        <Box mt='68px'>            
            <Box 
                className="fx-row ai-ct " 
                display="grid" 
                gridTemplateColumns={['1fr', '1fr 1fr', '1fr 1fr', '1fr 1fr']}
                gap={['8px','8px','4px','4px','8px']}
                width="100%" 
            >
                {
                    [
                        { name:'Save Agent' , icon: ImportImg, title: 'Save as Private Agent' },
                        { name:'Publish Agent' , icon: ExportImg, title: 'Publish as Public Agent' },
                        // { name:'Save Auth' , icon: FlashCircleImg, title: '' }
                    ].map(item => (
                        <AppButton
                            key={item.name}
                            onClick={() => item.name === 'Save Auth' ? () => null : checkTaskStatus(item.title)}
                            loading={false}
                            title={item.name}
                            icon={item.icon}
                            type={item.name === 'Save Auth' ? 'bg' : 'line'}
                            px='16px'
                        />
                    ))
                }
            </Box>

            <Modal isOpen={saveInfo.isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent 
                    bg="#010101" 
                    border="1px solid #293033" 
                    borderRadius="12px"
                    maxW="556px"
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
                        { saveInfo.title }
                    </Text>
                    
                    </ModalHeader>
                    
                    <ModalBody pt="24px" pb="32px">
                        <Box>
                            <Text mb='8px' color='#E0E0E0' fontSize='14px' fontWeight={700}>Agent Name</Text>
                            <Input
                                // placeholder="Agent Name"
                                bg="#1F1F22"
                                color="#E0E0E0"
                                _placeholder={{ color: '#828B8D' }}
                                border='1px solid #293033'
                              
                                h="42px"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                _hover={{ borderColor: "#293033" }}
                                _focus={{
                                    borderColor: "#293033",
                                    boxShadow: "none",
                                }}
                            />
                        </Box>
                        <Box>
                            <Text mb='8px' color='#E0E0E0' fontSize='14px' fontWeight={700} mt='24px'>Agent Description</Text>
                            <Textarea
                                // placeholder="Agent Description"
                                bg="#1F1F22"
                                color="#E0E0E0"
                                _placeholder={{ color: '#828B8D' }}
                                border='1px solid #293033'
                                _hover={{ borderColor: 'transparent' }}
                                _focus={{ borderColor: 'transparent' }}
                                h="100px"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Box>
                    </ModalBody>
                    
                    <ModalFooter className='' >
                        
                        <Box
                            className=''
                            w='100%'
                            display="grid" 
                            gridTemplateColumns={['1fr', '1fr 1fr', '1fr 1fr', '1fr 1fr']}
                            gap='24px'
                        >
                            <AppButton
                                onClick={onClose}
                                loading={false}
                                title='Cancel'                         
                                type = 'line'
                                px='68px'
                            />
                            <AppButton
                                onClick={onSave}
                                loading={loading}
                                title='Save'
                                type='bg'
                                px='68px'
                            />                      
                        </Box>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};


