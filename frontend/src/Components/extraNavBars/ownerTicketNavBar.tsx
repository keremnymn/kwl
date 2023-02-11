import React, { lazy } from "react";
import {
  AppBar,
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
const NavigateNextIcon = lazy(() => import("@mui/icons-material/NavigateNext"));
const NavigateBeforeIcon = lazy(
  () => import("@mui/icons-material/NavigateBefore")
);

import { stageType } from "../../Utils/TicketUtils";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import { OwnerNavBarProps } from "../../Utils/TicketTypes";

type QuestionAction = {
  type: "increment" | "decrement";
};

function OwnerTicketNavBar(props: OwnerNavBarProps) {
  const [firstPart, secondPart] = [
    props.pin.toString().slice(0, 3),
    props.pin.toString().slice(3),
  ];
  const newPin = firstPart + " " + secondPart;
  const navigate = useNavigate();

  function dispatchStageRequest(newStage: number) {
    axios
      .put("/api/kwl/change-stage", null, {
        params: {
          ticketID: props.ticketID,
          newStage: newStage,
        },
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      })
      .then((r) => {
        const stageRequest = JSON.stringify({
          [process.env.REACT_APP_KWL_COMMAND!]: {
            [process.env.REACT_APP_KWL_SR!]: newStage,
          },
        });
        props.ws.send(stageRequest);
      });
  }

  function handleQuestionChange(receivedAction: QuestionAction) {
    props.setbackDropOpen(true);
    let newStage: stageType;

    switch (receivedAction.type) {
      case "increment":
        newStage = Math.min(props.stage + 1, 2) as stageType;
        break;
      case "decrement":
        newStage = Math.max(0, props.stage - 1) as stageType;
        break;
    }
    switch (newStage) {
      case 2:
        props.setDialog({
          dialogOpen: true,
          notClosable: true,
          title: "Are you sure?",
          defaultButton: {
            buttonText: "Cancel",
            func: async () => {
              props.setbackDropOpen(false);
            },
          },
          text: "This stage is usually after the presentation or the lesson is finished. Are you sure you want to switch to this stage?",
          extraButton: {
            func: async () => {
              dispatchStageRequest(newStage);
              props.setDialog({
                ...props.dialog,
                dialogOpen: false,
              });
            },
            buttonText: "Continue",
          },
        });
        break;
      default:
        dispatchStageRequest(newStage);
        break;
    }
  }

  return (
    <AppBar
      color="transparent"
      position="static"
      sx={{
        display: "flex",
        flexDirection: { md: "row", xs: "column" },
        p: 2,
        justifyContent: "space-between",
      }}
      elevation={0}
    >
      <Button
        variant="contained"
        onClick={() => {
          navigate("/dashboard");
        }}
      >
        Dashboard
      </Button>
      <Typography
        variant="h5"
        sx={{ my: { xs: 2, md: 0 }, textAlign: "center" }}
      >
        Go to <strong>"kwl.app/enter"</strong> and use this pin:{" "}
        <strong>{newPin}</strong>
      </Typography>
      <Box
        component={Paper}
        elevation={2}
        sx={{
          bgcolor: "#ffa73b",
          borderRadius: 2,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconButton
          sx={{ color: "#fff" }}
          disabled={props.stage === 0 ? true : false}
          onClick={() => {
            handleQuestionChange({ type: "decrement" });
          }}
        >
          <NavigateBeforeIcon />
        </IconButton>
        <Typography sx={{ color: "#fff", mx: 1 }}>Questions</Typography>
        <IconButton
          sx={{ color: "#fff" }}
          disabled={props.stage === 2 ? true : false}
          onClick={() => {
            handleQuestionChange({ type: "increment" });
          }}
        >
          <NavigateNextIcon />
        </IconButton>
      </Box>
    </AppBar>
  );
}

export default OwnerTicketNavBar;
