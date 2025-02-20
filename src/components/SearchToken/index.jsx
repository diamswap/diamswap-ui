import React, { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FaSearch } from "react-icons/fa";
import SearchInput from "./SearchInput";
import SearchDropdown from "./SearchDropdown";
import { useNavigate } from "react-router-dom";

const SearchFeature = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMobileInput, setShowMobileInput] = useState(false); // For toggling mobile input visibility

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const navigate = useNavigate();

  // Fetch tokens from the API
  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      // console.log("data",data);
      setTokens(data);
      setFilteredTokens(data); // Initially show all tokens
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tokens on component mount
  useEffect(() => {
    fetchTokens();
  }, []);

  // Filter tokens based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = tokens.filter((token) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTokens(filtered);
    } else {
      setFilteredTokens(tokens);
    }
  }, [searchQuery, tokens]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  
  const clearSearchInput = () => {
    setSearchQuery(""); 
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleBlur = () => {
    if (searchQuery) {
      const token = tokens.filter((token) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (token) {
        navigate(`/explore/tokens/${token.id}`, { state: { tokenName: token.name } });
        setRecentSearches((prev) => {
          if (prev.length >= 5) {
            return [token[0], ...prev.slice(0, 4)];
          }
          return [token[0], ...prev];
        });
      }
    }
    setSearchQuery("");
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  return (
    <Box>
      {isDesktop ? (
        // Desktop View
        <Box sx={{ position: "relative", width: "100%", minWidth: "400px" }}>
          <SearchInput
            onFocus={handleFocus}
            onBlur={handleBlur}
            searchQuery={searchQuery}
            setSearchQuery={handleSearch}
          />
          {showDropdown && (
            <Box
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 9999,
                marginTop: "0.5rem",
                backgroundColor: "#010726",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                width: "100%",
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "1rem",
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <SearchDropdown
                  tokens={filteredTokens}
                  recentSearches={recentSearches}
                  clearSearchInput={clearSearchInput}
                  setRecentSearches={setRecentSearches}
                />
              )}
            </Box>
          )}
        </Box>
      ) : (
        // Mobile View
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {!showMobileInput ? (
            <FaSearch
              onClick={() => setShowMobileInput(true)}
              style={{
                color: "#fff",
                marginRight: "0.5rem",
                cursor: "pointer",
              }}
            />
          ) : (
            <Box sx={{ position: "relative", flex: 1 }}>
              <SearchInput
                onFocus={handleFocus}
                onBlur={handleBlur}
                searchQuery={searchQuery}
                setSearchQuery={handleSearch}
              />
              {showDropdown && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    zIndex: 9999,
                    marginTop: "0.5rem",
                    backgroundColor: "#010726",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    width: "100%",
                  }}
                >
                  {loading ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "1rem",
                      }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <SearchDropdown
                      tokens={filteredTokens}
                      recentSearches={recentSearches}
                      clearSearchInput={clearSearchInput}
                      setRecentSearches={setRecentSearches}
                    />
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SearchFeature;
