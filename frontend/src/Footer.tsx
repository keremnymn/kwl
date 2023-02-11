import React, { lazy } from "react";
import { Box, Button, Typography, Divider, Link } from "@mui/material";

const Logo = lazy(() => import("./Components/navBarComponents/logo"));
const LogoSmall = lazy(() => import("./Components/navBarComponents/logoSmall"));

function Footer() {
  return (
    <Box
      sx={{
        mt: 12,
        bgcolor: "#def7e5",
        boxShadow: "0px -2px 10px 0px rgba(0,0,0,0.10)",
        color: "info.main",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { md: "row", xs: "column" },
          mx: { md: 10, xs: 5 },
          mb: 3,
          pt: 4,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Logo />
            <LogoSmall />
            <Divider sx={{ width: "100%" }} />
            <Typography variant="caption">Welcome to kwl.app!</Typography>
            <Typography variant="caption">
              We're still developing this app. Any suggestions? Feel free to
              reach us via{" "}
              <Link
                color="inherit"
                underline="hover"
                href="mailto:info@kwl.app"
              >
                info@kwl.app
              </Link>
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ display: { xs: "block", md: "none" }, mt: { xs: 2 } }} />
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "start",
            mt: { xs: 2, md: 0 },
            gap: 1,
          }}
        >
          <Button
            component="a"
            href="https://kwl.app/blog/2022-08-17/what-is-kwl"
            sx={{ color: "info.main", fontSize: { xs: "12px", md: "14px" } }}
            variant="outlined"
          >
            What is KWL?
          </Button>
          <Button
            sx={{ color: "info.main", fontSize: { xs: "12px", md: "14px" } }}
            variant="outlined"
          >
            How to create a new ticket?
          </Button>
        </Box>
      </Box>
      <Box sx={{ textAlign: "center", py: 2 }}>
        <Typography variant="caption">
          Developed by{" "}
          <Link
            href="https://www.linkedin.com/in/kerem-nayman-653870154/"
            color="inherit"
            underline="hover"
          >
            Kerem Nayman
          </Link>{" "}
          and{" "}
          <Link
            href="https://www.linkedin.com/in/h%C3%BCma-bal-nayman-a67870154/"
            color="inherit"
            underline="hover"
          >
            Hüma Nayman
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}

export default Footer;
