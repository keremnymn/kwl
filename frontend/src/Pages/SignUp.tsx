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
} from "@mui/material/";
const LockOutlinedIcon = lazy(() => import("@mui/icons-material/LockOutlined"));
const GoogleIcon = lazy(() => import("@mui/icons-material/Google"));

import { PopUps } from "../App";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

export default function SignUp(props: PopUps) {
  React.useEffect(() => {
    document.title = `Sign Up - kwl.app`;
  }, []);
  const [checkBoxVal, setCheckBoxVal] = React.useState("false");
  const navigate = useNavigate();

  const handleDBClose = () => {
    props.setbackDropOpen(false);
  };
  const handleBDToggle = () => {
    props.setbackDropOpen(!props.backDropOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleBDToggle();
    const data = new FormData(event.currentTarget);
    let formData = Object.fromEntries(data.entries());
    formData = { ...formData, type: "normal" };

    axios
      .post("/api/users/sign-up", formData, {
        headers: { "Content-type": "application/json" },
      })
      .then((response) => {
        if (response.status == 200) {
          handleDBClose();
          props.setDialog({
            title: "Congratulations!",
            text: "We have sent you a confirmation email about your account. Please confirm your email, don't forget to check your spam folder.",
            dialogOpen: true,
          });
        }
      })
      .catch((error) => {
        handleDBClose();
        props.setAlert({
          message: error.response.data["detail"],
          type: "error",
          isOpen: true,
        });
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
        .post("/api/users/signup-with-google", backendData)
        .then((r) => {
          props.setbackDropOpen(false);
          props.setAlert({
            isOpen: true,
            message: "You've successfully signed up. You can now sign in.",
            type: "success",
          });
          navigate("/sign-in");
        })
        .catch((e) => {
          props.setbackDropOpen(false);
          let errorDetail: string = "";
          try {
            errorDetail = e.response.data["detail"];
          } catch {
            errorDetail = "An unknown error occurred.";
          }
          props.setAlert({
            isOpen: true,
            message: errorDetail,
            type: "error",
          });
        });
    },
  });

  return (
    <Container component="main" maxWidth="xs">
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
          Sign up
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
          Sign Up with Google
        </Button>
        <Divider sx={{ opacity: "70%", fontSize: "small", width: "100%" }}>
          or sign up manually
        </Divider>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="given-name"
                name="firstName"
                required
                fullWidth
                id="firstName"
                label="First Name"
                autoFocus
                inputProps={{ maxLength: 30 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                inputProps={{ maxLength: 30, minLength: 3 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                type="email"
                inputProps={{ maxLength: 30, minLength: 5 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                inputProps={{ maxLength: 30, minLength: 6 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    value={checkBoxVal}
                    name="email_subscription"
                    id="email_subscription"
                    color="primary"
                    onChange={(e) => {
                      setCheckBoxVal(e.target.checked.toString());
                    }}
                  />
                }
                label="I want to receive inspiration, marketing promotions and updates via email."
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link
                sx={{
                  cursor: "pointer",
                }}
                onClick={() => {
                  navigate("/sign-in");
                }}
                variant="body2"
              >
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
