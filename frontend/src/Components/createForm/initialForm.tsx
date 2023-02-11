import React, { lazy } from "react";
import {
  Button,
  Box,
  Paper,
  Typography,
  TextField,
  Divider,
  Chip,
  Grid,
  Avatar,
} from "@mui/material";
const NavigateNextIcon = lazy(() => import("@mui/icons-material/NavigateNext"));
const NavigateBeforeIcon = lazy(
  () => import("@mui/icons-material/NavigateBefore")
);
const ConfirmationNumberIcon = lazy(
  () => import("@mui/icons-material/ConfirmationNumber")
);

import { FormProps } from "../../Pages/CreateForm";
import { useNavigate } from "react-router-dom";

export default function InitialForm(props: FormProps) {
  const [topic, setTopic] = React.useState(
    "topic" in props.form ? props.form.topic : ""
  );
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    props.updateForm({
      ...props.form,
      ["topic"]: topic,
    });
    props.handleNext();
  };

  return (
    <React.Fragment>
      <Paper
        elevation={2}
        component={Box}
        sx={{
          p: 4,
          mb: 4,
          pb: { md: 10 },
          mx: { md: 10, xs: 2 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 5,
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main", height: 50, width: 50 }}>
          <ConfirmationNumberIcon sx={{ height: 40, width: 40 }} />
        </Avatar>
        <Typography variant="h3" sx={{ textAlign: "center" }}>
          Create A New Ticket
        </Typography>
        <Divider sx={{ mt: 3, mb: 2, width: "100%" }}>
          {topic && <Chip label={`for: ${props.truncateString(topic)}`} />}
        </Divider>
        <Box
          component="form"
          id="topicForm"
          onSubmit={handleSubmit}
          sx={{
            mt: 1,
            display: { md: "flex" },
            flexDirection: { md: "row" },
            gap: { md: 14 },
          }}
        >
          <Grid>
            <Typography gutterBottom sx={{ mt: 2 }}>
              What will this ticket be about?
            </Typography>
            <TextField
              sx={{ width: { xs: "100%", md: "40rem" } }}
              onChange={(e) => {
                setTopic(e.target.value);
              }}
              margin="normal"
              required
              id="topic"
              label="Ticket Topic"
              name="topic"
              defaultValue={topic ? topic : undefined}
              autoFocus
              inputProps={{ maxLength: 50, minLength: 8 }}
            />
          </Grid>
        </Box>
      </Paper>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          p: 4,
          mx: { xs: 0, md: 6 },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<NavigateBeforeIcon />}
          onClick={() => {
            navigate("/dashboard");
          }}
        >
          Dashboard
        </Button>
        <Button
          type="submit"
          form="topicForm"
          variant="contained"
          endIcon={<NavigateNextIcon />}
        >
          Next
        </Button>
      </Box>
    </React.Fragment>
  );
}
