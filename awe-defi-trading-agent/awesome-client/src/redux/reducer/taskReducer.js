import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  
  taskTitle: '',
  taskInfo: {
    id: '',
    userId: '',
    title: '',
    content: '',
    status: '', // created
    createdAt: '',
    updatedAt: '',
  },
  conversationsList: [],
  newTaskId: null,
  activeReanalysisStep: -1,
  confirmWorkflow: {
    loading: false,
    run: false 
  },
  usedMcps: [],
  reanalysisStatus: 'notStart', //notStart start, run, restart, end, error  重新分析

  currentChatList: [],
  reanalysiMCPInfo: [],

  sendLoading: false,
  exeTaskStatus: 'notStart', // notStart, run, end
  
}

const taskSlice = createSlice({
  name: 'taskReducer',
  initialState,
  reducers: {
   
    taskTitleAction: (state, action) => {
      state.taskTitle = action.payload
    },
    conversationsListAction: (state, action) => {
      state.conversationsList = action.payload
    },
  
    reanalysisStatusAction: (state, action) => {
      state.reanalysisStatus = action.payload
    },
    newTaskIdAction: (state, action) => {
      state.newTaskId = action.payload
    },
    activeReanalysisStepAction: (state, action) => {
      state.activeReanalysisStep = action.payload
    },
   

    confirmWorkflowAction: (state, action) => {
      state.confirmWorkflow = action.payload
    },
    usedMcpsAction: (state, action) => {
      state.usedMcps = action.payload
    },
    currentChatListAction: (state, action) => {
      state.currentChatList = action.payload
    },
    reanalysiMCPInfoAction: (state, action) => {
      state.reanalysiMCPInfo = action.payload
    },
    sendLoadingAction: (state, action) => {
      state.sendLoading = action.payload
    },
    exeTaskStatusAction: (state, action) => {
      state.exeTaskStatus = action.payload
    },
    
    
  },
})

export const {
    sendLoadingAction,
    currentChatListAction,
    usedMcpsAction,
    activeReanalysisStepAction,
    newTaskIdAction,
    taskTitleAction,
    conversationsListAction, 
    confirmWorkflowAction,
    reanalysisStatusAction,
    reanalysiMCPInfoAction,
    exeTaskStatusAction,
    
} = taskSlice.actions

export const selectTaskTitle = (state) => state.taskReducer.taskTitle
export const selectConversationsList = (state) => state.taskReducer.conversationsList
export const selectNewTaskId = (state) => state.taskReducer.newTaskId
export const selectActiveReanalysisStep = (state) => state.taskReducer.activeReanalysisStep

export const selectConfirmWorkflow = (state) => state.taskReducer.confirmWorkflow
export const selectUsedMcps = (state) => state.taskReducer.usedMcps
export const selectReanalysisStatus = (state) => state.taskReducer.reanalysisStatus
export const selectCurrentChatList = (state) => state.taskReducer.currentChatList
export const selectReanalysiMCPInfo = (state) => state.taskReducer.reanalysiMCPInfo
export const selectSendLoading = (state) => state.taskReducer.sendLoading
export const selectExeTaskStatus = (state) => state.taskReducer.exeTaskStatus

export const taskReducer = taskSlice.reducer

