import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isSidebarExpand: false,
  searchOpen:false,
  callWalletSign: false
}

const navbarSlice = createSlice({
  name: 'navbarReducer',
  initialState,
  reducers: {
    isSidebarExpandAction: (state, action) => {
      state.isSidebarExpand = action.payload
    },
    searchOpenAction: (state, action) => {
      state.searchOpen = action.payload
    },
    callWalletSignAction: (state, action) => {
      state.callWalletSign = action.payload
    },
  },
})

export const {
  isSidebarExpandAction,
  searchOpenAction,
  callWalletSignAction
} = navbarSlice.actions

export const selectSidebarExpand = (state) => state.navbarReducer.isSidebarExpand
export const selectSearchOpen = (state) => state.navbarReducer.searchOpen
export const selectCallWalletSign = (state) => state.navbarReducer.callWalletSign
export const navbarReducer = navbarSlice.reducer

