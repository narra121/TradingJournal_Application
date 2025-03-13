// store/auth-slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  email: string | null;
  uid: string | null;
  name: string | null;
  photoURL: string | null;
  // Add other user properties as needed (displayName, photoURL, etc.)
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoggedIn: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
