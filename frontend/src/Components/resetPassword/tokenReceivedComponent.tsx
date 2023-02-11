import React from "react";
import {
  Avatar,
  Button,
  TextField,
  Box,
  Typography,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { resetPasswordTokenProps } from "../../Pages/ResetPassword";
import axios from "axios";
import { GoogleReCaptcha } from "react-google-recaptcha-v3";

interface resetPasswordValuesType {
  password?: string;
  showPassword: boolean[];
  passwords: string[];
  errorText: string;
}

export default function TokenReceivedComponent(props: resetPasswordTokenProps) {
  const token = props.token;
  const [recaptchaValidity, setRecaptchaValidity] = React.useState(false);
  const [resetPasswordValues, setResetPasswordValues] =
    React.useState<resetPasswordValuesType>({
      showPassword: [false, false],
      passwords: ["", ""],
      errorText:
        "Passwords should match and the password length must be between 5 and 30.",
    });

  React.useEffect(() => {
    props.setbackDropOpen(false);

    const errorDialog = {
      dialogOpen: true,
      title: "Invalid Token",
      text: "Your token has expired, please send another password reset request.",
    };

    axios
      .post(
        "/api/users/check-reset-password",
        { token: token },
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      .then((r) => {
        props.setUserEmail(r.data);
        props.setbackDropOpen(false);
      })
      .catch(() => {
        props.setbackDropOpen(false);
        props.setDialog(errorDialog);
        props.setParams("");
      });
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    props.setbackDropOpen(true);

    const data = new FormData(event.currentTarget);
    let formObject = Object.fromEntries(data.entries());
    const formData = {
      form_data: formObject,
      token: { token: token },
    };

    axios
      .post("/api/users/reset-password", formData, {
        headers: { "Content-type": "application/json" },
      })
      .then(() => {
        props.setbackDropOpen(false);
        // state.setParams("");
        props.setDialog({
          title: "Password Changed",
          text: "You have changed your password successfully. You can now sign in.",
          dialogOpen: true,
          navigate: "/sign-in",
        });
      })
      .catch((e) => {
        props.setbackDropOpen(false);
        props.setAlert({
          message: e.response.data["detail"],
          type: "error",
          isOpen: true,
        });
        props.setParams("");
      });
  };

  const handlePasswordVisibility = (id: number) => {
    let newValues = resetPasswordValues.showPassword;
    newValues[id] = !newValues[id];
    setResetPasswordValues((prevState) => ({
      ...prevState,
      showPassword: newValues,
    }));
  };

  const handlePasswordChange = (
    passwordValue: React.ChangeEvent<HTMLInputElement>,
    passwordIndex: number
  ) => {
    let newValues = resetPasswordValues.passwords;
    newValues[passwordIndex] = passwordValue.target.value;
    setResetPasswordValues((prevState) => ({
      ...prevState,
      passwords: newValues,
    }));
  };

  const checkPasswordsMatches = () => {
    const [password0, password1] = [
      resetPasswordValues.passwords[0],
      resetPasswordValues.passwords[1],
    ];
    if (
      password0 === password1 &&
      recaptchaValidity &&
      (password0.length, password1.length) >= 6 &&
      (password0.length, password1.length) <= 30
    ) {
      return true;
    } else {
      return false;
    }
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
        Enter Your New Password
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          disabled
          fullWidth
          id="email"
          value={props.userEmail}
          name="email"
          type="email"
          inputProps={{ maxLength: 30, minLength: 5 }}
        />
        <FormControl sx={{ my: 1, width: "100%" }} variant="outlined">
          <InputLabel htmlFor="password0">New Password</InputLabel>
          <OutlinedInput
            type={resetPasswordValues.showPassword[0] ? "text" : "password"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handlePasswordChange(e, 0);
            }}
            required
            fullWidth
            id="password0"
            label="New Password"
            name="password0"
            autoFocus
            inputProps={{ maxLength: 30, minLength: 6 }}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => {
                    handlePasswordVisibility(0);
                  }}
                  onMouseDown={() => {
                    handlePasswordVisibility(0);
                  }}
                  edge="end"
                >
                  {resetPasswordValues.showPassword[0] ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
        <FormControl sx={{ my: 1, width: "100%" }} variant="outlined">
          <InputLabel htmlFor="password1">Retype Password</InputLabel>
          <OutlinedInput
            type={resetPasswordValues.showPassword[1] ? "text" : "password"}
            required
            fullWidth
            id="password1"
            label="Retype Password"
            name="password1"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handlePasswordChange(e, 1);
            }}
            inputProps={{ maxLength: 30, minLength: 6 }}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => handlePasswordVisibility(1)}
                  onMouseDown={() => handlePasswordVisibility(1)}
                  edge="end"
                >
                  {resetPasswordValues.showPassword[1] ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            }
          />
          {!checkPasswordsMatches() && (
            <FormHelperText error id="password1-error">
              {resetPasswordValues.errorText}
            </FormHelperText>
          )}
        </FormControl>
        <Button
          disabled={!checkPasswordsMatches()}
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
}
