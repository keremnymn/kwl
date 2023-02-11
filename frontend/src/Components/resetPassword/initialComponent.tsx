import React from "react";
import {
  Avatar,
  Button,
  TextField,
  Box,
  Link,
  Typography,
  CircularProgress,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import { GoogleReCaptcha } from "react-google-recaptcha-v3";
import { resetPasswordTokenProps } from "../../Pages/ResetPassword";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function InitialComponent(props: resetPasswordTokenProps) {
  const [recaptchaValidity, setRecaptchaValidity] = React.useState(false);
  const navigate = useNavigate();

  const emailSentDialog = {
    dialogOpen: true,
    title: "Email Sent",
    text: "If the email address you specified exists in our database, you will receive an email to reset your password.",
    navigate: "/sign-in",
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const formData = Object.fromEntries(data.entries());

    axios
      .post("/api/users/reset-password-email", formData, {
        headers: { "Content-Type": "application/json" },
      })
      .then((r) => {
        props.setDialog(emailSentDialog);
      })
      .catch((e) => {
        if (e.response["status"] == 429) {
          props.setAlert({
            message: e.response.data["detail"],
            type: "error",
            isOpen: true,
          });
        } else {
          props.setDialog(emailSentDialog);
        }
      });
  };

  return (
    <Box
      sx={{
        marginTop: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {" "}
      <GoogleReCaptcha
        onVerify={(token) => {
          setRecaptchaValidity(true);
        }}
      />
      <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
        <LockResetIcon />
      </Avatar>
      <Typography component="h1" variant="h5">
        Reset Password
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          defaultValue=""
          name="email"
          autoComplete="email"
          type="email"
          autoFocus
          inputProps={{ maxLength: 30, minLength: 5 }}
        />
        <Button
          type="submit"
          disabled={!recaptchaValidity}
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          {recaptchaValidity ? (
            "Submit"
          ) : (
            <CircularProgress color="secondary" size={24} />
          )}
        </Button>
        <Link
          sx={{
            cursor: "pointer",
          }}
          onClick={() => {
            navigate("/sign-in");
          }}
          variant="body2"
        >
          {"Remember your password? Sign in."}
        </Link>
      </Box>
    </Box>
  );
}
