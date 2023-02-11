import React from "react";
import { Navigate } from "react-router-dom";
import { User } from "./store/auth/authSlice";

export default function ProtectedRoute({
  user,
  redirectPath = "/",
  children,
}: {
  user: User;
  redirectPath: string;
  children: JSX.Element;
}): React.ReactElement {
  if (user.logged_in) {
    return <Navigate to={redirectPath} />;
  }

  return children;
}
