import React, { lazy, Suspense } from "react";
import { Box, Stepper, Step, StepLabel, Typography } from "@mui/material";

const FormTemplate = lazy(
  () => import("../Components/createForm/formTemplate")
);
const FinishedForm = lazy(
  () => import("../Components/createForm/finishedForm")
);
const NotFinishedForm = lazy(
  () => import("../Components/createForm/notFinishedForm")
);
const InitialForm = lazy(() => import("../Components/createForm/initialForm"));

import { TemplateProps } from "../Components/createForm/templateProps";
import { backdropElement, PopUps } from "../App";
import { truncateString } from "../Utils/BaseUtils";

export interface FormProps {
  truncateString: Function;
  animationDirection: "left" | "right" | "up" | "down";
  handleNext: VoidFunction;
  form: { [key: string]: string | number };
  updateForm: React.Dispatch<React.SetStateAction<{}>>;
}

export interface FormStepsProps extends PopUps {
  truncateString?: Function;
  form: FormProps["form"];
  formComponent: JSX.Element;
  activeStep: number;
  handleBack: VoidFunction;
  handleReset: VoidFunction;
  steps: string[];
}

const steps = ["Know", "Want to Learn", "Learned"];

export default function CreateForm(props: PopUps) {
  const [activeStep, setActiveStep] = React.useState(-1);
  const [animationDirection, setAnimationDirection] =
    React.useState<FormProps["animationDirection"]>("left");
  const [form, updateForm] = React.useState({});
  const [formTemplates, setFormTemplates] = React.useState<
    Array<TemplateProps>
  >([]);

  React.useEffect(() => {
    import("../jsonFiles/ticketTemplate.json").then((ticketTemplate) => {
      setFormTemplates(ticketTemplate.default);
    });
  }, []);

  const handleNext = () => {
    if (activeStep === -1) {
      setAnimationDirection("right");
      setFormComponent(
        <Suspense fallback={backdropElement}>
          <FormTemplate
            props={initialFormProps}
            templateProps={formTemplates[0]}
            key={0}
          />
        </Suspense>
      );
    } else {
      setAnimationDirection("left");
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  let initialFormProps: FormProps = {
    truncateString: truncateString,
    animationDirection: animationDirection,
    handleNext: handleNext,
    form: form,
    updateForm: updateForm,
  };

  const [formComponent, setFormComponent] = React.useState(
    <Suspense fallback={backdropElement}>
      <FormTemplate
        props={initialFormProps}
        templateProps={formTemplates[0]}
        key={0}
      />
    </Suspense>
  );

  React.useEffect(() => {
    document.title = `Create A New Ticket - kwl.app`;
    const templateProps = formTemplates[activeStep];
    setFormComponent(
      <Suspense fallback={backdropElement}>
        <FormTemplate
          props={initialFormProps}
          templateProps={templateProps as unknown as TemplateProps}
          key={activeStep}
        />
      </Suspense>
    );
  }, [activeStep]);

  const handleBack = () => {
    if (activeStep === -1) {
      setFormComponent(
        <Suspense fallback={backdropElement}>
          <InitialForm {...initialFormProps} />
        </Suspense>
      );
    } else {
      setAnimationDirection("right");
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const handleReset = () => {
    setActiveStep(-1);
  };

  const changeComponent = (): JSX.Element => {
    let formProps = (props: PopUps): FormStepsProps => {
      return {
        ...props,
        form: form,
        truncateString: truncateString,
        formComponent: formComponent,
        activeStep: activeStep,
        handleBack: handleBack,
        handleReset: handleReset,
        steps: steps,
      };
    };

    if (activeStep === -1) {
      return (
        <Suspense fallback={backdropElement}>
          <InitialForm {...initialFormProps} />
        </Suspense>
      );
    } else if (activeStep === steps.length) {
      return (
        <Suspense fallback={backdropElement}>
          <FinishedForm {...formProps(props)} />
        </Suspense>
      );
    } else {
      return (
        <Suspense fallback={backdropElement}>
          <NotFinishedForm {...formProps(props)} />
        </Suspense>
      );
    }
  };

  return (
    <Box
      sx={{
        marginTop: 4,
        px: { xs: 1, md: 6 },
        width: "100%",
        minHeight: "70vh",
      }}
    >
      {activeStep > -1 && activeStep !== steps.length && (
        <>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Typography variant="caption">
              Let's create a KWL ticket for {(form as any).topic}
            </Typography>
          </Box>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => {
              const stepProps: { completed?: boolean } = {};
              return (
                <Step key={label} {...stepProps}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </>
      )}

      {changeComponent()}
    </Box>
  );
}
