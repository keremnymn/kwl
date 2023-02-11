import React from "react";

import { Typography, Box } from "@mui/material";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";

import { useNavigate } from "react-router-dom";

function LogoSmall() {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: "flex", flexGrow: 1, alignItems: "center" }}>
      <HistoryEduIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
      <Typography
        variant="h5"
        noWrap
        component="a"
        onClick={() => {
          navigate("/");
        }}
        sx={{
          mr: 2,
          display: { xs: "flex", md: "none" },
          flexGrow: 1,
          fontFamily: "monospace",
          fontWeight: 700,
          letterSpacing: ".3rem",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        KWL
      </Typography>
    </Box>
  );
}

export default LogoSmall;
