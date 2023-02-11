import React, { lazy } from "react";
import {
  Avatar,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  Divider,
} from "@mui/material";
const LockOutlinedIcon = lazy(() => import("@mui/icons-material/LockOutlined"));
const GoogleIcon = lazy(() => import("@mui/icons-material/Google"));

import { PopUps } from "../App";
import { logIn } from "../store/auth/authSlice";
import { resetVisitorInfo } from "../store/ticket/visitorSlice";

import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

interface UserInfoToLog {
  access_token: string;
  email: string;
  id: number;
  valid_until: number;
  image_file?: string;
}

export default function SignIn(props: PopUps) {
  let [searchParams, setSearchParams] = useSearchParams();
  const [remember, setRemember] = React.useState("false");

  const navigate = useNavigate();
  React.useEffect(() => {
    document.title = `Sign In - kwl.app`;
    let token = searchParams.get("token");

    if (token) {
      axios
        .post(
          "/api/users/confirm-email",
          { token: token },
          {
            headers: { "Content-type": "application/json" },
          }
        )
        .then(() => {
          setSearchParams("");
          props.setDialog({
            title: "Email Confirmed",
            text: "We have confirmed your email. You can now sign in.",
            dialogOpen: true,
          });
        })
        .catch(() => {
          setSearchParams("");
        });
    }
  }, []);

  const logUserIn = (data: UserInfoToLog) => {
    props.dispatch(logIn(data));
    props.dispatch(resetVisitorInfo());
    props.setbackDropOpen(false);
    let nextUrl = searchParams.get("next");
    if (nextUrl) {
      navigate(nextUrl);
    }
    props.setAlert({
      message: "You've succcessfully signed in.",
      type: "success",
      isOpen: true,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    let formObject = Object.fromEntries(data.entries());
    let formStr = `grant_type=&username=${formObject["email"]}&password=${formObject["password"]}&scope=&client_id=&client_secret=&scope=remember:${remember}`;
    props.setbackDropOpen(true);
    axios
      .post("/api/users/sign-in", formStr, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then((r) => {
        logUserIn(r.data as UserInfoToLog);
      })
      .catch((e) => {
        if (e.response["status"] == 406) {
          props.setbackDropOpen(false);
          let emailConfirm = async () => {
            axios
              .post(
                "/api/users/late-confirm-email",
                { email: formObject["email"] },
                {
                  headers: { "Content-type": "application/json" },
                }
              )
              .then((r) => {
                props.setDialog({
                  dialogOpen: true,
                  title: "Confirmation Email Sent",
                  text: "Please confirm your account with the email that we've just sent to you.",
                });
              })
              .catch((e) => {
                props.setDialog({
                  dialogOpen: false,
                });
                props.setAlert({
                  message: e.response.data["detail"],
                  type: "error",
                  isOpen: true,
                });
              });
          };
          props.setDialog({
            dialogOpen: true,
            title: "Your Email Hasn't Been Confirmed",
            text: "Your email hasn't been confirmed. Would you like us to send a confirmation email?",
            extraButton: {
              func: emailConfirm,
              buttonText: "Send Confirmation Email",
            },
          });
        } else {
          props.setbackDropOpen(false);
          props.setAlert({
            message: e.response.data["detail"],
            type: "error",
            isOpen: true,
          });
        }
      });
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse: any) => {
      props.setbackDropOpen(true);
      const backendData = {
        access_token: tokenResponse.access_token,
        data_endpoint: "https://openidconnect.googleapis.com/v1/userinfo",
      };
      axios
        .post("/api/users/login-with-google", backendData)
        .then((r) => {
          props.setbackDropOpen(false);
          logUserIn(r.data as UserInfoToLog);
        })
        .catch(() => {
          props.setbackDropOpen(false);
          props.setAlert({
            isOpen: true,
            message:
              "We couldn't find you in our member base, would you like to sign up?",
            type: "error",
          });
        });
    },
  });

  return (
    <Container component="main" maxWidth="xs" sx={{ minHeight: "70vh" }}>
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Button
          fullWidth
          variant="contained"
          startIcon={<GoogleIcon />}
          sx={{ my: 2 }}
          onClick={() => {
            loginWithGoogle();
          }}
        >
          Login with Google
        </Button>
        <Divider sx={{ opacity: "70%", fontSize: "small", width: "100%" }}>
          or sign in manually
        </Divider>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <FormControlLabel
            control={
              <Checkbox
                value={remember}
                color="primary"
                onChange={(e) => {
                  setRemember(e.target.checked.toString());
                }}
              />
            }
            label="Remember me"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          <Grid container>
            <Grid item xs>
              <Link
                sx={{
                  cursor: "pointer",
                }}
                onClick={() => {
                  navigate("/reset-password");
                }}
                variant="body2"
              >
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link
                sx={{
                  cursor: "pointer",
                }}
                onClick={() => {
                  navigate("/sign-up");
                }}
                variant="body2"
              >
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
