import React, { lazy, Suspense } from "react";
import "../Styles/Home.css";
import {
  Box,
  Card,
  Container,
  Typography,
  Button,
  CardContent,
  CardMedia,
  Grid,
  Skeleton,
} from "@mui/material";

const ReadMoreIcon = lazy(() => import("@mui/icons-material/ReadMore"));
const HomeTable = lazy(() => import("../Components/home/table"));
const SmallCard = lazy(() => import("../Components/home/smallCard"));

import { SmallCardProps } from "../Components/home/smallCard";

export default function App() {
  const [smallCards, setSmallCards] =
    React.useState<Array<SmallCardProps> | null>(null);

  React.useEffect(() => {
    document.title = "kwl.app";

    import("../jsonFiles/smallCards.json").then((smallCards) => {
      setSmallCards(smallCards.default as Array<SmallCardProps>);
    });
  });

  return (
    <>
      <div id="bg0"></div>
      <Container sx={{ mt: 4 }}>
        <Box
          sx={{
            my: 8,
            // bgcolor: "#def7e5",
            borderRadius: 4,
            display: "flex",
            flexDirection: { md: "row", xs: "column" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div className="slider-wrapper">
              Engage participants in your
              <div className="slider">
                <div className="slider-text1">presentation</div>
                <div className="slider-text2">lesson</div>
                <div className="slider-text3">workshop</div>
              </div>
            </div>
            <Typography variant="h6" sx={{ textAlign: "center" }}>
              Enhance your superpowers with <strong>kwl.app!</strong>
            </Typography>
          </Box>
          <Box
            component="img"
            loading="lazy"
            src="https://kwl-app.s3.eu-central-1.amazonaws.com/page-illustrations/Seminar-bro.svg"
            sx={{
              bgcolor: "rgba(255, 168, 61, 0.4)",
              borderRadius: 12,
              marginLeft: 6,
              width: { md: "50%", xs: "100%" },
              display: { xs: "none", md: "block" },
              alignSelf: "center",
            }}
          />
        </Box>

        <Grid container spacing={2} columns={4}>
          <Grid item xs={4} md={2}>
            <Card
              sx={{
                display: "flex",
                flexDirection: { md: "row", xs: "column" },
                justifyContent: "space-between",
              }}
            >
              <CardContent sx={{ order: { md: 1, xs: 2 } }}>
                <Typography variant="h5">What is KWL?</Typography>
                <Typography sx={{ color: "#6e6e6e", my: 1 }}>
                  KWL is a formative assessment technique that is usually
                  carried out on papers.
                </Typography>
                <Button
                  component="a"
                  href="https://kwl.app/blog/2022-08-17/what-is-kwl"
                  variant="outlined"
                  endIcon={<ReadMoreIcon />}
                >
                  Learn More
                </Button>
              </CardContent>
              <CardMedia
                component="img"
                loading="lazy"
                sx={{
                  width: { md: "30%", xs: "100%" },
                  objectPosition: { md: "50% 100%" },
                  order: { xs: 1, md: 2 },
                  clipPath: {
                    md: "circle(77% at 100% 50%)",
                    xs: "ellipse(80% 100% at 50% 0%)",
                  },
                }}
                image="https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80"
                alt="What is KWL?"
              />
            </Card>
          </Grid>
          <Grid item xs={4} md={2}>
            <Card
              sx={{
                display: "flex",
                flexDirection: { md: "row", xs: "column" },
                justifyContent: "space-between",
              }}
            >
              <CardContent sx={{ order: { md: 1, xs: 2 } }}>
                <Typography variant="h5">Formative Assessment</Typography>
                <Typography sx={{ color: "#6e6e6e", my: 1 }}>
                  In this article we're discussing some approaches to formative
                  assessment strategies.
                </Typography>
                <Button variant="outlined" endIcon={<ReadMoreIcon />}>
                  Read More
                </Button>
              </CardContent>
              <CardMedia
                loading="lazy"
                component="img"
                sx={{
                  width: { md: "30%", xs: "100%" },
                  objectFit: "cover",
                  order: { xs: 1, md: 2 },
                  clipPath: {
                    md: "circle(77% at 100% 50%)",
                    xs: "ellipse(80% 100% at 50% 0%)",
                  },
                }}
                image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80"
                alt="What is formative assessment?"
              />
            </Card>
          </Grid>
        </Grid>

        <Typography
          sx={{
            fontWeight: 300,
            mt: { md: 8, xs: 6 },
            mb: { md: 12 },
            textAlign: "center",
          }}
          variant="h3"
        >
          How does kwl.app work?
        </Typography>
        {smallCards && (
          <Grid container spacing={2} columns={6}>
            {smallCards.map((card, index) => {
              return (
                <Grid item xs={6} md={2} key={index}>
                  <SmallCard {...card} />
                </Grid>
              );
            })}
          </Grid>
        )}

        <Suspense
          fallback={
            <Skeleton
              variant="rectangular"
              sx={{ minHeight: "200px", width: "100%" }}
            />
          }
        >
          <HomeTable />
        </Suspense>
      </Container>
    </>
  );
}
