import React, { lazy } from "react";
import axios from "axios";
import { PopUps } from "../App";
import {
  Container,
  Typography,
  Card,
  Button,
  CardContent,
  CardMedia,
  Skeleton,
  Grid,
  Box,
} from "@mui/material";
const ReadMoreIcon = lazy(() => import("@mui/icons-material/ReadMore"));

import { useLocation, useNavigate } from "react-router-dom";

import { truncateString } from "../Utils/BaseUtils";

export interface ArticleProps {
  title: string;
  slug: string;
  article_description: string;
  created_on: string;
  main_image: string;
}

function Blog(props: PopUps) {
  const [articles, setArticles] = React.useState<
    Array<ArticleProps> | undefined
  >();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = `Blog - kwl.app`;
    const currentPath = location.pathname.split("/blog/");
    if (currentPath.length > 1 && currentPath[1]) {
      navigate(`/blog/${currentPath[1]}`);
    } else {
      axios.get("/api/blog/get-articles").then((r) => {
        setArticles(r.data as Array<ArticleProps>);
      });
    }
  }, []);
  return (
    <Container sx={{ mt: 8, minHeight: "70vh" }}>
      <Typography variant="h2" sx={{ mb: 2 }}>
        Blog
      </Typography>
      {articles ? (
        <Grid container spacing={2} columns={6}>
          {articles.map((article: ArticleProps, index: number) => {
            return (
              <Grid item xs={6} md={3} key={index}>
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: { md: "row", xs: "column" },
                    justifyContent: "space-between",
                    mb: 2,
                    height: { md: "240px" },
                  }}
                >
                  <CardContent
                    sx={{
                      order: { md: 1, xs: 2 },
                      justifyContent: { md: "space-between" },
                      flexDirection: { md: "column" },
                      display: { md: "flex" },
                    }}
                  >
                    <Typography gutterBottom variant="h5">
                      {truncateString(article.title, 55)}
                    </Typography>
                    <Typography
                      gutterBottom
                      sx={{ color: "#6e6e6e", maxHeight: "130px" }}
                    >
                      {truncateString(article.article_description, 100)}
                    </Typography>
                    <Button
                      onClick={() => {
                        navigate(
                          `/blog/${article.created_on.split("T")[0]}/${
                            article.slug
                          }`
                        );
                      }}
                      variant="outlined"
                      endIcon={<ReadMoreIcon />}
                    >
                      Read More
                    </Button>
                  </CardContent>
                  <CardMedia
                    component="img"
                    sx={{
                      maxHeight: { md: "100%", xs: "150px" },
                      width: { md: "200px", xs: "100%" },
                      objectPosition: { md: "50% 100%" },
                      order: { xs: 1, md: 2 },
                      clipPath: {
                        md: "circle(77% at 100% 50%)",
                        xs: "ellipse(80% 100% at 50% 0%)",
                      },
                    }}
                    image={article.main_image}
                    alt={article.title}
                  />
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box sx={{ minHeight: "50vh" }}>
          <Skeleton />
          <Skeleton animation="wave" />
          <Skeleton animation={false} />
        </Box>
      )}
    </Container>
  );
}

export default Blog;
