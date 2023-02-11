import { Box, Button } from "@mui/material";
import { FormStepsProps } from "../../Pages/CreateForm";
import React from "react";

export default function NotFinishedForm(props: FormStepsProps) {
  return (
    <React.Fragment>
      <Box sx={{ mt: 4, mb: 4, mx: { md: 10, xs: 2 } }}>
        {props.formComponent}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "row", pt: 2, mx: 6 }}>
        <Button color="inherit" onClick={props.handleBack} sx={{ mr: 1 }}>
          Back
        </Button>
        <Box sx={{ flex: "1 1 auto" }} />
        <Button
          type="submit"
          form={`Form${props.steps[props.activeStep].replace(/ /g, "")}`}
        >
          {props.activeStep === props.steps.length - 1 ? "Finish" : "Next"}
        </Button>
      </Box>
    </React.Fragment>
  );
}
