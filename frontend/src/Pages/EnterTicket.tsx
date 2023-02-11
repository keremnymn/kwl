import React, { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { PopUps } from "../App";
const InitialComponent = lazy(
  () => import("../Components/enterTicket/initialComponent")
);
const MainComponent = lazy(
  () => import("../Components/enterTicket/mainComponent")
);

import { RootState } from "./../store/store";
import { useSelector } from "react-redux";
import { VisitorInfo } from "../store/ticket/visitorSlice";
import { Skeleton } from "@mui/material";

export interface visitorPropsType extends PopUps {
  visitor: VisitorInfo;
}

const suspenseSkeleton = (
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
);

function EnterTicket(props: PopUps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [component, setComponent] = React.useState<JSX.Element>();

  const visitorStore = useSelector((state: RootState) => state.visitor);

  const uuid = searchParams.get("uuid");

  const visitorProps = (props: PopUps): visitorPropsType => {
    return {
      ...props,
      visitor: { ...visitorStore },
    };
  };

  React.useEffect(() => {
    document.title = `Online - kwl.app`;
    props.setbackDropOpen(true);

    if (
      !uuid &&
      props.user.logged_in &&
      props.user.id === props.ticketOwner.userID
    ) {
      setSearchParams({ nbd: "0", uuid: props.ticketBase.uuid });
    } else if (uuid) {
      setComponent(
        <Suspense fallback={suspenseSkeleton}>
          <MainComponent {...visitorProps(props)} />
        </Suspense>
      );
    } else {
      setComponent(
        <Suspense fallback={suspenseSkeleton}>
          <InitialComponent {...visitorProps(props)} />
        </Suspense>
      );
    }
    props.setbackDropOpen(false);
  }, [searchParams]);

  return <React.Fragment>{component}</React.Fragment>;
}

export default EnterTicket;
