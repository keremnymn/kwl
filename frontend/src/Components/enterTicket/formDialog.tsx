import React, { lazy } from "react";
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";

const SendIcon = lazy(() => import("@mui/icons-material/Send"));
const LoginIcon = lazy(() => import("@mui/icons-material/Login"));
const CelebrationIcon = lazy(() => import("@mui/icons-material/Celebration"));

import { useNavigate } from "react-router-dom";

export default function FormDialog({
  isOpen,
  handleDialogFormSubmit,
  setFormDialog,
}: {
  isOpen: boolean;
  handleDialogFormSubmit(e: React.FormEvent<HTMLFormElement>): void;
  setFormDialog: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();
  const handleClose = () => {
    setFormDialog(false);
  };
  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Typography component={"span"} variant="h5">
          Welcome! <CelebrationIcon />
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText component={"span"} sx={{ textAlign: "center" }}>
          <Typography>
            Please write your name or surname to begin sending answers to the
            questions.
          </Typography>
          <Typography sx={{ mt: 1, mb: 2 }}>
            <strong>Or, you can sign up to kwl.app</strong> to join us!
          </Typography>
        </DialogContentText>
        <Box component="form" id="nameForm" onSubmit={handleDialogFormSubmit}>
          <TextField
            autoFocus
            id="name"
            autoComplete="name"
            name="firstnameAndSurname"
            label="Your Name and Surname"
            type="text"
            fullWidth
            required
            variant="standard"
            inputProps={{ maxLength: 50, minLength: 3 }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: { md: "space-between", xs: "center" },
        }}
      >
        <Button
          variant="contained"
          onClick={() => {
            navigate("/sign-in");
          }}
          endIcon={<LoginIcon />}
        >
          Or Sign In
        </Button>

        <Button
          type="submit"
          form="nameForm"
          endIcon={<SendIcon />}
          sx={{ order: { xs: 1, md: 2 } }}
        >
          Continue without signing up
        </Button>
      </DialogActions>
    </Dialog>
  );
}
