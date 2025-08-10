import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  agentChat: {
    status: 'notStart',
    agentConversationId: null,
    chatContent: null,
    errorMsg: null
  },
  agentConversationId: null,
  agentMessages: [] // 
  // [
  //       { 
  //           id: '11',
  //           type: 'user',
  //           intent: 'chat',
  //           chatContent: 'hello'
  //       },
  //       {
  //           id: '22',
  //           type: 'assistant',
  //           intent: 'chat',
  //           chatContent: 'xxxxx',
  //           thinkingContent: null,
  //           finalResultContent: null
  //       },

  //         { 
  //           id: '33',
  //           type: 'user',
  //           intent: 'task',
  //           chatContent: 'Fetch market statistics for the top 3 meme coins',
  //           thinkingContent: null,
  //           finalResultContent: null
  //       },
  //       {
  //           id: '44',
  //           type: 'assistant',
  //           intent: 'task',
  //           chatContent: null,
  //           thinkingContent: 'Executing Agent task \"【机器人】Identify Top 3 Me',
  //           finalResultContent: '*meme_top3_coin_identifier** execu'
  //       }
  //   ]



}

const navbarSlice = createSlice({
  name: 'agentReducer',
  initialState,
  reducers: {
    agentChatAction: (state, action) => {
      state.agentChat = action.payload
    },
    agentConversationIdAction: (state, action) => {
      state.agentConversationId = action.payload
    },
   
    agentMessagesAction: (state, action) => {
      state.agentMessages = action.payload
    },
    createAgentMessagesAction: (state, action) => {
      let msg = JSON.parse(JSON.stringify(state.agentMessages))
      const newMsg = action.payload
      // console.log('newMsg', newMsg)
      msg.push(newMsg)
      // console.log('msg', msg)
      state.agentMessages = msg

    },
    updateAgentMessagesAction: (state, action) => {
      const { chatContent, thinkingContent, finalResultContent, loading, last, intent, 
          request, response, requestEnd, thinkingEnd } = action.payload
      const lastMsg = state.agentMessages[state.agentMessages.length - (last || 1)]

      if (lastMsg) {
        if (chatContent !== null && chatContent !== undefined) {
          lastMsg.chatContent = (lastMsg.chatContent || '') + chatContent
        }

        if (thinkingContent !== null && thinkingContent !== undefined) {
          lastMsg.thinkingContent = (lastMsg.thinkingContent || '') + thinkingContent
        }

        if (finalResultContent !== null && finalResultContent !== undefined) {
          lastMsg.finalResultContent = (lastMsg.finalResultContent || '') + finalResultContent
        }
        if (intent) {
          lastMsg.intent = intent
        }

        if (typeof loading === 'boolean') {
          lastMsg.loading = loading
        }

        if (request) {
          lastMsg.request = request
          lastMsg.intent = 'request'
        }
        if (response) {
          lastMsg.response = response
          lastMsg.intent = 'request'
        }
        if(requestEnd) {
          lastMsg.requestEnd = requestEnd
        }
        if(thinkingEnd) {
          lastMsg.thinkingEnd = thinkingEnd
        }

      }
    }


    
  },
})

export const {
  agentMessagesAction,
  agentChatAction,
  agentConversationIdAction,
  createAgentMessagesAction,
  updateAgentMessagesAction
} = navbarSlice.actions

export const selectAgentMessages = (state) => state.agentReducer.agentMessages
export const selectAgentChat = (state) => state.agentReducer.agentChat
export const selectAgentConversationId = (state) => state.agentReducer.agentConversationId
export const agentReducer = navbarSlice.reducer

