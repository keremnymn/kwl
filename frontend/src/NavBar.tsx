import React, { lazy } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
} from "@mui/material";

const Logo = lazy(() => import("./Components/navBarComponents/logo"));
const LogoSmall = lazy(() => import("./Components/navBarComponents/logoSmall"));

const MenuIcon = lazy(() => import("@mui/icons-material/Menu"));
const LoginIcon = lazy(() => import("@mui/icons-material/Login"));
const DashboardIcon = lazy(() => import("@mui/icons-material/Dashboard"));
const DoDisturbIcon = lazy(() => import("@mui/icons-material/DoDisturb"));
const ConfirmationNumberIcon = lazy(
  () => import("@mui/icons-material/ConfirmationNumber")
);
const PinIcon = lazy(() => import("@mui/icons-material/Pin"));
const AddIcon = lazy(() => import("@mui/icons-material/Add"));
const ClassIcon = lazy(() => import("@mui/icons-material/Class"));

import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { handleLogOut } from "./Utils/UserUtils";
import { User } from "./store/auth/authSlice";
import { OwnerInfo, removeActiveTicket } from "./store/ticket/ownerSlice";
import { truncateString } from "./Utils/BaseUtils";
import { BaseInfo } from "./store/ticket/baseInfo";

export type PageClickProps = (route: string) => void;
type menuItemValueType = {
  child: JSX.Element;
  callback: PageClickProps;
  route: string;
};
export type menuItemType = { [key: string]: menuItemValueType };

const ResponsiveAppBar = ({
  user,
  ticketOwner,
  ticketBase,
}: {
  user: User;
  ticketOwner: OwnerInfo;
  ticketBase: BaseInfo;
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleRemoveTicket = () => {
    dispatch(
      removeActiveTicket({
        token: user.token,
        ticketID: ticketBase.ticketID,
        uuid: ticketBase.uuid,
      })
    );
  };

  const location = useLocation();
  let nextUrl = searchParams.get("next")
    ? searchParams.get("next")
    : location.pathname + location.search;

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();

    handleLogOut(dispatch, user.token, ticketBase);
    setTimeout(() => {
      navigate("/");
    }, 100);
  };

  const handlePageClick: PageClickProps = (route: string) => {
    handleCloseNavMenu();
    setTimeout(() => {
      navigate(route);
    }, 100);
  };

  const pages = React.useMemo<menuItemType>(() => {
    let currentPages: menuItemType = {
      Connect: {
        child: <PinIcon />,
        callback: handlePageClick,
        route: "/enter",
      },
      Blog: {
        child: <ClassIcon />,
        callback: handlePageClick,
        route: "/blog",
      },
    };
    switch (user.logged_in) {
      case true:
        currentPages = {
          ...currentPages,
          "New Ticket": {
            child: <ConfirmationNumberIcon />,
            callback: handlePageClick,
            route: "/create-form",
          },
          Dasboard: {
            child: <DashboardIcon />,
            callback: handlePageClick,
            route: "/dashboard",
          },
        };
        if (
          process.env.REACT_APP_ADMINS!.split(",").includes(user.id.toString())
        ) {
          currentPages = {
            ...currentPages,
            "New Article": {
              child: <AddIcon />,
              callback: handlePageClick,
              route: "/new-article",
            },
          };
        }
        break;
    }
    return currentPages;
  }, [user.logged_in]);

  const settings = {
    Profile: () => {
      handleCloseUserMenu();
      setTimeout(() => {
        navigate("/profile");
      }, 100);
    },
    Logout: handleLogout,
  };

  return (
    <Box
      sx={{
        display: searchParams.get("nbd") === "0" ? "none" : undefined,
      }}
    >
      {ticketOwner.hasActiveTicket &&
        location.pathname + location.search !==
          `/enter?nbd=0&uuid=${ticketBase.uuid}` && (
          <AppBar
            sx={{
              bgcolor: "#def7e5",
              display: "flex",
              flexDirection: { md: "row", sx: "column" },
              justifyContent: { md: "center" },
              alignItems: { xs: "center" },
              py: 2,
            }}
            position="static"
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle1" sx={{ color: "#000" }}>
                You have an active ticket
              </Typography>
              <Button
                onClick={() => {
                  navigate(`/enter?nbd=0&uuid=${ticketBase.uuid}`);
                }}
                variant="contained"
              >
                {truncateString(ticketOwner.ticketTopic)}
              </Button>
            </Box>
            <Box>
              <Button
                sx={{
                  ml: { md: 4 },
                  bgcolor: "error.main",
                  mt: { xs: 2, md: 0 },
                }}
                size="small"
                variant="contained"
                endIcon={<DoDisturbIcon />}
                onClick={handleRemoveTicket}
              >
                Set Ticket Inactive
              </Button>
            </Box>
          </AppBar>
        )}
      <AppBar color="primary" position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
            <Logo />
            <Box
              sx={{ display: { xs: "flex", md: "none" }, flexGrow: { xs: 1 } }}
            >
              <IconButton
                size="large"
                aria-label="nav bar items"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: "block", md: "none" },
                }}
              >
                {Object.entries(pages).map(([key, value]) => {
                  return (
                    <MenuItem
                      key={key}
                      component={Button}
                      startIcon={value.child}
                      onClick={() => {
                        value.callback(value.route);
                      }}
                      color="inherit"
                      sx={{ px: 2, borderRadius: 2 }}
                    >
                      {key}
                    </MenuItem>
                  );
                })}
              </Menu>
            </Box>
            <LogoSmall />
            <Box sx={{ flexGrow: 200, display: { xs: "none", md: "flex" } }}>
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
            {user.logged_in ? (
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar>{user.email.slice(0, 1).toUpperCase()}</Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  {Object.entries(settings).map(([key, value]) => {
                    return (
                      <MenuItem
                        key={key}
                        onClick={() => {
                          // ileride hepsi function olcak.
                          if (typeof value !== "string") {
                            value();
                          } else {
                            handleCloseUserMenu;
                          }
                        }}
                      >
                        <Typography textAlign="center">{key}</Typography>
                      </MenuItem>
                    );
                  })}
                </Menu>
              </Box>
            ) : (
              <Button
                color="inherit"
                variant="text"
                endIcon={<LoginIcon />}
                onClick={() => {
                  let navUrl = nextUrl
                    ? `/sign-in?next=${nextUrl}`
                    : "/sign-in";
                  navigate(navUrl);
                }}
              >
                Sign In
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
};
export default ResponsiveAppBar;
