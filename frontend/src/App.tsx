import React, { lazy, Suspense } from "react";
const NavBar = lazy(() => import("./NavBar"));
const Footer = lazy(() => import("./Footer"));

const SignIn = lazy(() => import("./Pages/SignIn"));
const SignUp = lazy(() => import("./Pages/SignUp"));
const CreateForm = lazy(() => import("./Pages/CreateForm"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const ResetPassword = lazy(() => import("./Pages/ResetPassword"));
const Ticket = lazy(() => import("./Pages/Ticket"));
const EnterTicket = lazy(() => import("./Pages/EnterTicket"));
const NewArticle = lazy(() => import("./Pages/NewArticle"));
const Blog = lazy(() => import("./Pages/Blog"));
const Article = lazy(() => import("./Pages/Article"));
const Profile = lazy(() => import("./Pages/Profile"));
const Home = lazy(() => import("./Pages/Home"));

const ProtectedRoutes = lazy(() => import("./ProtectedRoutes"));
const OnlyNotAuthRoutes = lazy(() => import("./OnlyNotAuthRoutes"));
const AdminRoutes = lazy(() => import("./AdminRoutes"));

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RootState } from "./store/store";
import { useSelector, useDispatch } from "react-redux";
import { User } from "./store/auth/authSlice";
import { OwnerInfo } from "./store/ticket/ownerSlice";
import { BaseInfo } from "./store/ticket/baseInfo";

const AgreeDialog = lazy(() => import("./Components/agreeDialog"));
import { dialogContent } from "./Components/agreeDialog";

const CustomizedSnackbars = lazy(
  () => import("./Components/customizedSnackbars")
);
import { alertType } from "./Components/customizedSnackbars";
import { Backdrop, CircularProgress } from "@mui/material";
import { handleLogOut } from "./Utils/UserUtils";
import { AnyAction, Dispatch } from "@reduxjs/toolkit";

export interface PopUps {
  user: User;
  ticketOwner: OwnerInfo;
  ticketBase: BaseInfo;
  backDropOpen: boolean;
  setbackDropOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dialog: dialogContent;
  setDialog: React.Dispatch<React.SetStateAction<dialogContent>>;
  alert: alertType;
  setAlert: React.Dispatch<React.SetStateAction<alertType>>;
  dispatch: Dispatch<AnyAction>;
}

export const backdropElement = (
  <Backdrop
    open={true}
    sx={{ bgcolor: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
  >
    <CircularProgress color="primary" />
  </Backdrop>
);

async function checkAuthValidation(user: User) {
  if (!user.validUntil) {
    // means pass. because the user is not logged in.
    return true;
  }

  const date = +new Date();
  const validUntil = Date.parse(user.validUntil);
  if (date > validUntil) {
    return false;
  }

  return true;
}

export default function App() {
  const user = useSelector((state: RootState) => state.auth);
  const ticketOwner = useSelector((state: RootState) => state.owner);
  const ticketBaseStore = useSelector((state: RootState) => state.ticketBase);

  const dispatch = useDispatch();
  React.useEffect(() => {
    if (window.location.href?.includes("https://")) {
      import("react-ga4").then((ReactGA) => {
        const trackingID = process.env.REACT_APP_GA_ID!;
        ReactGA.default.initialize(trackingID);
        ReactGA.default.send({
          hitType: "pageview",
          page: window.location.pathname + window.location.search,
        });
      });
    }

    const authValid = checkAuthValidation(user);
    authValid.then((isValid: boolean) => {
      if (!isValid) {
        handleLogOut(dispatch, user.token, ticketBaseStore);
        props.setAlert({
          isOpen: true,
          message: "Your session has expired. Please login again.",
          type: "error",
        });
      }
    });
  }, []);

  const [dialog, setDialog] = React.useState<dialogContent>({
    dialogOpen: false,
  });
  const [alert, setAlert] = React.useState<alertType>({
    isOpen: false,
  });
  const [backDropOpen, setbackDropOpen] = React.useState(false);

  const props: PopUps = {
    user: user,
    ticketOwner: ticketOwner,
    ticketBase: ticketBaseStore,
    dialog: dialog,
    setDialog: setDialog,
    alert: alert,
    setAlert: setAlert,
    backDropOpen: backDropOpen,
    setbackDropOpen: setbackDropOpen,
    dispatch: dispatch,
  };

  return (
    <BrowserRouter>
      <Suspense fallback={<></>}>
        <NavBar
          user={user}
          ticketOwner={ticketOwner}
          ticketBase={ticketBaseStore}
        />
      </Suspense>
      <Suspense fallback={<></>}>
        <CustomizedSnackbars alert={alert} setAlert={setAlert} />
      </Suspense>
      <Suspense fallback={<></>}>
        <AgreeDialog message={dialog} setDialog={setDialog} />
      </Suspense>
      <Suspense fallback={<></>}>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={backDropOpen}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Suspense>

      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={backdropElement}>
              <Home />
            </Suspense>
          }
        ></Route>
        <Route
          path={"/sign-up"}
          element={
            <Suspense fallback={backdropElement}>
              <OnlyNotAuthRoutes
                user={user}
                redirectPath={"/"}
                children={
                  <Suspense fallback={backdropElement}>
                    <SignUp {...props} />
                  </Suspense>
                }
              ></OnlyNotAuthRoutes>
            </Suspense>
          }
        ></Route>
        <Route
          path={"/sign-in"}
          element={
            <Suspense fallback={backdropElement}>
              <OnlyNotAuthRoutes
                user={user}
                redirectPath={"/"}
                children={
                  <Suspense fallback={backdropElement}>
                    <SignIn {...props} />
                  </Suspense>
                }
              ></OnlyNotAuthRoutes>
            </Suspense>
          }
        ></Route>
        <Route
          path={"/create-form"}
          element={
            <Suspense fallback={backdropElement}>
              <ProtectedRoutes
                user={user}
                props={props}
                redirectPath={"/sign-in?next=/create-form"}
                children={
                  <Suspense fallback={backdropElement}>
                    <CreateForm {...props} />
                  </Suspense>
                }
              ></ProtectedRoutes>
            </Suspense>
          }
        ></Route>
        <Route
          path={"/dashboard"}
          element={
            <Suspense fallback={backdropElement}>
              <ProtectedRoutes
                user={user}
                props={props}
                redirectPath={"/sign-in?next=/dashboard"}
                children={
                  <Suspense fallback={backdropElement}>
                    <Dashboard {...props} />
                  </Suspense>
                }
              ></ProtectedRoutes>
            </Suspense>
          }
        ></Route>
        <Route
          path={"/ticket/:id"}
          element={
            <Suspense fallback={backdropElement}>
              <ProtectedRoutes
                user={user}
                props={props}
                redirectPath={"/sign-in?next=/dashboard"}
                children={
                  <Suspense fallback={backdropElement}>
                    <Ticket {...props} />
                  </Suspense>
                }
              ></ProtectedRoutes>
            </Suspense>
          }
        ></Route>
        <Route
          path={"/profile"}
          element={
            <Suspense fallback={backdropElement}>
              <ProtectedRoutes
                user={user}
                props={props}
                redirectPath={"/sign-in?next=/dashboard"}
                children={
                  <Suspense fallback={backdropElement}>
                    <Profile {...props} />
                  </Suspense>
                }
              ></ProtectedRoutes>
            </Suspense>
          }
        ></Route>
        <Route
          path={"/new-article"}
          element={
            <Suspense fallback={backdropElement}>
              <AdminRoutes
                user={user}
                redirectPath={"/"}
                children={
                  <Suspense fallback={backdropElement}>
                    <NewArticle {...props} />
                  </Suspense>
                }
              ></AdminRoutes>
            </Suspense>
          }
        ></Route>
        <Route
          path="/enter"
          element={
            <Suspense fallback={backdropElement}>
              <EnterTicket {...props} />
            </Suspense>
          }
        ></Route>
        <Route
          path="/reset-password"
          element={
            <Suspense fallback={backdropElement}>
              <ResetPassword {...props} />
            </Suspense>
          }
        ></Route>
        <Route
          path="/blog"
          element={
            <Suspense fallback={backdropElement}>
              <Blog {...props} />
            </Suspense>
          }
        ></Route>
        <Route
          path={"/blog/:date/:slug"}
          element={
            <Suspense fallback={backdropElement}>
              <Article {...props} />
            </Suspense>
          }
        ></Route>
      </Routes>
      <Suspense fallback={backdropElement}>
        <Footer />
      </Suspense>
    </BrowserRouter>
  );
}
