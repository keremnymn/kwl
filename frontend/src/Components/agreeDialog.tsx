import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export interface dialogContent {
  dialogOpen: boolean;
  title?: string;
  text?: string;
  notClosable?: boolean;
  defaultButton?: {
    buttonText: string;
    func?(): Promise<void>;
  };
  extraButton?: {
    func(): Promise<void>;
    buttonText: string;
  };
  navigate?: string;
}

export default function AgreeDialog({
  message,
  setDialog,
}: {
  message: dialogContent;
  setDialog: Function;
}) {
  const navigate = useNavigate();

  const handleClose = () => {
    switch (message.notClosable) {
      case true:
        // pass
        break;
      default:
        if (message.navigate) {
          navigate(message.navigate);
        }
        setDialog({ ...message, dialogOpen: false });
        break;
    }
  };
  const forceClose = () => {
    if (message.defaultButton?.func) {
      message.defaultButton.func();
    }
    setDialog({ ...message, dialogOpen: false });
  };
  return (
    <div>
      <Dialog
        open={message.dialogOpen}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{message.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {message.text}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={message.notClosable ? forceClose : handleClose}
            autoFocus
          >
            {message.defaultButton
              ? message.defaultButton.buttonText
              : "I Understand"}
          </Button>
          {message.extraButton && (
            <Button onClick={message.extraButton?.func}>
              {" "}
              {message.extraButton.buttonText}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}
