// src/pages/DashboardPage.jsx
import React from "react";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  // For demo purposes, we retrieve the account from localStorage.
  const account = localStorage.getItem("daimAccount");

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dashboard</h2>
      <p>Your account: {account || "Not connected"}</p>
      <ul>
        <li>
          <Link to="/swap">Swap Tokens</Link>
        </li>
        <li>
          <Link to="/liquidity">Liquidity Pool</Link>
        </li>
      </ul>
    </div>
  );
};

export default DashboardPage;
