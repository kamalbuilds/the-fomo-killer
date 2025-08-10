import { configureStore } from '@reduxjs/toolkit'
import { navbarReducer } from './reducer/navbarReducer'
import { userReducer } from './reducer/userReducer'
import { taskReducer } from './reducer/taskReducer'
import { agentReducer } from './reducer/agentReducer'

export const store = configureStore({
  reducer: {
    navbarReducer,
    userReducer,
    taskReducer,
    agentReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

