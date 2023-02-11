import {
  Paper,
  Box,
  Typography,
  Container,
  FormControlLabel,
  Switch,
  Skeleton,
  TextField,
  Button,
} from "@mui/material";
import React, { lazy } from "react";
import { PopUps } from "../App";

import "../Styles/profile.css";
import { fileChangedHandler } from "../Utils/BaseUtils";
import axios from "axios";
import { setProfileImage } from "../store/auth/authSlice";

const PhotoCameraIcon = lazy(() => import("@mui/icons-material/PhotoCamera"));
const SendIcon = lazy(() => import("@mui/icons-material/Send"));

interface ProfileInfo {
  firstname: string;
  lastname: string;
  email: string;
  created_on: string;
  email_subscription: boolean | string;
}

const defaultImage =
  "https://kwl-app.s3.eu-central-1.amazonaws.com/page-illustrations/default-profile-image.svg";

function Profile(props: PopUps) {
  const previewImage = React.useRef<HTMLImageElement | null>(null);
  const uploadFileButton = React.useRef<HTMLInputElement | null>(null);
  const [profileInfo, setProfileInfo] = React.useState<ProfileInfo | null>(
    null
  );
  const profileForm = React.useRef();
  const [checked, setChecked] = React.useState<boolean | null>(null);

  const formChanged = (e: React.FormEvent<HTMLFormElement>) => {
    const data = new FormData(e.currentTarget);
    let formObject: { [k: string]: any } = Object.fromEntries(data.entries());
    formObject = {
      ...formObject,
      email_subscription: checked ? checked : null,
    };

    const initialForm: { [k: string]: any } = {
      firstname: profileInfo!.firstname,
      lastname: profileInfo!.lastname,
      email_subscription: profileInfo!.email_subscription,
    };
    const toMatch = Object.values(formObject);
    let equal: boolean = true;

    for (let item in toMatch) {
      if (toMatch[item] === Object.values(initialForm)[item]) {
        equal = true;
      } else {
        equal = false;
        break;
      }
    }

    return equal ? null : formObject;
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    props.setbackDropOpen(true);
    const changedForm = formChanged(e);
    if (changedForm) {
      axios
        .put("/api/users/change-profile-info", changedForm, {
          headers: { Authorization: `Bearer ${props.user.token}` },
        })
        .then((r) => {
          props.setbackDropOpen(false);
          setProfileInfo(r.data as ProfileInfo);
          props.setAlert({
            message: "Your profile has been updated successfully.",
            type: "success",
            isOpen: true,
          });
        })
        .catch((e) => {
          props.setbackDropOpen(false);
          props.setAlert({
            message: "An error occurred.",
            type: "error",
            isOpen: true,
          });
        });
    } else {
      props.setbackDropOpen(false);
      props.setAlert({
        message: "You haven't changed anything.",
        type: "info",
        isOpen: true,
      });
    }
  };
  const handleChange = (
    event: React.SyntheticEvent<Element, Event>,
    checked: boolean
  ) => {
    setChecked(checked);
  };

  React.useEffect(() => {
    axios
      .get("/api/users/get-user-info", {
        headers: { Authorization: `Bearer ${props.user.token}` },
      })
      .then((r) => {
        setProfileInfo(r.data[0] as ProfileInfo);
        document.title = `Profile of ${
          (r.data[0] as ProfileInfo).firstname
        } - kwl.app`;
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  return (
    <Container sx={{ mt: 8, minHeight: "50vh" }}>
      <Typography variant="h3">Your Profile</Typography>
      <Paper
        sx={{
          borderRadius: 4,
          mt: 2,
          display: "flex",
          flexDirection: { md: "row", xs: "column" },
        }}
      >
        <Box
          component="form"
          sx={{
            p: 4,
            mr: { md: 4, xs: 0 },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <input
            onChange={(e) => {
              try {
                props.setbackDropOpen(true);
                fileChangedHandler(e, props, previewImage!, defaultImage);
                const imageProps = new FormData();
                imageProps.append("image", e.currentTarget.files![0]);
                imageProps.append(
                  "currentImage",
                  props.user.image_file ? props.user.image_file : "none"
                );
                axios
                  .put("/api/users/change-profile-image", imageProps, {
                    headers: {
                      Authorization: `Bearer ${props.user.token}`,
                    },
                  })
                  .then((r) => {
                    props.dispatch(setProfileImage({ image_file: r.data }));
                    props.setbackDropOpen(false);
                    props.setAlert({
                      message:
                        "Your profile image has been changed successfully.",
                      type: "success",
                      isOpen: true,
                    });
                  })
                  .catch((e) => {
                    (previewImage.current as HTMLImageElement).src = props.user
                      .image_file
                      ? props.user.image_file
                      : defaultImage;
                    props.setbackDropOpen(false);
                    props.setAlert({
                      message: "An error occurred.",
                      type: "error",
                      isOpen: true,
                    });
                    throw e;
                  });
              } catch (e) {
                props.setbackDropOpen(false);
              }
            }}
            ref={uploadFileButton}
            type="file"
            name="mainImage"
            accept="image/*"
            hidden
          />
          <div className="profilepic">
            <img
              ref={previewImage}
              src={props.user.image_file ? props.user.image_file : defaultImage}
              className="profilepic__image"
            />
            <div
              onClick={() => {
                uploadFileButton.current!.click();
              }}
              className="profilepic__content"
            >
              <span className="profilepic__icon">
                <PhotoCameraIcon />
              </span>
              <span className="profilepic__text">Upload a new image</span>
            </div>
          </div>
        </Box>
        {profileInfo ? (
          <Box
            component="form"
            onSubmit={handleFormSubmit}
            ref={profileForm}
            sx={{
              mx: { xs: 4, md: 0 },
              my: 4,
              display: "flex",
              flexDirection: "column",
              alignContent: "start",
              width: { xs: "auto", md: "60%" },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              margin="normal"
              required
              id="firstname"
              label="Name"
              name="firstname"
              defaultValue={profileInfo.firstname}
              inputProps={{ maxLength: 30, minLength: 3 }}
              variant="standard"
            />
            <TextField
              fullWidth
              margin="normal"
              required
              id="lastname"
              label="Surname"
              name="lastname"
              defaultValue={profileInfo.lastname}
              inputProps={{ maxLength: 30, minLength: 3 }}
              variant="standard"
            />
            <TextField
              fullWidth
              margin="normal"
              type="email"
              id="email"
              label="Email Address"
              disabled
              defaultValue={profileInfo.email}
              variant="standard"
            />
            <FormControlLabel
              name="email_subscription"
              control={
                <Switch
                  defaultChecked={profileInfo.email_subscription ? true : false}
                />
              }
              label="I'd like to subscribe to the newsletter."
              onChange={handleChange}
            />
            <Button
              sx={{ width: "60%" }}
              type="submit"
              variant="contained"
              endIcon={<SendIcon />}
            >
              Submit
            </Button>
          </Box>
        ) : (
          <Skeleton
            variant="rectangular"
            sx={{
              p: 4,
              my: 4,
              mx: { md: 0, xs: 4 },
              width: { md: "75%", sm: "91.5%", xs: "82%" },
              display: "flex",
              alignItems: "center",
              flexFlow: "column",
              borderRadius: 5,
            }}
            height={"30vh"}
          />
        )}
      </Paper>
    </Container>
  );
}

export default Profile;
