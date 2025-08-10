import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  userInfo: {
    id: '',
    username: '',
    avatar: null,
    walletAddress: '',
    balance: '',
    email: null,
    loginMethods: {
        wallet: {
            address: '',
            verified: false,
            lastSignedAt: ''
        }
    },
    createdAt: '',
    lastLoginAt: ''
  },
  membershipStatus: {
    isActive: false,
    membershipType: null, // null plus pro
    subscriptionType: '',
    expiresAt: ''
  }
}

const userSlice = createSlice({
  name: 'userReducer',
  initialState,
  reducers: {
   
    userInfoAction: (state, action) => {
      state.userInfo = action.payload
    },
    membershipStatusAction: (state, action) => {
      state.membershipStatus = action.payload
    },
  },
})

export const {
  userInfoAction,
  membershipStatusAction
} = userSlice.actions

export const selectUserInfo = (state) => state.userReducer.userInfo
export const selectMembershipStatus = (state) => state.userReducer.membershipStatus

export const userReducer = userSlice.reducer

