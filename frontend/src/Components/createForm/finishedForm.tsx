import React, { lazy } from "react";
import {
  Typography,
  Box,
  Button,
  Grid,
  Slider,
  Container,
  List,
  Paper,
  Switch,
  FormControlLabel,
  Fade,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
} from "@mui/material";
const RefreshIcon = lazy(() => import("@mui/icons-material/Refresh"));
const AccessAlarmIcon = lazy(() => import("@mui/icons-material/AccessAlarm"));
const ConfirmationNumberIcon = lazy(
  () => import("@mui/icons-material/ConfirmationNumber")
);
import axios from "axios";

import { FormStepsProps } from "../../Pages/CreateForm";
import { updateCachedData } from "../../Utils/DashboardUtils";
import { useNavigate } from "react-router-dom";

const marks = [
  {
    value: 3,
    label: "In 3 day",
  },
  {
    value: 7,
    label: "In 7 days",
  },
  {
    value: 12,
    label: "In 12 days",
  },
];

const originalQuestions = [
  ["Know", "First Step"],
  ["Want To Learn", "Second Step"],
  ["Learned", "Third Step"],
];

export default function FinishedForm(props: FormStepsProps) {
  const [remindDays, setRemindDays] = React.useState<number>(3);
  const [remindSwitch, setremindSwitch] = React.useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = () => {
    props.setbackDropOpen(true);
    let form = props.form;
    if (remindSwitch) {
      form = { ...form, remindDays: remindDays };
    }

    axios
      .post("/api/kwl/add-ticket", form, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.user.token}`,
        },
      })
      .then((r) => {
        props.setbackDropOpen(false);
        updateCachedData().then(void 0);
        props.setAlert({
          message: `KWL Ticket ${props.truncateString?.(
            form.topic
          )} has been created!`,
          type: "success",
          isOpen: true,
        });
        navigate("/dashboard");
      })
      .catch((e) => {
        props.setbackDropOpen(false);
        props.setAlert({
          message: e.response.data["detail"],
          type: "error",
          isOpen: true,
        });
      });
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mb: 8 }}>
      <Paper elevation={2} sx={{ p: 4, mb: 2, borderRadius: 5 }}>
        <Typography variant="caption">Summary of the KWL Ticket for</Typography>
        <Typography variant="h4">{props.form.topic}</Typography>
      </Paper>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          pt: 2,
          mb: 4,
          justifyContent: "space-between",
        }}
      >
        <Button
          startIcon={<RefreshIcon />}
          variant="contained"
          color="secondary"
          onClick={props.handleReset}
        >
          Edit
        </Button>
        <Button
          startIcon={<ConfirmationNumberIcon />}
          variant="contained"
          onClick={handleSubmit}
        >
          Finish
        </Button>
      </Box>
      <List sx={{ mb: 2 }}>
        {Object.keys(props.form)
          .slice(1) // skip the title
          .map((item: string, index: number) => {
            return (
              <>
                <ListItem key={index}>
                  <ListItemText
                    primary={props.truncateString?.(props.form[item], 40)}
                    secondary={originalQuestions[index][0]}
                  />
                  <Typography variant="body2">
                    {originalQuestions[index][1]}
                  </Typography>
                </ListItem>
                <Divider />
              </>
            );
          })}
      </List>
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <Box sx={{ flex: "1 1 auto" }} />
        <FormControlLabel
          control={<Switch />}
          label="Remind Me About The Last Step"
          onChange={(_, val) => {
            setremindSwitch(val);
          }}
        />
      </Box>

      {remindSwitch && (
        <Fade in={remindSwitch}>
          <Paper elevation={2} sx={{ p: 4, mt: 2, borderRadius: 5 }}>
            <Grid
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                <AccessAlarmIcon />
              </Avatar>
              <Typography gutterBottom sx={{ mt: 2 }}>
                When do you want to be reminded about <strong>"Learned"</strong>{" "}
                step?
              </Typography>
              <Slider
                min={1}
                max={15}
                defaultValue={3}
                aria-label="Default"
                valueLabelDisplay="auto"
                marks={marks}
                onChange={(_, value) => {
                  {
                    typeof value === "number" && setRemindDays(value);
                  }
                }}
              />
              <Typography variant="caption" sx={{ mt: 2 }}>
                We'll send you an email in <strong>{remindDays}</strong> days to
                remind you about the last step.
              </Typography>
            </Grid>
          </Paper>
        </Fade>
      )}
    </Container>
  );
}
