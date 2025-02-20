import React from "react";
import { Typography, useMediaQuery, useTheme } from "@mui/material";

export const Heading = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLaptop = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isExtraLarge = useMediaQuery(
    "(min-width: 1000px) and (max-width: 1429px)"
  );
  const isUltraLarge = useMediaQuery("(min-width: 1429px)");

  const fontSize = isUltraLarge
    ? "6rem"
    : isExtraLarge
    ? "4rem"
    : isLaptop
    ? "4rem"
    : isTablet
    ? "2rem"
    : "2rem";

  return (
    <Typography
      sx={{
        fontFamily: '"Orbitron", sans-serif',
        fontSize,
        fontWeight: "bold",
        color: "white",
        mb:3,
        ...props.sx,
        background: "linear-gradient(0deg, #F0F0F0 0%, #8A8A8A 113%)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textFillColor: "transparent", // Fallback for non-webkit browsers
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

export const H1 = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLaptop = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isExtraLarge = useMediaQuery(
    "(min-width: 1000px) and (max-width: 1429px)"
  );
  const isUltraLarge = useMediaQuery("(min-width: 1429px)");

  const fontSize = isUltraLarge
    ? "4.5rem"
    : isExtraLarge
    ? "3.125rem"
    : isLaptop
    ? "3rem"
    : isTablet
    ? "2.4rem"
    : "2.4rem";
  return (
    <Typography
      sx={{
        fontFamily: '"Orbitron", sans-serif',
        fontSize,
        fontWeight: "bold",
        color: "white",
        mb:3,
        ...props.sx,
        background: "linear-gradient(0deg, #F0F0F0 0%, #8A8A8A 113%)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textFillColor: "transparent", // Fallback for non-webkit browsers
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

export const H2 = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLaptop = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isExtraLarge = useMediaQuery(
    "(min-width: 1000px) and (max-width: 1429px)"
  );
  const isUltraLarge = useMediaQuery("(min-width: 1429px)");

  const fontSize = isUltraLarge
    ? "3.5rem"
    : isExtraLarge
    ? "2.5rem"
    : isLaptop
    ? "2.5rem"
    : isTablet
    ? "2rem"
    : "2rem";
  return (
    <Typography
      sx={{
        fontFamily: '"Neue Machina", sans-serif',
        fontSize,
        fontWeight: 600,
        color: "white",
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

export const H3 = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLaptop = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isExtraLarge = useMediaQuery(
    "(min-width: 1000px) and (max-width: 1429px)"
  );
  const isUltraLarge = useMediaQuery("(min-width: 1429px)");

  const fontSize = isUltraLarge
    ? "2.5rem"
    : isExtraLarge
    ? "2rem"
    : isLaptop
    ? "1.563rem"
    : isTablet
    ? "1.2rem"
    : "1.2rem";
  return (
    <Typography
      sx={{
        fontFamily: '"Rajdhani", sans-serif',
        fontSize,
        fontWeight: 500,
        color: "white",
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

export const H4 = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLaptop = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isExtraLarge = useMediaQuery(
    "(min-width: 1000px) and (max-width: 1429px)"
  );
  const isUltraLarge = useMediaQuery("(min-width: 1429px)");

  const fontSize = isUltraLarge
    ? "2rem"
    : isExtraLarge
    ? "1.8rem"
    : isLaptop
    ? "1.25rem"
    : isTablet
    ? "1.5rem"
    : "1.5rem";

  return (
    <Typography
      sx={{
        fontFamily: '"Rajdhani", sans-serif',
      
        fontWeight: 600,
        fontSize,
        color: "white",
        fontStyle: "normal",
        lineHeight: "150%",
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

export const H5 = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLaptop = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isExtraLarge = useMediaQuery(
    "(min-width: 1000px) and (max-width: 1429px)"
  );
  const isUltraLarge = useMediaQuery("(min-width: 1429px)");

  const fontSize = isUltraLarge
    ? "1.8rem"
    : isExtraLarge
    ? "1.5rem"
    : isLaptop
    ? "1rem"
    : isTablet
    ? "1rem"
    : "1rem";

  return (
    <Typography
      sx={{
        fontFamily: '"Neue Machina", sans-serif',
        fontSize,
        fontWeight: 700,
        color: "white",
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

export const H6 = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLaptop = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isExtraLarge = useMediaQuery(
    "(min-width: 1000px) and (max-width: 1429px)"
  );
  const isUltraLarge = useMediaQuery("(min-width: 1429px)");

  const fontSize = isUltraLarge
    ? "1rem"
    : isExtraLarge
    ? "1rem"
    : isLaptop
    ? "1rem"
    : isTablet
    ? "0.8rem"
    : "0.8rem";

  return (
    <Typography
      variant="h6"
      sx={{
        fontFamily: '"Neue Machina", sans-serif',
        fontSize,
        fontWeight: 300,
        color: "#fff",
        fontStyle: "normal",
        lineHeight: "24px",
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

// Body text
export const Body = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLaptop = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isExtraLarge = useMediaQuery(
    "(min-width: 1000px) and (max-width: 1429px)"
  );
  const isUltraLarge = useMediaQuery("(min-width: 1429px)");

  const fontSize = isUltraLarge
    ? "2rem"
    : isExtraLarge
    ? "1.875rem"
    : isLaptop
    ? "1.875rem"
    : isTablet
    ? "1rem"
    : "1rem";
  return (
    <Typography
      sx={{
        fontFamily: '"Rajdhani", sans-serif',
        fontSize,
        fontWeight: 500,
        lineHeight: 1.5,
        color: "white",
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

export const Body2 = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLaptop = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isExtraLarge = useMediaQuery(
    "(min-width: 1000px) and (max-width: 1429px)"
  );
  const isUltraLarge = useMediaQuery("(min-width: 1429px)");

  const fontSize = isUltraLarge
    ? "1.25rem"
    : isExtraLarge
    ? "1.25rem"
    : isLaptop
    ? "1.25rem"
    : isTablet
    ? "1rem"
    : "0.8rem";
  return (
    <Typography
      sx={{
        fontSize,
        fontFamily: '"Rajdhani", sans-serif',
        fontWeight: 400,
        lineHeight: 1.2,
        color: "white",
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};
