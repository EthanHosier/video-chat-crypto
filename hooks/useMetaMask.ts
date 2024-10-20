import { useState, useEffect, useCallback } from "react";

// Import USDT ABI and BEP-20 contract address
import USDT_ABI from "../lib/USDT_ABI.json";
const USDT_ADDRESS_BEP20 = "0x55d398326f99059ff775485246999027b3197955"; // Binance Smart Chain USDT address

export function useMetaMaskLogin() {
  const [account, setAccount] = useState<string | null>(null);
  const [web3, setWeb3] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initWeb3 = useCallback(async () => {
    if (typeof window === "undefined") {
      // Ensure we're running on the client-side
      return;
    }

    setLoading(true);
    try {
      // @ts-ignore
      if (window.ethereum) {
        const Web3 = (await import("web3")).default;
        // @ts-ignore
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        // Request account access
        // @ts-ignore
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // Get the connected account
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);

        // Switch to Binance Smart Chain (BSC) if not already on it
        const chainId = await web3Instance.eth.getChainId();
        if (Number(chainId) !== 56) {
          try {
            // Attempt to switch to BSC
            // @ts-ignore
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x38" }], // 0x38 is the hex for BSC's chain ID 56
            });
          } catch (switchError) {
            // If the network is not added to MetaMask, add it
            if ((switchError as { code: number }).code === 4902) {
              // @ts-ignore
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x38",
                    chainName: "Binance Smart Chain",
                    rpcUrls: ["https://bsc-dataseed.binance.org/"],
                    nativeCurrency: {
                      name: "Binance Coin",
                      symbol: "BNB",
                      decimals: 18,
                    },
                    blockExplorerUrls: ["https://bscscan.com/"],
                  },
                ],
              });
            }
          }
        }
      } else {
        setError("Please install MetaMask!");
      }
    } catch (error) {
      console.error("Error during initialization:", error);
      setError("Failed to connect to MetaMask. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Only initialize Web3 once the component is mounted on the client side
  useEffect(() => {
    initWeb3();
  }, [initWeb3]);

  const connectWallet = async () => {
    if (typeof window === "undefined") {
      return;
    }

    setLoading(true);
    if (web3) {
      try {
        // @ts-ignore
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts && Array.isArray(accounts) && accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error("User denied account access");
        setError("User denied account access");
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please install MetaMask");
      setError("Please install MetaMask");
      setLoading(false);
    }
  };

  const sendUSDT = async (
    recipientAddress: string,
    amount: string
  ): Promise<boolean> => {
    if (!web3 || !account) {
      setError("Web3 or account not initialized");
      return false;
    }

    try {
      const usdtContract = new web3.eth.Contract(USDT_ABI, USDT_ADDRESS_BEP20);

      // Convert amount to the correct unit (USDT uses 18 decimals on BSC)
      const amountInWei = web3.utils.toWei(amount, "ether");

      // First, approve the transfer
      await usdtContract.methods
        .approve(USDT_ADDRESS_BEP20, amountInWei)
        .send({ from: account });

      // Then, perform the transfer
      await usdtContract.methods.transfer(recipientAddress, amountInWei).send({
        from: account,
        gas: "200000", // Increased gas limit
        gasPrice: web3.utils.toWei("20", "gwei"), // High gas price for testing
      });

      console.log(`Successfully sent ${amount} USDT to ${recipientAddress}`);
      return true;
    } catch (error) {
      console.error("Error sending USDT:", error);
      setError("Failed to send USDT. Please try again.");
      return false;
    }
  };

  return { account, web3, loading, error, connectWallet, sendUSDT };
}
