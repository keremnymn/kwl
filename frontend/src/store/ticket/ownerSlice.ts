import { createSlice } from "@reduxjs/toolkit";
import axios from "axios"

export interface OwnerInfo {
    userID: number,
    hasActiveTicket: boolean,
    ticketTopic: string,
    startedDate: number
  }

const initialState: OwnerInfo = {
    userID: 0,
    hasActiveTicket: false,
    ticketTopic: "",
    startedDate: 0,
  };

export const ownerSlice = createSlice({
    name: "owner",
    initialState,
    reducers: {
        setActiveTicket: (state, action) => {
            state.hasActiveTicket = true,
            state.userID = action.payload["userID"],
            state.ticketTopic = action.payload["topic"],
            state.startedDate = +new Date()
        },
        removeActiveTicket: (state, action) => {
          if (state.hasActiveTicket) {
            const ticketID = action.payload["ticketID"]
            
            axios.put("/api/kwl/shut-down-ticket", null, {
                params: { ticketID: ticketID, uuid: action.payload["uuid"] },
                headers: {
                  Authorization: `Bearer ${action.payload["token"]}`,
                },
            }).then(r => {
              const wsToClose = new WebSocket(r.data);
              wsToClose.onopen = () => {
                wsToClose.send(process.env.REACT_APP_KWL_SD_RAW!)
                wsToClose.close()
              }
            })
          }
          state =  Object.assign(state, initialState)
        }
    }
})

export const { setActiveTicket, removeActiveTicket } = ownerSlice.actions;
export default ownerSlice.reducer;