import React, { lazy, Suspense } from "react";
import {
  Button,
  Box,
  Paper,
  Typography,
  TextField,
  styled,
  Link,
  Container,
} from "@mui/material";

const LoginIcon = lazy(() => import("@mui/icons-material/Login"));
const PersonAddIcon = lazy(() => import("@mui/icons-material/PersonAdd"));

import axios from "axios";
import { useNavigate } from "react-router-dom";

const FormDialog = lazy(() => import("./formDialog"));
import { setVisitorConnected } from "../../store/ticket/visitorSlice";
import { setBaseInfo } from "../../store/ticket/baseInfo";
import { visitorPropsType } from "../../Pages/EnterTicket";

import {
  GoogleReCaptchaProvider,
  GoogleReCaptcha,
} from "react-google-recaptcha-v3";

const Input = styled(TextField)(({ theme }) => ({
  "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
    display: "none",
  },
  "& input[type=number]": {
    MozAppearance: "textfield",
  },
}));

function InitialComponent(props: visitorPropsType) {
  const [recaptchaValidity, setRecaptchaValidity] = React.useState(false);
  const [formDialog, setFormDialog] = React.useState<boolean>(false);
  const [wait, setWait] = React.useState<boolean>(false);
  const [nameSurname, setNameSurname] = React.useState<string>("");

  const navigate = useNavigate();

  React.useEffect(() => {
    if (props.ticketOwner.hasActiveTicket) {
      navigate("/dashboard");
    } else if (props.ticketBase.pin && props.ticketBase.uuid) {
      navigate(`/enter?nbd=0&uuid=${props.ticketBase.uuid}`);
    } else if (!props.user.logged_in && props.visitor.firstnameAndSurname) {
      props.setAlert({
        message: `Welcome back ${props.visitor.firstnameAndSurname}!`,
        type: "success",
        isOpen: true,
      });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !props.user.logged_in &&
      !props.visitor.firstnameAndSurname &&
      !nameSurname
    ) {
      setFormDialog(true);
    } else {
      props.setbackDropOpen(true);
      setWait(true);

      const data = new FormData(e.currentTarget);
      const formData = Object.fromEntries(data.entries());
      axios
        .post("/api/kwl/get-ticket-uuid", formData, {
          headers: { "Content-type": "application/json" },
        })
        .then((r) => {
          props.dispatch(
            setBaseInfo({
              ticketID: r.data["id"],
              pin: formData["pin"],
              uuid: r.data["uuid"],
            })
          );
          props.dispatch(
            setVisitorConnected({
              firstnameAndSurname: nameSurname
                ? nameSurname
                : props.visitor.firstnameAndSurname,
              connectedTimestamp: +new Date(),
            })
          );
          props.setbackDropOpen(false);
          navigate(`/enter?nbd=0&uuid=${r.data["uuid"]}`);
        })
        .catch((e) => {
          setTimeout(() => {
            setWait(false);
          }, 2000);
          props.setbackDropOpen(false);
          switch (e.response.status) {
            case 404:
              props.setAlert({
                message: `Ticket with PIN ${formData.pin} couldn't be found.`,
                type: "error",
                isOpen: true,
              });
              break;
            default:
              props.setAlert({
                message: e.response.data["detail"],
                type: "error",
                isOpen: true,
              });
              break;
          }
        });
    }
  };

  const handleDialogFormSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ): void => {
    e.preventDefault();

    const data = new FormData(e.currentTarget);
    const formData = Object.fromEntries(data.entries());

    props.dispatch(
      setVisitorConnected({
        firstnameAndSurname: formData["firstnameAndSurname"],
      })
    );
    props.setAlert({
      message: `Welcome, ${formData["firstnameAndSurname"]}!`,
      type: "success",
      isOpen: true,
    });
    setNameSurname(formData["firstnameAndSurname"] as string);
  };

  React.useEffect(() => {
    if (nameSurname) {
      setFormDialog(false);
    }
  }, [nameSurname]);

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_SITE_KEY!}>
      <GoogleReCaptcha
        onVerify={(token) => {
          setRecaptchaValidity(true);
        }}
      />
      <Suspense fallback={<></>}>
        <FormDialog
          isOpen={formDialog}
          handleDialogFormSubmit={handleDialogFormSubmit}
          setFormDialog={setFormDialog}
        />
      </Suspense>
      <Container sx={{ minHeight: "70vh" }}>
        <Paper
          sx={{
            p: 8,
            mt: 8,
            mx: { md: 5 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 5,
            bgcolor: "rgb(255,167,59,0.09)",
          }}
        >
          <Typography variant="h3" sx={{ mb: 5, textAlign: "center" }}>
            {!props.user.logged_in &&
            !props.visitor.firstnameAndSurname &&
            !nameSurname
              ? "Welcome to kwl.app!"
              : "Enter the Ticket PIN"}
          </Typography>
          {!props.user.logged_in &&
            !props.visitor.firstnameAndSurname &&
            !nameSurname && (
              <Box sx={{ px: { md: 6 }, textAlign: "center" }}>
                <Typography gutterBottom>
                  We need to know who you are to show your messages to the
                  others. Could you tell us your name?
                </Typography>
                <Typography>
                  Or better, you can{" "}
                  <Link
                    color="#000"
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                      navigate("/sign-up");
                    }}
                  >
                    sign up
                  </Link>{" "}
                  or{" "}
                  <Link
                    color="#000"
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                      navigate("/sign-in");
                    }}
                  >
                    log in
                  </Link>{" "}
                  if you already have an account.
                </Typography>
              </Box>
            )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column" }}
          >
            {(props.user.logged_in ||
              props.visitor.firstnameAndSurname ||
              nameSurname) && (
              <Input
                required
                id="pin"
                label="Enter the ticket pin"
                name="pin"
                type="number"
                autoFocus
                color="error"
              />
            )}

            <Button
              variant="contained"
              type="submit"
              disabled={wait || !recaptchaValidity}
              endIcon={
                !props.user.logged_in &&
                !props.visitor.firstnameAndSurname &&
                !nameSurname ? (
                  <PersonAddIcon />
                ) : wait ? undefined : (
                  <LoginIcon />
                )
              }
              size="large"
              sx={{
                mt: 3,
              }}
            >
              {!props.user.logged_in &&
              !props.visitor.firstnameAndSurname &&
              !nameSurname
                ? "Enter your name"
                : wait
                ? "Please Wait"
                : "Enter"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </GoogleReCaptchaProvider>
  );
}

export default InitialComponent;
