import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#D3D3D3", // Dodger Blue
    },
    secondary: {
      main: "#040F25", // Oxford Blue
    },
    background: {
      default: "linear-gradient(180deg, #11031B 0%, #0A0110 100%)", // Dark gradient
      paper: "#000", // Penn Blue for cards or paper-like elements
    },
    text: {
      primary: "#FCFEFD", // White
      secondary: "white", // Light Cyan
    },
  },
  typography: {
    fontFamily: "Poppins, Arial, sans-serif",
    h1: {
      fontSize: "3rem",
      fontWeight: 600,
    },
    h2: {
      fontSize: "2.5rem",
      fontWeight: 500,
      color: "white",
    },
    h4: {
      fontSize: "2rem",
      fontWeight: 500,
      color: "white",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      color: "white",
    },

    h5: {
      fontSize: "1rem",
      fontWeight: 500,
      color: "white",
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
      color: "#FCFEFD",
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 300,
      color: "white",
    },
  },
});

export default theme;
