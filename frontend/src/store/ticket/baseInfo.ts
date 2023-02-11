import { createSlice } from "@reduxjs/toolkit";

export interface BaseInfo {
    uuid: string,
    pin: number,
    ticketID: number,
    messages: number[]
  }

const initialState: BaseInfo = {
    ticketID: 0,
    uuid: "",
    pin: 0,
    messages: []
  };

export const baseInfo = createSlice({
    name: "baseInfo",
    initialState,
    reducers: {
        setBaseInfo: (state, action) => {
            state.uuid = action.payload["uuid"]
            state.pin = action.payload["pin"]
            state.ticketID = action.payload["ticketID"]
        },
        updateMessages: (state, action) => {
            const messageID = action.payload["id"]
            const currentMessages = state.messages

            if (currentMessages.indexOf(messageID) === -1) {
              currentMessages.push(messageID)
              state.messages = currentMessages
            }
          },
        resetInfo : (state) => {
            state =  Object.assign(state, initialState)
        }
    }
})

export const { setBaseInfo, updateMessages, resetInfo } = baseInfo.actions;
export default baseInfo.reducer;