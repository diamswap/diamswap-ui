import React, { useState } from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const ContentWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(3),
  maxWidth: "550px",
  margin: "0 auto",
  flexDirection: "column",
}));

export default function Info() {
  const [expanded, setExpanded] = useState(false);

  const fullText = `
    Tether (USDT) is a cryptocurrency with a value meant to mirror the value
    of the U.S. dollar. The idea was to create a stable cryptocurrency that
    can be used like digital dollars. Coins that serve this purpose of being a
    stable dollar substitute are called "stable coins." Tether is the most
    popular stable coin and even acts as a dollar replacement on many popular
    exchanges! According to their site, Tether converts cash into digital
    currency, to anchor or "tether" the value of the coin to the price of
    national currencies like the US dollar, the Euro, and the Yen. Like other
    cryptos it uses blockchain. Unlike other cryptos, it is [according to the
    official Tether "100% backed by USD" (USD is held in reserve). The primary
    use of Tether is that it offers some stability to the otherwise volatile
    crypto space and offers liquidity to exchanges who can't deal in dollars
    and with banks (for example to the sometimes controversial but leading
    exchange Bitfinex). The digital coins are issued by a company called
    Tether Limited that is governed by the laws of the British Virgin Islands,
    according to the legal part of its website. It is incorporated in Hong
    Kong. It has emerged that Jan Ludovicus van derVelde is the CEO of
    cryptocurrency exchange Bitfinex, which has been accused of being involved
    in the price manipulation of bitcoin, as well as tether. Many people
    trading on exchanges, including Bitfinex, will use tether to buy other
    cryptocurrencies like bitcoin. Tether Limited argues that using this
    method to buy virtual currencies allows users to move fiat in and out of
    an exchange more quickly and cheaply. Also, exchanges typically have rocky
    relationships with banks, and using Tether is a way to circumvent that.
    USDT is fairly simple to use. Once on exchanges like Poloniex or Bittrex,
    it can be used to purchase Bitcoin and other cryptocurrencies. It can be
    easily transferred from an exchange to any Omni Layer-enabled wallet.
    Tether has no transaction fees, although external wallets may charge one.
    In order to convert USDT to USD and vice versa through the Tether.to
    platform, users must pay a small fee. Buying and selling Tether for Bitcoin
    can be done through a variety of exchanges like the ones mentioned
    previously or through the Tether.to platform, which also allows the
    conversion between USD to and your bank account.
  `;

  const truncatedText = fullText.slice(0, 200) + "...";

  return (
    <ContentWrapper>
      <Box>Info</Box>
      <Box>{expanded ? fullText : truncatedText}</Box>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          color: "#d3d3d3",
          cursor: "pointer",
        }}
      >
        {expanded ? "Hide" : "Show More"}
      </Box>
    </ContentWrapper>
  );
}
