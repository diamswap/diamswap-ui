// src/components/Navbar.jsx
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Drawer,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  Collapse,
  Typography,
} from "@mui/material";
import { NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaExchangeAlt, FaPaperPlane, FaWallet } from "react-icons/fa";
import { ChevronDown, ChevronRight } from "lucide-react";
import DiamWalletConnect from "./DiamWallet";

const Navbar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [menuHover, setMenuHover] = useState({
    trade: false,
    pools: false,
  });

  // Get wallet public key from localStorage (wallet is connected if a key exists)
  const walletPublicKey = localStorage.getItem("diamPublicKey");

  // Handlers for drawer toggle.
  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setIsDrawerOpen(open);
  };

  // Handlers for dropdown menu hover events.
  const handleMouseEnter = (menu) => {
    setMenuHover((prev) => ({ ...prev, [menu]: true }));
  };

  const handleMouseLeave = (menu) => {
    setMenuHover((prev) => ({ ...prev, [menu]: false }));
  };

  // Toggle sub-menu open/close (for mobile drawer)
  const handleSubMenuToggle = (menuKey) => {
    setOpenSubMenu((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const menuConfig = {
    trade: [
      { label: "Swap", path: "/swap", icon: <FaExchangeAlt /> },
      { label: "Send", path: "/send", icon: <FaPaperPlane /> },
      { label: "Buy", path: "/buy", icon: <FaWallet /> },
    ],
    pools: [
      { label: "Create Pool", path: "/pools/create" },
      { label: "View Positions", path: "/pools/view-position" },
      { label: "View All Pools", path: "/pools/view" },
    ],
  };

  // For mobile drawer menu
  const drawerList = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {/* Trade Menu */}
        <ListItem button onClick={() => handleSubMenuToggle("trade")}>
          <ListItemText primary="Trade" />
          {openSubMenu.trade ? (
            <ChevronDown size={16} color="#fefbfb" />
          ) : (
            <ChevronRight size={16} color="#fefbfb" />
          )}
        </ListItem>
        <Collapse in={openSubMenu.trade} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {menuConfig.trade.map((item) => (
              <ListItem
                button
                key={item.label}
                component={NavLink}
                to={item.path}
                sx={{ pl: 4 }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  handleSubMenuToggle("trade");
                }}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* Pools Menu */}
        <ListItem button onClick={() => handleSubMenuToggle("pools")}>
          <ListItemText primary="Pools" />
          {openSubMenu.pools ? (
            <ChevronDown size={16} color="#fefbfb" />
          ) : (
            <ChevronRight size={16} color="#fefbfb" />
          )}
        </ListItem>
        <Collapse in={openSubMenu.pools} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {menuConfig.pools.map((item) => (
              <ListItem
                button
                key={item.label}
                component={NavLink}
                to={item.path}
                sx={{ pl: 4 }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  handleSubMenuToggle("pools");
                }}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* Staking Menu */}
        <ListItem button component={NavLink} to="/tokens">
          <ListItemText primary="Tokens" />
        </ListItem>
        {/* Profile: Render in drawer only if wallet is connected */}
        {walletPublicKey && (
          <ListItem button component={NavLink} to="/profile">
            <ListItemText primary="Profile" />
          </ListItem>
        )}
      </List>
    </Box>
  );

  // Render dropdown for desktop view menu (when hovering)
  const renderMenuItems = (menu) => {
    return menuConfig[menu].map((item) => (
      <MenuItem
        key={item.label}
        onClick={() => {
          navigate(item.path);
          setMenuHover((prev) => ({ ...prev, [menu]: false }));
        }}
        sx={{
          textTransform: "none",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          "&:hover": {
            backgroundColor: "#ccc",
            color: "#000",
          },
        }}
      >
        {item.icon && item.icon} {item.label}
      </MenuItem>
    ));
  };

  const renderDropdown = (menu) => {
    return (
      menuHover[menu] && (
        <Box
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            backgroundColor: "#000",
            borderRadius: "12px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            padding: "8px 0",
            width: "150px",
          }}
        >
          {renderMenuItems(menu)}
        </Box>
      )
    );
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: "transparent",
        boxShadow: "none",
        padding: "0.5rem 0.5rem",
        width: "100%",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", alignItems: "center" }}>
        {/* Left side: Logo and primary menus */}
        <Box display="flex" gap={1}>
          <Button
            component={NavLink}
            to="/"
            sx={{ color: "#fff", textTransform: "none" }}
          >
            <img
              src="https://framerusercontent.com/images/hCJipfYt6QNf2M7IkkKiSiZ5t0.png?scale-down-to=512"
              alt="Logo"
              style={{ height: "1rem", width: "2rem" }}
            />
            Diamante
          </Button>

          {/* Desktop menus */}
          <Box sx={{ display: { xs: "none", md: "flex" } }}>
            {["trade", "pools"].map((menu) => (
              <Box
                key={menu}
                onMouseEnter={() => handleMouseEnter(menu)}
                onMouseLeave={() => handleMouseLeave(menu)}
                sx={{ position: "relative" }}
              >
                <Button
                  sx={{ color: "#fff", textTransform: "none" }}
                  // For "trade", navigate to "/swap". For "pools", default open "/pools/create".
                  component={NavLink}
                  to={menu === "trade" ? "/swap" : "/pools/create"}
                >
                  {menu.charAt(0).toUpperCase() + menu.slice(1)}
                </Button>
                {renderDropdown(menu)}
              </Box>
            ))}
            <Button
              component={NavLink}
              to="/tokens"
              sx={{ color: "#fff", textTransform: "none" }}
            >
             Tokens
            </Button>
          </Box>
        </Box>

        {/* Right side: Wallet connect, Profile (only if wallet is connected), Menu icon for mobile */}
        <Box display="flex" gap={3} alignItems="center">
          <DiamWalletConnect />
          {walletPublicKey && (
            <Button
              component={NavLink}
              to="/profile"
              sx={{ color: "#fff", textTransform: "none" }}
            >
              Profile
            </Button>
          )}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={toggleDrawer(true)}
            >
              <FaBars style={{ color: "#D5FAFE" }} />
            </IconButton>
          </Box>
        </Box>

        <Drawer
          anchor="right"
          open={isDrawerOpen}
          onClose={toggleDrawer(false)}
        >
          {drawerList}
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
