'use client'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { ClockImg, ShowMoreImg, SelectedImg, AttentionImg } from '@/assets/images'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { analyzeTaskStreamApi, executeTaskStreamApi, replaceMCPStreamApi } from '@/api'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {
  activeReanalysisStepAction,
  confirmWorkflowAction,
  reanalysisStatusAction,
  selectConfirmWorkflow,
  selectReanalysiMCPInfo,
  selectReanalysisStatus,
  sendLoadingAction,
  usedMcpsAction,
  reanalysiMCPInfoAction,
  exeTaskStatusAction
} from '@/redux/reducer'
import { sleep } from '@/utils'
import { SuccessModal, showToast, AgentMessageCard, ExecuteTool } from '@/components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

const STEPS = [
  'Analyzing Task Requirements',
  'Identifying Most Relevant MCPs',
  'Confirming Deliverables',
  'Building MCP Workflow',
  'Deliverables'
]

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins}min ${secs}s` : `${secs}s`
}

export const Generate = ({ taskId }) => {
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [stepContents, setStepContents] = useState(Array(STEPS.length).fill([]))
  const [stepTimes, setStepTimes] = useState(Array(STEPS.length).fill(0))
  const [executeModal, setExecuteModal] = useState({ isOpen: false, content: '' })
  const containerRef = useRef(null)
  const bottomRef = useRef(null)
  const timerRef = useRef(null)
  const currentStepIndexRef = useRef(-1) 
  const dispatch = useAppDispatch()

  const reanalysisStatus = useAppSelector(selectReanalysisStatus)
  const confirmWorkflow = useAppSelector(selectConfirmWorkflow)
  const reanalysiMCPInfo = useAppSelector(selectReanalysiMCPInfo)

  const [request, setRequest] = useState(null)
  const [response, setResponse] = useState(null)

  useEffect(() => {
    if (currentStepIndex >= 0) {
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setStepTimes((prev) => {
          const updated = [...prev]
          updated[currentStepIndex] += 1
          return updated
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [currentStepIndex])

  useEffect(() => {
    if (reanalysisStatus === 'start' || reanalysisStatus === 'restart') {
      setVisibleSteps(0)
      setCurrentStepIndex(-1)
      setStepContents(Array(STEPS.length).fill(''))
      setStepTimes(Array(STEPS.length).fill(0))

      dispatch(exeTaskStatusAction('notStart'))

      if(reanalysisStatus === 'start') {
        analyzeTask()
      }
      if(reanalysisStatus === 'restart' && reanalysiMCPInfo && reanalysiMCPInfo.length > 0) {
        reAnalyzeTask()
      }
    }
  }, [reanalysisStatus, reanalysiMCPInfo])

  useEffect(() => {
    if (confirmWorkflow.run === true) {
      executeTask()
    }
  }, [confirmWorkflow])

    

  const reAnalyzeTask = async () => {
    setRequest(null)
    setResponse(null)
    // console.log('reanalysiMCPInfo', reanalysiMCPInfo)

  
    await replaceMCPStreamApi(taskId, { replacements: reanalysiMCPInfo }, raw => {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      const { event, data } = parsed
        // console.log('replaceMCPStreamApi===', parsed)

      console.log('重新分析 parsed:', parsed)

      if (event === 'step_start') {
        const stepNum = data.stepNumber || 1
        currentStepIndexRef.current = stepNum - 1
        setVisibleSteps(prev => Math.max(prev, stepNum))
        setCurrentStepIndex(stepNum - 1)
        dispatch(activeReanalysisStepAction(stepNum))
      }

      if (event === 'step_complete') {
        const idx = currentStepIndexRef.current
        const content = data.content

        if (idx >= 0 && content) {
          setStepContents(prev => {
            const updated = [...prev]
            updated[idx] = content
            return updated
          })
          clearInterval(timerRef.current)
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }

     
      }

      if (event === 'batch_replacement_complete') {
        const { mcps, workflow } = data.mcpWorkflow || {}
        // console.log('重新分析完成', data)
        dispatch(usedMcpsAction(mcps || []))
        dispatch(reanalysiMCPInfoAction([])) 
        dispatch(reanalysisStatusAction('end'))
        dispatch(sendLoadingAction(false))
        clearInterval(timerRef.current)
        showToast('success', data.message || 'MCP reanalysis successful, workflow updated')
        executeTask()
      }

      if (event === 'error') {
        const message = data?.message || 'MCP reanalysis failed'
        showToast('error', message)
        dispatch(reanalysiMCPInfoAction([])) 
        dispatch(reanalysisStatusAction('error'))
        dispatch(sendLoadingAction(false))
      }
    })
  }


  // console.log('setStepContents', stepContents)
  const analyzeTask = async () => {
    await analyzeTaskStreamApi(taskId, (raw) => {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      const { event, data } = parsed
      // console.log('分析parsed', parsed)

      if (event === 'step_start') {
        const stepNum = data.stepNumber
        currentStepIndexRef.current = stepNum - 1 // ✅ 记录当前 step
        setVisibleSteps((prev) => Math.max(prev, stepNum))
        setCurrentStepIndex(stepNum - 1)
        dispatch(activeReanalysisStepAction(stepNum))
      }

      if (event === 'step_complete') {
        const idx = currentStepIndexRef.current // ✅ 使用 ref 中记录的正确 index
        if (idx >= 0) {
          setStepContents((prev) => {
            const updated = [...prev]
            updated[idx] = data.content
            return updated
          })
          clearInterval(timerRef.current)
          bottomRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }

      if (event === 'analysis_complete') {
          const { mcps, workflow} = data.mcpWorkflow
          // console.log('分析完成', data)

          dispatch(usedMcpsAction(mcps))
          dispatch(reanalysisStatusAction('end'))

          // 停止当前正在计时的步骤（确保只清除一次）
          clearInterval(timerRef.current)
          dispatch(sendLoadingAction(false))
        }

      if (event === 'error') {
        const message = data?.message || 'MCP analysis failed'
        showToast('error', message)
        clearInterval(timerRef.current)
        dispatch(reanalysiMCPInfoAction([])) 
        dispatch(reanalysisStatusAction('error'))
        dispatch(sendLoadingAction(false))
      }

    })
  } 


 const appendToStepContent = (text, type = 'normal', noNewLine = false) => {
  setStepContents((prev) => {
    const updated = [...prev]
    const existing = updated[4] || []

    const prefix = {
      normal: '',
      system: '🛠 ',
      success: '✅ ',
      done: '🏁 ',
      generating: '🔄 ',
    }[type] || ''

    const contentText = `${prefix}${text}`

    if (noNewLine && existing.length > 0) {
      const last = existing[existing.length - 1]

      // 如果最后一个是 ReactMarkdown，尝试拼接文字
      if (React.isValidElement(last) && last.props.children) {
        const lastContent = last.props.children
        const newText = typeof lastContent === 'string' ? lastContent + text : text

        // 替换最后一个元素
        const updatedLast = (
          <Box fontSize='12px' fontWeight={350} color='#e0e0e0' whiteSpace='pre-wrap'>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {newText}
            </ReactMarkdown>
          </Box>
        )

        updated[4] = [...existing.slice(0, -1), updatedLast]
        return updated
      }
    }

    // 正常添加新内容块
    const color =
      type === 'success' ? '#90EE90'
      : type === 'system' ? '#87CEFA'
      : type === 'generating' ? '#FFD700'
      : type === 'done' ? '#FFA07A'
      : '#e0e0e0'

    updated[4] = [
      ...existing,
      <Box fontSize='12px' fontWeight={350} color={color} whiteSpace='pre-wrap'>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {contentText}
        </ReactMarkdown>
      </Box>
    ]

    return updated
  })
}



  const executeTask = async () => {

    dispatch(exeTaskStatusAction('notStart'))
    setVisibleSteps(5)
    setCurrentStepIndex(4)
    setStepTimes((prev) => {
      const updated = [...prev]
      updated[4] = 0
      return updated
    })

    try {
      await executeTaskStreamApi(taskId, (raw) => {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw
        console.log('执行任务', data)
        const { event, data: d } = data

        if (event === 'execution_start') {
          appendToStepContent('Starting execution...', 'system')
        }

        if (event === 'status_update') {
          appendToStepContent(`Status: ${d.status}`, 'system')
        }

        // request
        if (event === 'step_executing') {
            const { toolDetails } = d
            const { toolName, args } = toolDetails
            console.log('task 执行任务 request', d)
            setRequest({ toolName, args:  JSON.stringify(args) })

        }
        // response
        if (event === 'step_raw_result') {
            const { result } = d 
            console.log('task 执行任务 response', d)
            setResponse(JSON.stringify(result.content[0]) || '')
        }

        if (event === 'step_start') {
          appendToStepContent(`Running ${d.mcpName || ''} - ${d.actionName || ''}`, 'generating')
        }

        if (event === 'step_complete') {
          appendToStepContent(d.result || 'Step complete', 'success')
        }


        if (event === 'generating_summary') {
          appendToStepContent(d.message || 'Generating summary...', 'system')
        }

        if (event === 'summary_chunk') {
          appendToStepContent(d.content || '', 'normal', true) 
        }


        if (event === 'workflow_complete') {
          appendToStepContent(d.message || 'Workflow completed', 'success')
        }

        if (event === 'task_complete') {
          appendToStepContent('DONE ✅', 'done')
        }
      })

      setExecuteModal({
        isOpen: true,
        content: 'You’ve successfully completed the MCP workflow'
      })
      dispatch(exeTaskStatusAction('end'))
    } catch (err) {
      console.error('Stream error:', err)
      dispatch(exeTaskStatusAction('notStart'))
    }

    clearInterval(timerRef.current)
    await sleep(500)
    dispatch(confirmWorkflowAction({ run: false, loading: false }))
  }

  
  // console.log('request', request)
  // console.log('response', response)
  return (
    <Box ref={containerRef} overflowY='auto' pb='32px' className=''>
      
      <AnimatePresence>
        {STEPS.slice(0, visibleSteps).map((step, idx) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box className='fx-col' mt='30px' borderTop={idx === 0 ? '' : '1px solid #293033'} pt={idx === 0 ? '0px' : '32px'}>
              {
                idx !== 4 && 
                <Box className='fx-row ai-ct jc-sb'>
                  <Box className='fx-row ai-ct'>
                    <Image src={SelectedImg} alt='selected' width={14} height={14} />
                    <Text fontSize={['14px','14px','16px','16px',]} color='#E0E0E0' fontWeight={600} ml='4px'>
                      {step}
                    </Text>
                  </Box>
                  <Box className='fx-row ai-ct'>
                    <Image src={ClockImg} alt='clock' width={14} height={14} />
                    <Text fontSize='12px' color='rgba(224, 224, 224, 0.60)' fontWeight={400} ml='4px'>
                      {formatTime(stepTimes[idx])}
                    </Text>
                  </Box>
                </Box>
              }

               {
                  idx === 4 && request && 
                    <ExecuteTool
                      loading={true}
                      request={request}                                  
                      response={response || ''}
                    />
                }

              <Box className='fx-row ai-ct jc-sb mt-[12px]' borderLeft='1px solid #293033' pl='20px'>
               <Box className='w-full flex-col ' fontSize={['12px','14px','16px','16px',]}  color='#B8B8B8'>              
                  {
                    idx === 4
                      ? (
                          (typeof stepContents[4] === 'string' || stepContents[4].length > 0)
                            ? 
                            <AgentMessageCard title="Deliverables" message={stepContents[4]} defaultExpand={true} isTask={true}/>
                            : <Text fontSize="12px" fontWeight={350}>Generating deliverables...</Text>
                        )
                      : (
                          stepContents[idx].length > 0
                            ? stepContents[idx]
                            : null
                        )
                  }
                </Box>
                {idx !== 4 && <Image src={ShowMoreImg} className='cursor-pointer' width={20} height={20} alt='showmore' />}
              </Box>
            </Box>
          </motion.div>
        ))}

       

      </AnimatePresence>
      
    
      <div ref={bottomRef} />

      <SuccessModal
        isOpen={executeModal.isOpen}
        onClose={() => setExecuteModal({ isOpen: false, content: '' })}
        title='🎉 Congratulations!'
        content={executeModal.content}
      />
    </Box>
  )
}
