import React, { lazy, Suspense } from "react";
import { Container } from "@mui/material";

import { useSearchParams } from "react-router-dom";
const InitialComponent = lazy(
  () => import("../Components/resetPassword/initialComponent")
);
const TokenReceivedComponent = lazy(
  () => import("../Components/resetPassword/tokenReceivedComponent")
);

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { PopUps } from "../App";

export interface resetPasswordTokenProps extends PopUps {
  token?: string;
  userEmail: string;
  setUserEmail: Function;
  setParams: Function;
}

export default function ResetPassword(props: PopUps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userEmail, setUserEmail] = React.useState("");

  const newProps = (props: PopUps): resetPasswordTokenProps => {
    return {
      ...props,
      token: searchParams.get("token")!,
      userEmail: userEmail,
      setUserEmail: setUserEmail,
      setParams: setSearchParams,
    };
  };

  React.useEffect(() => {
    document.title = `Reset Password - kwl.app`;
  }, []);

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_SITE_KEY!}>
      <Container component="main" maxWidth="xs">
        {searchParams.get("token") ? (
          <Suspense fallback={<></>}>
            <TokenReceivedComponent {...newProps(props)} />
          </Suspense>
        ) : (
          <Suspense fallback={<></>}>
            <InitialComponent {...newProps(props)} />
          </Suspense>
        )}
      </Container>
    </GoogleReCaptchaProvider>
  );
}
