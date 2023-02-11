import React from "react";
import {
  Typography,
  TextField,
  Slide,
  Paper,
  Container,
  Box,
} from "@mui/material";

import { FormProps } from "../../Pages/CreateForm";
import { TemplateProps } from "./templateProps";

const FormTemplate = ({
  props,
  templateProps,
}: {
  props: FormProps;
  templateProps: TemplateProps;
}) => {
  const containerRef = React.useRef(null);
  const name = templateProps.name.replace(/ /g, "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    let formObject = Object.fromEntries(data.entries());

    if (!(name in props.form) || formObject[name] !== props.form[name]) {
      props.updateForm({ ...props.form, [name]: formObject[`${name}Value`] });
    }

    props.handleNext();
  };

  return (
    <Box ref={containerRef}>
      <Slide
        in={true}
        direction={props.animationDirection}
        mountOnEnter
        unmountOnExit
        container={containerRef.current}
      >
        <Container component="main" maxWidth="lg">
          <Paper
            elevation={3}
            sx={{
              p: { md: 10, xs: 2 },
              width: { xs: "100%" },
              borderRadius: 5,
            }}
            component="form"
            id={`Form${name}`}
            onSubmit={handleSubmit}
          >
            <Typography
              sx={{ fontWeight: "fontWeightLight", opacity: "70%", mb: 4 }}
              variant="h4"
            >
              {templateProps.question}
            </Typography>

            <TextField
              id={`${name}ID`}
              name={`${name}Value`}
              defaultValue={name in props.form ? props.form[name] : undefined}
              placeholder={templateProps.questionPlaceholder}
              sx={{ width: "100%" }}
              required
              autoFocus
              inputProps={{ minLength: 10, maxLength: 100 }}
            />
          </Paper>
        </Container>
      </Slide>
    </Box>
  );
};

export default FormTemplate;
