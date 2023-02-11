import React, { lazy } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

import {
  Box,
  Paper,
  Typography,
  Skeleton,
  Drawer,
  Divider,
  Button,
  SpeedDial,
} from "@mui/material";
import Masonry from "@mui/lab/Masonry";

const AddIcon = lazy(() => import("@mui/icons-material/Add"));
const SendIcon = lazy(() => import("@mui/icons-material/Send"));
const NotInterestedIcon = lazy(
  () => import("@mui/icons-material/NotInterested")
);

import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";

import { stageType, topicMapping, wsAddress } from "../../Utils/TicketUtils";
import { visitorPropsType } from "../../Pages/EnterTicket";
import { removeActiveTicket } from "../../store/ticket/ownerSlice";
import { resetInfo } from "../../store/ticket/baseInfo";

const OwnerTicketNavBar = lazy(
  () => import("../extraNavBars/ownerTicketNavBar")
);
const ParticipantNavBar = lazy(
  () => import("../extraNavBars/participantNavBar")
);

const Editor = lazy(() => import("../editor/editor"));

import DOMPurify from "dompurify";
import { updateMessages } from "../../store/ticket/baseInfo";
import {
  AllInfo,
  ContentInfo,
  OwnerNavBarProps,
  SpeedDialType,
  StagesInfo,
} from "../../Utils/TicketTypes";

