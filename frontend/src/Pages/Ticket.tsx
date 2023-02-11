import * as React from "react";
import {
  Box,
  Skeleton,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Button,
} from "@mui/material";

import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import Looks3Icon from "@mui/icons-material/Looks3";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";

import { PopUps } from "../App";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  checkIfItemExistsInCache,
  cacheTicketData,
  getCachedData,
  deleteItemFromCachedData,
} from "../Utils/TicketUtils";
import { setActiveTicket } from "../store/ticket/ownerSlice";
import { setBaseInfo } from "../store/ticket/baseInfo";

async function extractQuestions(data: ticketDataType) {
  return {
    Know: data.know,
    "Want to Learn": data.want_to_learn,
    Learned: data.learned,
  };
}

export type ticketDataType = { [key: string]: string };

export default function Ticket(props: PopUps) {
  const [ticketData, setTicketData] = React.useState<ticketDataType>();
  const [questions, setQuestions] = React.useState<ticketDataType>({});

  const navigate = useNavigate();
  const location = useLocation();
  const url_id = location.pathname.split("/").pop();
  const ticket_id = parseInt(url_id!);

  const handleStartTicket = () => {
    props.setbackDropOpen(true);
    axios
      .put("/api/kwl/start-ticket", null, {
        params: { ticket_id },
        headers: {
          Authorization: `Bearer ${props.user.token}`,
        },
      })
      .then((r) => {
        props.dispatch(
          setBaseInfo({
            ticketID: ticket_id,
            pin: r.data["new_pin"],
            uuid: r.data["new_uuid"],
          })
        );
        props.dispatch(
          setActiveTicket({
            topic: ticketData!.topic,
            userID: r.data["user_id"],
          })
        );
        props.setbackDropOpen(false);
        navigate(`/enter?nbd=0&uuid=${r.data["new_uuid"]}`);
      })
      .catch((e) => {
        props.setbackDropOpen(false);
        props.setAlert({
          message: e.response.data["detail"],
          type: "error",
          isOpen: true,
        });
        switch (e.response.status) {
          case 404:
            deleteItemFromCachedData(ticket_id);
            navigate("/");
            break;
          default:
            navigate("/dashboard");
            break;
        }
      });
  };

  React.useEffect(() => {
    checkIfItemExistsInCache(ticket_id).then((itemPresent) => {
      if (!itemPresent) {
        axios
          .post("/api/kwl/get-ticket-info", null, {
            params: { ticket_id },
            headers: {
              Authorization: `Bearer ${props.user.token}`,
            },
          })
          .then((r) => {
            const data: ticketDataType = r.data;
            setTicketData(data);
            cacheTicketData(ticket_id, data);
          })
          .catch((e) => {
            props.setAlert({
              message: e.response.data["detail"],
              type: "error",
              isOpen: true,
            });
            navigate("/dashboard");
          });
      } else {
        getCachedData(ticket_id).then((cachedData) => {
          setTicketData(cachedData as ticketDataType);
        });
      }
    });
  }, []);

  React.useEffect(() => {
    if (ticketData) {
      extractQuestions(ticketData).then((newData) => {
        setQuestions(newData);
      });
      document.title = `Ticket - ${ticketData.topic} - kwl.app`;
    }
  }, [ticketData]);

  const stepIcons = [<LooksOneIcon />, <LooksTwoIcon />, <Looks3Icon />];
  return (
    <Box
      sx={{
        py: 8,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {ticketData ? (
        <>
          <Box sx={{ ml: { md: 20, xs: 1 }, mb: 2, mt: -4 }}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              onClick={() => {
                navigate("/dashboard");
              }}
            >
              {" "}
              Dashboard{" "}
            </Button>
          </Box>

          <Paper
            elevation={2}
            sx={{
              p: 4,
              mx: { md: 20 },
              display: "flex",
              alignItems: "center",
              flexFlow: "column",
              borderRadius: 5,
            }}
          >
            <Typography variant="h4"> {ticketData["topic"]} </Typography>
            <Divider sx={{ mt: 2, width: "70%" }} />
            <List sx={{ mt: 2 }}>
              {Object.keys(questions).map((key, index) => {
                return (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "secondary.main" }}>
                          {stepIcons[index]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={key}
                        secondary={questions[key]}
                      ></ListItemText>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
          <Box
            sx={{
              p: 4,
              mt: 1,
              mx: { md: 20 },
              display: "flex",
              alignItems: "center",
              flexFlow: "column",
              borderRadius: 5,
            }}
          >
            <Button
              disabled={props.ticketOwner.hasActiveTicket}
              onClick={
                props.ticketOwner.hasActiveTicket
                  ? undefined
                  : handleStartTicket
              }
              size="large"
              sx={{ p: 4, borderRadius: 5 }}
              variant="contained"
              endIcon={<PlayCircleOutlineIcon sx={{ width: 48, height: 48 }} />}
            >
              Start the Ticket
            </Button>
          </Box>
        </>
      ) : (
        <Skeleton
          variant="rectangular"
          sx={{
            p: 4,
            mx: { md: 20 },
            display: "flex",
            alignItems: "center",
            flexFlow: "column",
            borderRadius: 5,
          }}
          height={"70vh"}
        />
      )}
    </Box>
  );
}
