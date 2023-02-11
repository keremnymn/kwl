import React from "react";

import { Typography, Box } from "@mui/material";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";

import { useNavigate } from "react-router-dom";

function Logo() {
  const navigate = useNavigate();
  return (
    <Box sx={{ flexGrow: 0, display: "flex", alignItems: "center" }}>
      <HistoryEduIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
      <Typography
        variant="h6"
        noWrap
        component="a"
        onClick={() => {
          navigate("/");
        }}
        sx={{
          mr: 2,
          display: { xs: "none", md: "flex" },
          fontWeight: 700,
          letterSpacing: ".3rem",
          color: "inherit",
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        KWL
      </Typography>
    </Box>
  );
}

export default Logo;
