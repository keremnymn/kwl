import { Card, CardContent, Typography, CardMedia } from "@mui/material";
import React from "react";

export interface SmallCardProps {
  title: string;
  description: string;
  image: string;
  marginTop: number;
  opacity?: string;
}

function SmallCard(props: SmallCardProps) {
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        mt: { md: props.marginTop, xs: 7 },
        borderRadius: 5,
        overflow: "visible",
        opacity: props.opacity ? props.opacity : undefined,
      }}
    >
      <CardContent sx={{ order: 2 }}>
        <Typography variant="h5">
          {" "}
          <div>
            {
              <div
                dangerouslySetInnerHTML={{
                  __html: props.title,
                }}
              />
            }
          </div>
        </Typography>
        <Typography sx={{ color: "#6e6e6e", my: 1 }}>
          {props.description}
        </Typography>
      </CardContent>
      <CardMedia
        component="img"
        sx={{
          zIndex: 200,
          width: "100%",
          marginTop: { md: -14, xs: -10 },
          marginBottom: { md: -11, xs: -10 },
          order: 1,
          clipPath: {
            md: "ellipse(65% 67% at 51% 10%);",
            xs: "ellipse(65% 67% at 51% 10%);",
          },
          overflow: "visible",
        }}
        image={props.image}
        alt="Live from space album cover"
      />
    </Card>
  );
}

export default SmallCard;
