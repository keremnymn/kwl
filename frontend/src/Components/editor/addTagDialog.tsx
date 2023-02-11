import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  Box,
} from "@mui/material";
import axios from "axios";
import { alertType } from "../customizedSnackbars";
import { OptionsOrGroups, GroupBase } from "react-select";

export interface TagDialogProps {
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tags: OptionsOrGroups<string, GroupBase<string>>;
  setTags: React.Dispatch<
    React.SetStateAction<OptionsOrGroups<string, GroupBase<string>>>
  >;
  setbackDropOpen: React.Dispatch<React.SetStateAction<boolean>>;
  token: string;
  alert: alertType;
  setAlert: React.Dispatch<React.SetStateAction<alertType>>;
}

export default function AddTagDialog(props: TagDialogProps) {
  const handleClose = () => {
    props.setOpen(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleClose();
    props.setbackDropOpen(true);

    const data = new FormData(event.currentTarget);
    let formObject = Object.fromEntries(data.entries());

    const label = (formObject.newTag as string).trim();
    const value = label.toLowerCase().replaceAll(" ", "-");

    let newTag: Object = { label: label, value: value };
    axios
      .post("/api/blog/add-new-tag", newTag, {
        headers: { Authorization: `Bearer ${props.token}` },
      })
      .then((r) => {
        const data = r.data;
        const newTags = { ...props.tags, data };
        // let newTags = props.tags;
        // newTags.push(r.data as OptionProps);
        props.setTags(newTags);
        props.setbackDropOpen(false);
        props.setAlert({
          isOpen: true,
          message: "New tag has been successfully added.",
          type: "success",
        });
      })
      .catch((e) => {
        props.setAlert({
          message: e.response.data["detail"],
          type: "error",
          isOpen: true,
        });
      });
  };
  return (
    <Dialog open={props.isOpen} onClose={handleClose}>
      <DialogTitle>Add A New Tag</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Use the form below to add a new tag.{" "}
          <strong>Please capitalize every word.</strong>
        </DialogContentText>
        <Box component="form" id="tag-form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            margin="dense"
            name="newTag"
            label="New Tag"
            type="text"
            fullWidth
            variant="standard"
            required
            inputProps={{ maxLength: 99 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit" form="tag-form">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
