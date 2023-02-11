import React from "react";
import { Navigate } from "react-router-dom";
import { User } from "./store/auth/authSlice";
import { PopUps } from "./App";

export default function ProtectedRoutes({
  user,
  redirectPath = "/sign-in",
  children,
  props,
}: {
  user: User;
  redirectPath: string;
  children: JSX.Element;
  props: PopUps;
}) {
  if (!user.logged_in) {
    React.useEffect(() => {
      props.setAlert({
        message: "You need to log in to see this page.",
        type: "error",
        isOpen: true,
      });
    }, []);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
