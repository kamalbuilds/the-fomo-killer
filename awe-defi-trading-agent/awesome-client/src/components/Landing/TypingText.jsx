'use client'
import React, { useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'

export const TypingText = ({
  lines = [],
  totalDuration = 2000,
  onComplete,
}) => {
  const [displayedLines, setDisplayedLines] = useState([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [readyToStart, setReadyToStart] = useState(false) // 新增状态：等待页面渲染完成再开始

  const totalChars = lines.reduce((sum, line) => sum + line.length, 0)

  // ✅ 页面渲染完成后 550ms 启动动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setReadyToStart(true)
    }, 550)
    return () => clearTimeout(timer)
  }, [])

  // ✅ 动画执行逻辑
  useEffect(() => {
    if (!readyToStart || currentLine >= lines.length || totalChars === 0) return

    const fullLine = lines[currentLine]
    let charIndex = 0
    const avgCharDelay = totalDuration / totalChars

    const typeChar = () => {
      if (charIndex < fullLine.length) {
        setCurrentText((prev) => prev + fullLine[charIndex])
        charIndex++
        setTimeout(typeChar, avgCharDelay)
      } else {
        setDisplayedLines((prev) => [...prev, fullLine])
        setCurrentText('')
        const nextLine = currentLine + 1
        setCurrentLine(nextLine)

        if (nextLine >= lines.length && typeof onComplete === 'function') {
          setTimeout(() => {
            onComplete()
          }, 200)
        }
      }
    }

    const startTimeout = setTimeout(() => {
      typeChar()
    }, 100)

    return () => clearTimeout(startTimeout)
  }, [readyToStart, currentLine, lines, totalDuration, onComplete, totalChars])

  return (
    <Box
      className="terminal-container fx-col h100"
      fontWeight={400}
      lineHeight={['12px','12px','24px','24px']}
      fontSize={['12px','12px','14px','14px']}
    >
      {displayedLines.map((line, i) => (
        <div key={i} className="terminal-line">{line}</div>
      ))}
      {currentLine < lines.length && (
        <div className="terminal-line typing-line">
          {currentText}
          <span className="cursor" />
        </div>
      )}
    </Box>
  )
}