function MainComponent(props: visitorPropsType) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [isOwner, setIsOwner] = React.useState<boolean | undefined>(undefined);
  const [stage, setStage] = React.useState<stageType>(0);
  const [token, setToken] = React.useState<string>();
  const [ws, setWs] = React.useState<WebSocket | undefined>(undefined);
  const [allInfo, setAllInfo] = React.useState<AllInfo>();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState<boolean>(false);
  const [editorContent, setEditorContent] = React.useState<string>("");

  const navigate = useNavigate();
  const uuid = searchParams.get("uuid");

  React.useEffect(() => {
    props.setbackDropOpen(true);

    if (
      props.user.logged_in &&
      props.ticketOwner.userID !== 0 &&
      props.user.id === props.ticketOwner.userID
    ) {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }
    axios
      .post("/api/kwl/token-for-ws", {
        pin: props.ticketBase.pin,
        uuid: uuid,
      })
      .then((r) => {
        const receivedInfo = r.data["data"];

        const stagesInfo = Object.assign({}, receivedInfo);
        delete stagesInfo.ticket_id;
        delete stagesInfo.ticket_stage;

        const receivedMessages = JSON.parse(receivedInfo["messages"]);

        setAllInfo({
          ...allInfo!,
          messages: receivedMessages.reverse(),
          ticketID: receivedInfo["ticket_id"],
          stages: stagesInfo as StagesInfo,
        });
        setStage(receivedInfo["ticket_stage"]);
        setToken(r.data["token"]);
      })
      .catch((e: any) => {
        switch (isOwner) {
          case true:
            const date = new Date();
            const ticketDate = new Date(props.ticketOwner.startedDate);
            ticketDate.setHours(ticketDate.getHours() + 24);
            if (date > ticketDate) {
              // if the error caused from the fact that the ticket is not valid anymore
              const ticketID = props.ticketBase.ticketID;
              axios
                .put("/api/kwl/extend-ticket-duration", null, {
                  params: { ticketID },
                  headers: {
                    Authorization: `Bearer ${props.user.token}`,
                  },
                })
                .then(() => {
                  // extend the ticket validation and reload the page.
                  window.location.reload();
                })
                .catch((e) => {
                  props.setAlert({
                    message: e.response.data["detail"],
                    type: "error",
                    isOpen: true,
                  });
                  navigate("/");
                });
            } else {
              props.dispatch(resetInfo());
              props.dispatch(
                removeActiveTicket({
                  token: props.user.token,
                  ticketID: props.ticketBase.ticketID,
                  uuid: props.ticketBase.uuid,
                })
              );
              props.setAlert({
                message: "Ticket expired. Please set the ticket active again.",
                type: "error",
                isOpen: true,
              });
              props.setbackDropOpen(false);
              navigate("/dashboard");
            }
            break;
          default:
            props.dispatch(resetInfo());
            props.setAlert({
              message: e.response.data["detail"],
              type: "error",
              isOpen: true,
            });
            navigate("/enter");
            props.setbackDropOpen(false);
            break;
        }
      });
  }, []);

  React.useEffect(() => {
    if (token) {
      var ws = new WebSocket(wsAddress + uuid + "?token=" + token);

      ws.onopen = () => {
        props.setbackDropOpen(false);
      };

      ws.onclose = () => {
        shutDownConnection();
      };

      ws.onerror = (e) => {
        props.setAlert({
          message: "An error occurred",
          type: "error",
          isOpen: true,
        });
        navigate("/enter");
      };

      ws.onmessage = (e) => {
        const receivedMessage = JSON.parse(e.data);
        if (
          Object.keys(receivedMessage).includes(
            process.env.REACT_APP_KWL_COMMAND!
          )
        ) {
          const command = receivedMessage[process.env.REACT_APP_KWL_COMMAND!];

          switch (Object.keys(command)[0]) {
            case process.env.REACT_APP_KWL_SR:
              setStage(command[process.env.REACT_APP_KWL_SR!] as stageType);
              props.setbackDropOpen(false);
              break;

            case process.env.REACT_APP_KWL_SD:
              shutDownConnection();
              break;
          }
        } else {
          const receivedMessage = JSON.parse(e.data) as ContentInfo;
          const currentMessages = allInfo!.messages;
          let index = currentMessages.findIndex(
            (x) => x.messageID === receivedMessage.messageID
          );

          if (index === -1) {
            // if there's no duplicates.
            // store the message id
            props.dispatch(updateMessages({ id: receivedMessage.messageID }));
            // update the room's messages
            currentMessages.push(receivedMessage);
            setAllInfo({
              ...allInfo!,
              messages: currentMessages.reverse() as Array<ContentInfo>,
            });
          }
        }
      };
      setWs(ws);
      searchParams.set("nbd", props.user.logged_in && !isOwner ? "1" : "0");
      setSearchParams(searchParams);
    }
  }, [token]);

  const broadcastMessage = () => {
    props.setbackDropOpen(true);
    const newMessage = {
      content: editorContent,
      user_id: props.user.id ? props.user.id : null,
      stage: stage,
      name_and_surname: props.user.logged_in
        ? null
        : props.visitor.firstnameAndSurname,
      ticket_id: allInfo!.ticketID,
    };

    axios
      .post("/api/kwl/message-for-ws", newMessage, {
        headers: { "Content-type": "application/json" },
      })
      .then((r) => {
        props.setbackDropOpen(false);
        const receivedMessage = r.data;
        ws!.send(JSON.stringify(receivedMessage));

        setIsDrawerOpen(false);
        setEditorContent("");
      })
      .catch((e) => {
        props.setAlert({
          message: e.response.data["detail"],
          type: "error",
          isOpen: true,
        });
      });
  };

  function shutDownConnection() {
    props.dispatch(resetInfo());

    const navigateTo = isOwner ? "/dashboard" : "/enter";

    props.setAlert({
      message: "Connection closed.",
      type: "error",
      isOpen: true,
    });

    try {
      ws!.close();
    } catch {
      // the connection might already be closed, so pass.
    }
    props.setbackDropOpen(false);
    navigate(navigateTo);
  }

  function getOwnerNavBarProps(): OwnerNavBarProps {
    return {
      pin: props.ticketBase.pin,
      stage: stage,
      ws: ws!,
      setbackDropOpen: props.setbackDropOpen,
      dialog: props.dialog,
      setDialog: props.setDialog,
      ticketID: props.ticketBase.ticketID,
      token: props.user.token,
    };
  }

  const speedDialActions: Array<SpeedDialType> = [
    {
      name: "New Message",
      callback: () => {
        setIsDrawerOpen(true);
      },
      icon: <AddIcon />,
    },
    {
      name: "Disconnect From the Ticket",
      callback: () => {
        props.setDialog({
          dialogOpen: true,
          title: "Are you sure?",
          defaultButton: {
            buttonText: "Cancel",
          },
          text: "Are you sure of disconnecting? You need to enter the PIN to connect to this ticket again.",
          extraButton: {
            func: async () => {
              props.setDialog({ dialogOpen: false });
              shutDownConnection();
            },
            buttonText: "Disconnect",
          },
        });
      },
      icon: <NotInterestedIcon />,
    },
  ];

  return (
    <React.Fragment>
      {props.user.logged_in ? (
        isOwner ? (
          <OwnerTicketNavBar {...getOwnerNavBarProps()} />
        ) : (
          <></>
        )
      ) : (
        <ParticipantNavBar disconnectFunc={shutDownConnection} />
      )}

      {allInfo?.messages ? (
        <Box sx={{ minHeight: "80vh", p: { md: 4, xs: 2 } }}>
          <Box
            component={Paper}
            elevation={2}
            sx={{
              bgcolor: "#ffa73b",
              borderRadius: 3,
              paddingLeft: 2,
              paddingBottom: 1,
              mb: 2,
              color: "#fff",
            }}
          >
            <Typography variant="caption">Question</Typography>
            <Typography variant="h4">
              {allInfo?.stages[topicMapping[stage]]}
            </Typography>
          </Box>
          <Masonry columns={{ md: 4, xs: 1 }} spacing={2}>
            {allInfo.messages.map((message, index) => {
              if (message.stage === stage) {
                return (
                  <Paper
                    sx={{
                      px: 2,
                      pb: 2,
                      borderRadius: 3,
                      textRendering: "optimizeLegibility",
                    }}
                    key={index}
                  >
                    <Typography variant="caption">{message.sender}</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <div>
                      {
                        <div
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(message.content),
                          }}
                        />
                      }
                    </div>
                  </Paper>
                );
              }
            })}
          </Masonry>
        </Box>
      ) : (
        <Skeleton
          variant="rectangular"
          sx={{
            p: 4,
            mt: 4,
            mx: { md: 20 },
            display: "flex",
            alignItems: "center",
            flexFlow: "column",
            borderRadius: 5,
          }}
          height={"70vh"}
        />
      )}
      {!isOwner && (
        <>
          <Drawer
            anchor="bottom"
            open={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(!isDrawerOpen);
            }}
          >
            <Box sx={{ p: { md: 4, xs: 2 } }}>
              <Editor
                editorContent={editorContent}
                setEditorContent={setEditorContent}
              />
              <Button
                disabled={
                  editorContent.length < 800 && editorContent.length > 0
                    ? false
                    : true
                }
                endIcon={<SendIcon />}
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={broadcastMessage}
              >
                Send Message
              </Button>
            </Box>
          </Drawer>
          <SpeedDial
            ariaLabel="Interact with the ticket"
            sx={{
              position: "fixed",
              bottom: 30,
              right: 30,
              // height: { md: 72, xs: 60 },
              // width: { md: 72, xs: 60 },
            }}
            icon={<SpeedDialIcon />}
          >
            {speedDialActions.map((action, index) => (
              <SpeedDialAction
                key={index}
                icon={action.icon}
                tooltipTitle={action.name}
                onClick={action.callback}
              />
            ))}
          </SpeedDial>
        </>
      )}
    </React.Fragment>
  );
}

export default MainComponent;
