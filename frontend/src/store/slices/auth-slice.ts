import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface RoleSummary {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  is_active: boolean;
  roles: RoleSummary[];
  permissions: string[];
  created_at: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; user?: User }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
