import { createSlice } from "@reduxjs/toolkit";

export interface User {
  id: number;
  token: string;
  email: string;
  last_login_date?: string;
  validUntil?: string;
  logged_in: boolean;
  image_file?: string;
  type?: "normal" | "google";
}

const initialState: User = {
  id: 0,
  token: "",
  email: "",
  last_login_date: undefined,
  validUntil: undefined,
  logged_in: false,
  image_file: undefined,
  type: undefined
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logIn: (state, action) => {
      state.id = action.payload["id"],
      state.token = action.payload["access_token"],
      state.email = action.payload["email"]
      state.validUntil = action.payload["valid_until"]
      state.logged_in = true,
      state.image_file = action.payload["image_file"],
      state.last_login_date = new Date().toString(),
      state.type = action.payload["type"]
    },
    logOut: (state) => {
      state = Object.assign(state, initialState);
    },
    setProfileImage: (state, action) => {
      state.image_file = action.payload["image_file"]
    }
  },
});

export const { logIn, logOut, setProfileImage } = authSlice.actions;
export default authSlice.reducer;
