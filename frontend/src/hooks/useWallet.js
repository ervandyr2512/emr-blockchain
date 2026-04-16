/**
 * useWallet.js
 * ------------
 * Custom React hook that manages MetaMask wallet connection state.
 * Returns: { account, chainId, connect, disconnect, isConnecting, error }
 */

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const [account,      setAccount]      = useState(null);
  const [chainId,      setChainId]      = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error,        setError]        = useState(null);

  // Reconnect on load if already authorised
  useEffect(() => {
    if (!window.ethereum) return;

    const restore = async () => {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network  = await provider.getNetwork();
        setChainId(Number(network.chainId));
      }
    };
    restore();

    // Listen for account / network changes
    window.ethereum.on("accountsChanged", (accounts) => {
      setAccount(accounts[0] || null);
    });
    window.ethereum.on("chainChanged", (hex) => {
      setChainId(parseInt(hex, 16));
    });
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("MetaMask not found. Please install it.");
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network  = await provider.getNetwork();
      setChainId(Number(network.chainId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
  }, []);

  return { account, chainId, connect, disconnect, isConnecting, error };
}
