import React, { lazy } from "react";
import "../../Styles/blogEditor.css";
import {
  Button,
  Container,
  Box,
  TextField,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
const ExpandMoreIcon = lazy(() => import("@mui/icons-material/ExpandMore"));
const AddIcon = lazy(() => import("@mui/icons-material/Add"));
const AddTagDialog = lazy(() => import("./addTagDialog"));

import { TagDialogProps } from "./addTagDialog";

import axios from "axios";

import EditorJS, { OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Select, { MultiValue, OptionsOrGroups, GroupBase } from "react-select";
//@ts-ignore
import Underline from "@editorjs/underline";
//@ts-ignore
import Embed from "@editorjs/embed";
//@ts-ignore
import List from "@editorjs/list";
//@ts-ignore
import Table from "@editorjs/table";
//@ts-ignore
import Delimiter from "@editorjs/delimiter";
//@ts-ignore
import Link from "@editorjs/link";
//@ts-ignore
import Marker from "@editorjs/marker";
//@ts-ignore
import Quote from "@editorjs/quote";
//@ts-ignore
import ImageTool from "@editorjs/image";
import { PopUps } from "../../App";
import { useSearchParams } from "react-router-dom";
import { fileChangedHandler } from "../../Utils/BaseUtils";
import { SingleArticleProps } from "../../Pages/Article";

export type OptionProps = {
  [key in "value" | "label"]: string;
};

const getEditorJSImages = () => {
  const imagesInTheArticle: Array<string> = [];
  document
    .querySelectorAll(".image-tool__image-picture")
    .forEach((x) => imagesInTheArticle.push((x as HTMLImageElement).src));
  return imagesInTheArticle;
};

export default function Editor(props: PopUps) {
  const [editor, seteditor] = React.useState({});
  const [tags, setTags] = React.useState<
    OptionsOrGroups<string, GroupBase<string>>
  >([]);
  const [selectedTags, setSelectedTags] = React.useState<any>([]);
  const previewImage = React.useRef<HTMLImageElement | null>(null);
  const [isOpen, setOpen] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [article, setArticle] = React.useState<SingleArticleProps>();

  var uploadedImages: Array<string> = [];

  const skeletonImage = article
    ? article.main_image
    : "https://miro.medium.com/max/678/1*ZPvzUShTe448VPDukHiskw.png";

  React.useEffect(() => {
    props.setbackDropOpen(true);
    let receivedArticle: SingleArticleProps | undefined = undefined;
    axios
      .get("/api/blog/get-tags", {
        headers: {
          Authorization: `Bearer ${props.user.token}`,
        },
      })
      .then((r) => {
        setTags(r.data);
      });
    if (searchParams.get("ticket")) {
      axios.get(`/api/blog/article/${searchParams.get("ticket")}`).then((r) => {
        const currentContent = r.data[0] as SingleArticleProps;
        setArticle(currentContent);
        receivedArticle = currentContent;
        const currentTags = [];
        for (let tag in currentContent.tags) {
          const tagObject = {
            label: currentContent.tags[tag],
            value: currentContent.tags[tag].toLowerCase().replaceAll(" ", "-"),
          };
          currentTags.push(tagObject);
        }
        setSelectedTags(currentTags);
      });
    }
    setTimeout(() => {
      if (receivedArticle && document.querySelector(".codex-editor")) {
        const editorJSNode = document.getElementById("editorjs");
        while (editorJSNode?.firstChild) {
          editorJSNode?.removeChild(editorJSNode?.lastChild!);
        }
      }
      if (document.querySelectorAll(".codex-editor").length === 0) {
        const editor = new EditorJS({
          holder: "editorjs",
          autofocus: true,
          data: receivedArticle
            ? (JSON.parse(
                (receivedArticle as SingleArticleProps).content
              ) as OutputData)
            : undefined,
          tools: {
            header: Header,
            underline: Underline,
            embed: Embed,
            list: { class: List, inlineToolbar: true },
            table: { class: Table, inlineToolbar: true },
            delimiter: Delimiter,
            link: Link,
            marker: Marker,
            quote: Quote,
            image: {
              class: ImageTool,
              inlineToolbar: true,
              config: {
                uploader: {
                  async uploadByFile(file: File) {
                    let formData = new FormData();
                    formData.append("file", file);
                    return axios
                      .post("/api/blog/upload-image", formData, {
                        headers: {
                          Authorization: `Bearer ${props.user.token}`,
                          accept: "application/json",
                          "Content-Type": "multipart/form-data",
                        },
                      })
                      .then((r) => {
                        uploadedImages.push(r.data);
                        return {
                          success: 1,
                          file: {
                            url: r.data,
                          },
                        };
                      });
                  },
                },
              },
            },
          },
          onChange(api, event) {
            setTimeout(() => {
              const imagesInTheArticle = getEditorJSImages();
              if (uploadedImages.length > imagesInTheArticle.length) {
                uploadedImages.forEach(async (file) => {
                  if (!imagesInTheArticle.includes(file)) {
                    axios
                      .delete("/api/blog/delete-image", {
                        params: { file },
                        headers: {
                          Authorization: `Bearer ${props.user.token}`,
                        },
                      })
                      .then((r) => {
                        uploadedImages = uploadedImages.filter(
                          (uploadedImage) => uploadedImage != file
                        );
                      });
                  }
                });
              }
            }, 1000);
          },
          onReady() {
            if (receivedArticle) {
              uploadedImages = getEditorJSImages();
            }
            props.setbackDropOpen(false);
          },
        });
        seteditor(editor);
      }
    }, 1500);
  }, []);
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    (editor as EditorJS)
      .save()
      .then((outputData) => {
        props.setbackDropOpen(true);

        const apiURL = article
          ? "/api/blog/modify-article"
          : "/api/blog/upload-article";
        const requestType = article ? axios.put : axios.post;
        let tagValues = [];
        for (let tag in selectedTags) {
          tagValues.push(selectedTags[tag].value);
        }

        data.append("tags", tagValues.toString());
        data.append("content", JSON.stringify(outputData));

        if (article) {
          const articleDate = searchParams.get("ticket")?.split("/")[0];
          const articleSlug = searchParams.get("ticket")?.split("/")[1];
          data.append("date", articleDate as string);
          data.append("slug", articleSlug as string);
        }

        let formObject = Object.fromEntries(data.entries());

        if (!(formObject.mainImage as Blob).size && !article) {
          props.setbackDropOpen(false);
          props.setAlert({
            message: "Please upload a main image.",
            type: "error",
            isOpen: true,
          });
        } else if (!formObject.tags) {
          props.setbackDropOpen(false);
          props.setAlert({
            message: "Please provide tags.",
            type: "error",
            isOpen: true,
          });
        } else {
          requestType(apiURL, formObject, {
            headers: {
              Authorization: `Bearer ${props.user.token}`,
              accept: "application/json",
              "Content-Type": "multipart/form-data",
            },
          })
            .then((r) => {
              window.location.href = "/blog";
            })
            .catch((e) => {
              props.setbackDropOpen(false);
              props.setAlert({
                message: e.response.data["detail"],
                type: "error",
                isOpen: true,
              });
            });
        }
      })
      .catch((error) => {
        console.error("Saving failed: ", error);
      });
  };

  const tagDialogProps: TagDialogProps = {
    isOpen: isOpen,
    setOpen: setOpen,
    tags: tags,
    setTags: setTags,
    setbackDropOpen: props.setbackDropOpen,
    token: props.user.token,
    alert: props.alert,
    setAlert: props.setAlert,
  };

  return (
    <React.Fragment>
      <AddTagDialog {...tagDialogProps} />
      <Container maxWidth="xl">
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            Mandatory Information
          </AccordionSummary>
          <AccordionDetails>
            <Box component="form" id="articleForm" onSubmit={onSave}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 6,
                  mb: 4,
                }}
              >
                <Button
                  sx={{ mb: 4, width: "70%", justifyContent: "center" }}
                  variant="contained"
                  component="label"
                >
                  Upload Main Image
                  <input
                    type="file"
                    name="mainImage"
                    onChange={(e) => {
                      try {
                        fileChangedHandler(
                          e,
                          props,
                          previewImage!,
                          skeletonImage
                        );
                      } catch (e) {
                        // pass
                      }
                    }}
                    accept="image/*"
                    hidden
                  />
                </Button>
                <Box
                  component="img"
                  ref={previewImage}
                  maxWidth="150px"
                  maxHeight="150px"
                  src={skeletonImage}
                />
              </Box>
              <TextField
                defaultValue={article?.title}
                InputLabelProps={{ shrink: article ? true : undefined }}
                label="Article Title"
                name="articleTitle"
                variant="filled"
                fullWidth
                multiline
                required
                inputProps={{ maxLength: 120 }}
              />
              <TextField
                defaultValue={article?.article_description}
                InputLabelProps={{ shrink: article ? true : undefined }}
                label="Article Description"
                name="articleDescription"
                variant="filled"
                fullWidth
                multiline
                required
                rows={2}
                sx={{ my: 3 }}
                inputProps={{ minLength: 10, maxLength: 250 }}
              />
              <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                <Box sx={{ width: "100%" }}>
                  <Typography gutterBottom>Choose tags:</Typography>
                  <Select
                    menuPortalTarget={document.body}
                    value={selectedTags ? selectedTags : undefined}
                    onChange={(e: MultiValue<string>) => {
                      const keyArray = e.map((item) => {
                        return item;
                      });
                      setSelectedTags(keyArray);
                    }}
                    styles={{
                      menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
                    isMulti
                    aria-label="Tags"
                    options={tags ? tags : undefined}
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </Box>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  sx={{
                    width: "150px",
                    marginTop: "auto",
                    marginBottom: 0.1,
                  }}
                  onClick={() => {
                    setOpen(true);
                  }}
                >
                  Add Tag
                </Button>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
        <Typography variant="h3" sx={{ mt: 4 }}>
          Article Content
        </Typography>
        <Divider />
        <div id="editorjs" style={{ width: "100%", alignSelf: "left" }} />
        <Button variant="contained" type="submit" form="articleForm">
          Save
        </Button>
      </Container>
    </React.Fragment>
  );
}
