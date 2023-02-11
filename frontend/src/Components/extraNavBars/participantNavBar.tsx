import React from "react";

import { useNavigate } from "react-router-dom";
import { menuItemType, PageClickProps } from "../../NavBar";

import { AppBar, Container, Toolbar, Box, Button } from "@mui/material";

import Logo from "../navBarComponents/logo";
import LogoSmall from "../navBarComponents/logoSmall";

import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ClassIcon from "@mui/icons-material/Class";

function ParticipantNavBar({ disconnectFunc }: { disconnectFunc: () => void }) {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handlePageClick: PageClickProps = (route: string) => {
    navigate(route);
    handleCloseNavMenu();
  };

  const navigate = useNavigate();
  const pages: menuItemType = {
    "Sign Up": {
      child: <GroupAddIcon />,
      callback: handlePageClick,
      route: "/sign-up",
    },
  };

  return (
    <React.Fragment>
      <AppBar color="primary" position="static">
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <Logo />
              <Button
                sx={{ color: "#fff" }}
                variant="text"
                endIcon={<ClassIcon />}
                onClick={() => {
                  navigate("/blog");
                }}
              >
                Blog
              </Button>
            </Box>
            <Box sx={{ order: 2 }}>
              {Object.entries(pages).map(([key, value]) => {
                return (
                  <Button
                    key={key}
                    startIcon={value.child}
                    onClick={() => {
                      value.callback(value.route);
                    }}
                    color="inherit"
                    sx={{ px: 2, borderRadius: 2 }}
                  >
                    {key}
                  </Button>
                );
              })}
            </Box>
            <Box sx={{ order: 1, justifySelf: "start" }}>
              <LogoSmall />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </React.Fragment>
  );
}

export default ParticipantNavBar;
