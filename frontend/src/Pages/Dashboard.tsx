import React, { lazy } from "react";
import {
  Typography,
  Container,
  Grid,
  Box,
  Card,
  CardMedia,
  CardContent,
  Button,
  Tooltip,
  IconButton,
} from "@mui/material";
const ConfirmationNumberIcon = lazy(
  () => import("@mui/icons-material/ConfirmationNumber")
);
const PlayArrowIcon = lazy(() => import("@mui/icons-material/PlayArrow"));
const AccessAlarmIcon = lazy(() => import("@mui/icons-material/AccessAlarm"));
const DeleteIcon = lazy(() => import("@mui/icons-material/Delete"));

import axios from "axios";

import { OwnerInfo, removeActiveTicket } from "../store/ticket/ownerSlice";

import { PopUps } from "../App";
import {
  daysBetween,
  getCachedData,
  cacheData,
  updateCachedData,
} from "../Utils/DashboardUtils";
import { AnyAction, Dispatch } from "@reduxjs/toolkit";
import { useNavigate } from "react-router-dom";

async function deleteKwlTicket(
  id: number,
  props: PopUps,
  setDataUpdated: React.Dispatch<React.SetStateAction<boolean>>,
  dataUpdated: boolean,
  ticket: OwnerInfo,
  dispatch: Dispatch<AnyAction>
) {
  axios
    .delete("/api/kwl/delete-ticket", {
      params: { id },
      headers: {
        Authorization: `Bearer ${props.user.token}`,
        "Content-type": "application/json",
      },
    })
    .then(() => {
      if (ticket.hasActiveTicket && id === props.ticketBase.ticketID) {
        dispatch(
          removeActiveTicket({
            token: props.user.token,
            ticketID: props.ticketBase.ticketID,
            uuid: props.ticketBase.uuid,
          })
        );
      }
      updateCachedData().then(void 0);
      setDataUpdated(!dataUpdated);
      props.setDialog({
        ...props.dialog,
        dialogOpen: false,
      });
      props.setAlert({
        isOpen: true,
        message: "The ticket has been deleted.",
      });
    })
    .catch((e) => {
      props.setAlert({
        message: "An error occurred.",
        type: "error",
        isOpen: true,
      });
    });
}

function handleDelete(
  props: PopUps,
  id: number,
  setDataUpdated: React.Dispatch<React.SetStateAction<boolean>>,
  dataUpdated: boolean,
  dispatch: Dispatch<AnyAction>
) {
  props.setDialog({
    title: "Are you sure?",
    text: "You are about to delete this KWL ticket. You should know that you can't undo this action. Are you sure of deleting this?",
    defaultButton: { buttonText: "Cancel" },
    dialogOpen: true,
    extraButton: {
      buttonText: "Delete The Ticket",
      func: async () => {
        deleteKwlTicket(
          id,
          props,
          setDataUpdated,
          dataUpdated,
          props.ticketOwner,
          dispatch
        ).then(void 0);
      },
    },
  });
}

function Dashboard(props: PopUps) {
  const [data, setData] = React.useState([]);
  const [dataUpdated, setDataUpdated] = React.useState(false);

  const navigate = useNavigate();

  const emptyImage =
    "https://kwl-app.s3.eu-central-1.amazonaws.com/page-illustrations/undraw_passing_by_0un9.svg";

  function handleStartTicket(id: number) {
    navigate(`/ticket/${id}`);
  }

  React.useEffect(() => {
    document.title = `Dashboard - kwl.app`;
    const cachedData = getCachedData();

    if (!cachedData) {
      axios
        .get("/api/kwl/get-tickets", {
          headers: {
            Authorization: `Bearer ${props.user.token}`,
          },
        })
        .then((r) => {
          let data = r.data;
          const today: number = +new Date();
          for (const item in data) {
            if (data[item]["remind_date"] !== null) {
              data[item]["remind_date"] = daysBetween(
                Date.parse(data[item]["remind_date"]),
                today
              );
            }
          }
          setData(data);
          cacheData(data).then(void 0);
        })
        .catch((e) => {
          props.setAlert({
            message: e.response.data["detail"],
            type: "error",
            isOpen: true,
          });
          setData([]);
        });
    } else {
      const rawData = window.localStorage.getItem("dashboardData");
      if (rawData) {
        const serializedData = JSON.parse(rawData);
        setData(serializedData["data"]);
      }
    }
  }, [dataUpdated]);

  return (
    <Container sx={{ mt: 4, minHeight: "70vh" }}>
      {data.length ? (
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h3" sx={{ my: 4 }}>
            Tickets You've Created
          </Typography>
          <Grid container spacing={3} columns={4}>
            {data.map((item, index) => {
              return (
                <Grid item xs={4} sm={4} md={2} key={index}>
                  <Card sx={{ borderRadius: 5, px: 3, pt: 2 }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          px: 1,
                        }}
                      >
                        <Typography variant="h6">{item["topic"]}</Typography>
                        {item["remind_date"] && (
                          <Tooltip
                            title={`Remind in ${item["remind_date"]} days`}
                          >
                            <AccessAlarmIcon sx={{ p: 0 }} />
                          </Tooltip>
                        )}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Tooltip title={"Start the ticket"}>
                          <IconButton
                            onClick={() => {
                              handleStartTicket(item["id"]);
                            }}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={"Delete the ticket"}>
                          <IconButton
                            onClick={() => {
                              handleDelete(
                                props,
                                item["id"],
                                setDataUpdated,
                                dataUpdated,
                                props.dispatch
                              );
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ) : (
        <Card
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: { md: "space-between" },
            borderRadius: 5,
          }}
        >
          <Box
            sx={{
              p: { md: 4, xs: 3 },
              display: "flex",
              flexDirection: "column",
              justifyContent: { md: "center" },
            }}
          >
            <Typography variant="h2" sx={{ textAlign: "center" }}>
              No Tickets Yet?
            </Typography>
            <Typography
              variant="caption"
              sx={{ mt: 2, fontSize: { xs: "16px" } }}
            >
              You can create a new KWL ticket in two minutes.
            </Typography>
            <Button
              startIcon={<ConfirmationNumberIcon sx={{ mb: 0.2 }} />}
              variant="contained"
              sx={{ mt: 5 }}
              onClick={() => {
                navigate("/create-form");
              }}
            >
              Create A New KWL Ticket
            </Button>
          </Box>
          <CardMedia
            component="img"
            sx={{ width: { md: 400, xs: 300 }, py: { xs: 4 } }}
            image={emptyImage}
            loading="lazy"
            alt="Create A KWL Ticket"
          />
        </Card>
      )}
    </Container>
  );
}

export default Dashboard;
