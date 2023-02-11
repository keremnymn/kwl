import { AnyAction, Dispatch } from "@reduxjs/toolkit";
import { logOut } from "../store/auth/authSlice";
import { BaseInfo } from "../store/ticket/baseInfo";
import { removeActiveTicket } from "../store/ticket/ownerSlice";

export function handleLogOut(
  dispatch: Dispatch<AnyAction>,
  token: string,
  ticketBase: BaseInfo
) {
  dispatch(logOut());
  dispatch(
    removeActiveTicket({
      token: token,
      ticketID: ticketBase.ticketID,
      uuid: ticketBase.uuid,
    })
  );
  window.localStorage.removeItem("dashboardData");
  window.localStorage.removeItem("ticketData");
}
