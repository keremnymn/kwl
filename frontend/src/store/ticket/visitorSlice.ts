import { createSlice } from "@reduxjs/toolkit";

export interface VisitorInfo {
    firstnameAndSurname: string,
    connectedTimestamp: number, // timestamp
  }

const initialState: VisitorInfo = {
    firstnameAndSurname: "",
    connectedTimestamp: 0,
  };

export const visitorSlice = createSlice({
    name: "visitor",
    initialState,
    reducers: {
        setVisitorConnected: (state, action) => {
            state.firstnameAndSurname = action.payload["firstnameAndSurname"]
            state.connectedTimestamp = +new Date()
        },
        resetVisitorInfo: (state) => {
          state =  Object.assign(state, initialState)
        }
    }
})

export const { setVisitorConnected, resetVisitorInfo } = visitorSlice.actions;
export default visitorSlice.reducer;