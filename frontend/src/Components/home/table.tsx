import * as React from "react";
import "../../Styles/table.css";
import {
  TableRow,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
} from "@mui/material";

function createData(know: string, wantToLearn: string, learned: string) {
  return { know, wantToLearn, learned };
}

const rows = [
  createData(
    "I know that formative assessment<br/> is important.",
    "I want to learn how kwl.app works.",
    "I realized that kwl.app is an awesome tool <br/>that can help me!"
  ),
];

const titles = [
  "<strong>K</strong>now",
  "<strong>W</strong>ould like to know",
  "<strong>L</strong>earned",
];

export default function HomeTable() {
  return (
    <TableContainer
      sx={{ my: 8, borderRadius: 4 }}
      elevation={4}
      component={Paper}
    >
      <Table
        sx={{ minWidth: "100%", bgcolor: "primary.main" }}
        aria-label="simple table"
      >
        <TableHead>
          <TableRow>
            {titles.map((title, index) => {
              return (
                <TableCell
                  key={index}
                  align="center"
                  sx={{ fontSize: "28px", fontWeight: "200", color: "#fff" }}
                >
                  <div>
                    {
                      <div
                        dangerouslySetInnerHTML={{
                          __html: title,
                        }}
                      />
                    }
                  </div>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={index}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell
                sx={{ color: "#fff", fontSize: "20px" }}
                align="center"
                component="th"
                scope="row"
              >
                <div>
                  {
                    <div
                      dangerouslySetInnerHTML={{
                        __html: row.know,
                      }}
                    />
                  }
                </div>
              </TableCell>
              <TableCell
                sx={{ color: "#fff", fontSize: "20px" }}
                align="center"
              >
                {" "}
                <div>
                  {
                    <div
                      dangerouslySetInnerHTML={{
                        __html: row.wantToLearn,
                      }}
                    />
                  }
                </div>
              </TableCell>
              <TableCell
                sx={{ color: "#fff", fontSize: "20px" }}
                align="center"
              >
                {" "}
                <div>
                  {
                    <div
                      dangerouslySetInnerHTML={{
                        __html: row.learned,
                      }}
                    />
                  }
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
