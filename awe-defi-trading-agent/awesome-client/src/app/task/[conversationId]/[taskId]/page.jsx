'use client'
import React from 'react'
import { TaskLayout } from '@/components'
import { useParams } from 'next/navigation'


export default function TaskPage() {

    const params = useParams()
    
    const conversationId = params.conversationId
    const taskId = params.taskId

    return (
        <TaskLayout
            type='task'
            conversationId={conversationId}
            taskId={taskId}
        />
    )
}




