import { Box, Container, Skeleton } from "@mui/material";
import React, { lazy, Suspense } from "react";
import { PopUps } from "../App";
const Editor = lazy(() => import("../Components/editor/blogEditor"));

function NewArticle(props: PopUps) {
  React.useEffect(() => {
    document.title = `New Article - kwl.app`;
  }, []);

  return (
    <Suspense
      fallback={
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
          height={"60vh"}
        />
      }
    >
      <Container sx={{ mt: 8, minHeight: "70vh" }}>
        <Box sx={{ bgcolor: "#fff", p: 4 }}>
          <Editor {...props} />
        </Box>
      </Container>
    </Suspense>
  );
}

export default NewArticle;
