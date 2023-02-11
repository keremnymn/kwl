import React, { lazy } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { PopUps } from "../App";
import { ArticleProps } from "./Blog";
import {
  Avatar,
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Skeleton,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import { Helmet } from "react-helmet";

const ReadOnlyEditor = lazy(
  () => import("../Components/editor/readOnlyEditor")
);

export interface SingleArticleProps extends ArticleProps {
  content: string;
  tags: Array<string>;
}

export default function Article(props: PopUps) {
  const [article, setArticle] = React.useState<
    SingleArticleProps | undefined
  >();
  const location = useLocation();
  const currentPath = location.pathname.split("/blog/");

  const modifyDate = (created_on: SingleArticleProps["created_on"]) => {
    const date = created_on.split("T")[0];
    const day =
      date.split("-")[2][0] == "0"
        ? date.split("-")[2].slice(1)
        : date.split("-")[2];
    const month = new Date(created_on).toLocaleString("en", { month: "long" });
    return `${month} ${day}, ${date.split("-")[0]}`;
  };

  const navigate = useNavigate();

  const handleChipClick = () => {
    console.info("You haven't got this privilege for now.");
  };

  const deleteRequest = async () => {
    props.setbackDropOpen(true);
    props.setDialog({ ...props.dialog, dialogOpen: false });
    axios
      .delete(`/api/blog/delete-article/${currentPath[1]}`, {
        headers: {
          Authorization: `Bearer ${props.user.token}`,
        },
      })
      .then(() => {
        props.setAlert({
          isOpen: true,
          message: "The article has been deleted",
          type: "success",
        });
        navigate("/blog");
        props.setbackDropOpen(false);
      })
      .catch((e) => {
        props.setAlert({
          isOpen: true,
          message: "Check the log.",
          type: "error",
        });
        props.setbackDropOpen(false);
      });
  };

  React.useEffect(() => {
    axios.get(`/api/blog/article/${currentPath[1]}`).then((r) => {
      setArticle(r.data[0] as SingleArticleProps);
      document.title = `${(r.data[0] as SingleArticleProps).title} - kwl.app`;
    });
  }, []);

  return (
    <React.Fragment>
      {article ? (
        <>
          <Helmet>
            <meta name="title" content={article.title + " - kwl.app"} />
            <meta
              name="description"
              content="kwl.app helps you create meaningful insights about your presentations."
            />

            <meta property="og:type" content="website" />
            <meta property="og:url" content={window.location.href} />
            <meta property="og:title" content={article.title + " - kwl.app"} />
            <meta
              property="og:description"
              content={article.article_description}
            />
            <meta property="og:image" content={article.main_image} />

            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={window.location.href} />
            <meta
              property="twitter:title"
              content={article.title + " - kwl.app"}
            />
            <meta
              property="twitter:description"
              content={article.article_description}
            />
            <meta property="twitter:image" content={article.main_image} />
          </Helmet>
          <Container maxWidth="xl">
            <Card
              sx={{
                mt: { md: 6, xs: 2 },
                bgcolor: "transparent",
                boxShadow: "none",
                display: "flex",
                flexDirection: { md: "row", xs: "column" },
                gap: 3,
                alignItems: "center",
                mb: 4,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 2,
                    mb: 2,
                    minWidth: { md: "50rem" },
                  }}
                >
                  <Chip
                    size="small"
                    label={article.tags[0]}
                    onClick={handleChipClick}
                    sx={{ opacity: "80%" }}
                  />
                  <Typography fontSize="small" sx={{ opacity: "70%", mt: 0.2 }}>
                    {modifyDate(article.created_on)}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ mb: 2 }}>
                  {article.title}
                </Typography>
                <Typography variant="body1">
                  {article.article_description}
                </Typography>
                <Card
                  sx={{
                    bgcolor: "transparent",
                    boxShadow: "none",
                    display: "flex",
                    flexDirection: "row",
                    mt: 2,
                  }}
                >
                  <CardMedia sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar>H</Avatar>
                  </CardMedia>
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      paddingTop: 0,
                      paddingBottom: "0 !important",
                    }}
                  >
                    <Typography>Hüma Nayman</Typography>
                    <Typography variant="caption">Researcher</Typography>
                  </CardContent>
                </Card>
              </CardContent>
              <CardMedia
                component="img"
                image={article.main_image}
                loading="lazy"
                sx={{
                  maxWidth: "550px",
                  maxHeight: "300px",
                  objectFit: "cover",
                  borderRadius: "7px",
                  boxShadow:
                    "0 1px 4px rgba(0, 0, 0, 0.09),0 3px 8px rgba(0, 0, 0, 0.09),0 4px 13px rgba(0, 0, 0, 0.13);",
                }}
              ></CardMedia>
            </Card>
            {props.user.logged_in &&
              process.env
                .REACT_APP_ADMINS!.split(",")
                .includes(props.user.id.toString()) && (
                <Box>
                  <Button
                    onClick={() => {
                      props.setDialog({
                        dialogOpen: true,
                        title: "Are you sure?",
                        text: "This article and its content will be deleted forever. Are you sure?",
                        extraButton: {
                          buttonText: "Delete the Article",
                          func: deleteRequest,
                        },
                      });
                    }}
                  >
                    Delete the article
                  </Button>
                  <Button
                    onClick={() => {
                      navigate(`/new-article?ticket=${currentPath[1]}`);
                    }}
                  >
                    Edit the article
                  </Button>
                </Box>
              )}
            <Divider
              light
              sx={{
                mb: 3,
                mx: { md: 10, xs: 4 },
              }}
            />
            <ReadOnlyEditor data={article.content} />
          </Container>
        </>
      ) : (
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
          height={"50vh"}
        />
      )}
    </React.Fragment>
  );
}
