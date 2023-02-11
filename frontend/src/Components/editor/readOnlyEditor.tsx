import React from "react";
import EditorJS from "@editorjs/editorjs";
import { SingleArticleProps } from "../../Pages/Article";
import Header from "@editorjs/header";
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
import Image from "@editorjs/image";
import { Box } from "@mui/material";
import "../../Styles/readOnlyEditor.css";

function ReadOnlyEditor({ data }: { data: SingleArticleProps["content"] }) {
  React.useEffect(() => {
    new EditorJS({
      holder: "editorjs",
      readOnly: true,
      data: JSON.parse(data),
      tools: {
        header: Header,
        underline: Underline,
        embed: Embed,
        list: List,
        table: Table,
        delimiter: Delimiter,
        link: Link,
        marker: Marker,
        quote: Quote,
        image: Image,
      },
    });
  }, []);
  return <Box id="editorjs" sx={{ px: { md: 8, xs: 0 } }} />;
}

export default ReadOnlyEditor;
