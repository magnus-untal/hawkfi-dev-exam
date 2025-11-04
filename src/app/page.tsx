"use client";

import { Box, Typography } from "@mui/material";
import { useWallet } from "@jup-ag/wallet-adapter";
import { WalletButton } from "@/components/solana/wallet-button";

import AddPoolSniperForm from "@/components/pool-sniper/AddPoolSniperForm"

export default function Home() {
  const { connected, publicKey } = useWallet();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#070D0AE5",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          borderBottom: "1px solid rgba(70, 235, 128, 0.2)",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#46EB80",
            fontWeight: "bold",
          }}
        >
          HawkFi Dev Exam
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {connected && (
            <Typography
              variant="body2"
              sx={{
                color: "#46EB80",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              {publicKey?.toString().slice(0, 8)}...
              {publicKey?.toString().slice(-8)}
            </Typography>
          )}
          <WalletButton />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          p: 4,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          {(connected && publicKey) && (
            <AddPoolSniperForm 
              publicKey={publicKey?.toString()}
            />
          )}
          {!connected && (
            <Box sx={{ mt: 3 }}>
              <WalletButton />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
