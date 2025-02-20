import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableRow, styled } from '@mui/material';
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";

const StyledTableCell = styled(TableCell)(() => ({
  color: "white",
  border: "none",
}));

const TableComp = ({ headers, data, sortField, sortOrder, handleSort, handleRowClick }) => (
  <TableContainer sx={{ border: "1px solid gray", borderRadius: 4 }}>
    <Table>
        <TableRow sx={{ backgroundColor: "#65626287"}}>
          {headers.map((header) => (
            <StyledTableCell key={header.field}
            onClick={header.sortable ? () => handleSort(header.field) : undefined}
            style={{ cursor: header.sortable ? "pointer" : "default",
            }}>
              {header.label}
              {header.sortable && sortField === header.field && (
                sortOrder === "asc" ? (
                  <IoIosArrowUp style={{ marginLeft: "4px" }} />
                ) : (
                  <IoIosArrowDown style={{ marginLeft: "4px" }} />
                )
              )}
            </StyledTableCell>
          ))}
        </TableRow>

      {/* Table Body */}
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={row.id}
            onClick={() => handleRowClick(row.id)}
            sx={{ cursor: "pointer" }}
          >
            {headers.map((header) => (
              <StyledTableCell key={header.field}>{row[header.field]}</StyledTableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default TableComp;
