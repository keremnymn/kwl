import React from "react";
import { Navigate } from "react-router-dom";
import { User } from "./store/auth/authSlice";

export default function AdminRoutes({
  user,
  redirectPath = "/",
  children,
}: {
  user: User;
  redirectPath: string;
  children: JSX.Element;
}) {
  if (!process.env.REACT_APP_ADMINS!.split(",").includes(user.id.toString())) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
