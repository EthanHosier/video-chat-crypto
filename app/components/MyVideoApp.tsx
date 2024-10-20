"use client";

import React, { useEffect, useState } from "react";
import { useLocalStream } from "@/app/hooks/useLocalStream";
import { useRoomConnection, VideoView } from "@whereby.com/browser-sdk/react";
import ChatSidebar from "./ChatSidebar";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMetaMaskLogin } from "@/hooks/useMetaMask";
import { getPeerByUuid } from "@/lib/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type MoneyTransferMessage = {
  type: "moneyTransfer";
  amount: string;
  recipient: string;
};

interface MyVideoAppProps {
  roomUrl: string;
  displayName: string;
  externalId: string;
}

const MyVideoApp: React.FC<MyVideoAppProps> = ({
  roomUrl,
  displayName,
  externalId,
}) => {
  const router = useRouter();
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [maxVisibleParticipants, setMaxVisibleParticipants] = React.useState(6);
  const [isMuted, setIsMuted] = React.useState(true);
  const [isCameraOff, setIsCameraOff] = React.useState(false);
  const [selectedPeer, setSelectedPeer] = React.useState<{
    displayName: string;
    metamaskWallet: string;
  } | null>(null);
  const { account, sendUSDT, loading: sendingUSDT } = useMetaMaskLogin();
  const [usdtAmount, setUsdtAmount] = React.useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const { state, actions } = useRoomConnection(roomUrl, {
    localMediaOptions: {
      audio: true,
      video: true,
    },
    externalId,
  });

  const { remoteParticipants, localParticipant, chatMessages } = state;
  const { joinRoom, leaveRoom, toggleMicrophone } = actions;

  const updateMaxVisibleParticipants = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const width = window.innerWidth;
    if (width < 640) {
      // Small phones
      setMaxVisibleParticipants(7);
    } else if (width < 768) {
      // Large phones
      setMaxVisibleParticipants(7);
    } else if (width < 1024) {
      // Tablets
      setMaxVisibleParticipants(7);
    } else {
      // Desktops and larger screens
      setMaxVisibleParticipants(7);
    }
  }, []);

  React.useEffect(() => {
    updateMaxVisibleParticipants();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateMaxVisibleParticipants);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", updateMaxVisibleParticipants);
      }
    };
  }, [updateMaxVisibleParticipants]);

  React.useEffect(() => {
    const join = async () => {
      try {
        setIsLoading(true);
        await joinRoom();
      } catch (err) {
        console.error("Failed to join room:", err);
        setError(err instanceof Error ? err : new Error("Failed to join room"));
      } finally {
        setIsLoading(false);
      }
    };

    join();
    return () => {
      leaveRoom();
    };
  }, [joinRoom, leaveRoom]);

  const visibleParticipants = remoteParticipants.slice(
    0,
    maxVisibleParticipants - 1
  );
  const additionalParticipants = Math.max(
    0,
    remoteParticipants.length - (maxVisibleParticipants - 1)
  );

  const handleLeaveCall = () => {
    leaveRoom();
    router.push("/");
  };

  const handleToggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    toggleMicrophone(newMuteState);
  };

  const handleToggleCamera = () => {
    setIsCameraOff(!isCameraOff);
    localParticipant?.stream
      ?.getVideoTracks()
      .forEach((track) => (track.enabled = isCameraOff));
  };

  const isParticipantMuted = (participant: any) => {
    return !participant.stream?.getAudioTracks()[0]?.enabled;
  };

  const handleParticipantClick = async (externalId: string) => {
    try {
      const peerData = await getPeerByUuid(externalId);
      setSelectedPeer(peerData);
    } catch (error) {
      console.error("Error fetching peer data:", error);
      setSelectedPeer(null);
    }
  };

  const handleSendUSDT = async () => {
    if (selectedPeer && selectedPeer.metamaskWallet) {
      try {
        const success = await sendUSDT(selectedPeer.metamaskWallet, usdtAmount);
        setUsdtAmount("");
        setSelectedPeer(null);

        if (success) {
          // Send a special chat message for money transfer
          actions.sendChatMessage(
            JSON.stringify({
              type: "moneyTransfer",
              amount: usdtAmount,
              recipient: selectedPeer.displayName,
            } as MoneyTransferMessage)
          );
        } else {
          // Show an error notification
          toast.error("Failed to send USDT");
        }
      } catch (error) {
        console.error("Error sending USDT:", error);
        toast.error("Error sending USDT");
      }
    }
  };

  if (error) {
    return <div className="text-red-500 text-center p-4">{error.message}</div>;
  }

  if (isLoading) {
    return <div className="text-center p-4">Loading video connection...</div>;
  }

  return (
    <div className="bg-gray-900 h-screen w-screen p-6 items-start justify-start relative">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Visible Participants */}
        {visibleParticipants.map((p) => (
          <div
            key={p.id}
            className="aspect-square bg-gray-800 rounded-lg overflow-hidden relative cursor-pointer"
            style={{ minWidth: "150px", maxWidth: "300px" }}
            onClick={() => handleParticipantClick(p.externalId ?? "")}
          >
            {p.stream ? (
              <VideoView
                stream={p.stream}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                No video
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm flex items-center">
              {p.displayName || "Guest"}
              {isParticipantMuted(p) && <MicOff size={16} className="ml-2" />}
            </div>
          </div>
        ))}

        {/* Local Participant */}
        <div
          className="aspect-square bg-gray-800 rounded-lg overflow-hidden relative"
          style={{ minWidth: "150px", maxWidth: "300px" }}
        >
          {localParticipant && localParticipant.stream && (
            <VideoView
              stream={localParticipant.stream}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm flex items-center">
            {displayName || "You"}
            {isMuted && <MicOff size={16} className="ml-2" />}
          </div>
        </div>

        {/* Additional Participants Count */}
        {additionalParticipants > 0 && (
          <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
            +{additionalParticipants}
          </div>
        )}
      </div>

      {/* Selected Peer Information Dialog */}
      <Dialog open={!!selectedPeer} onOpenChange={() => setSelectedPeer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selected Participant</DialogTitle>
            <DialogDescription>
              Details of the selected participant
            </DialogDescription>
          </DialogHeader>
          {selectedPeer && (
            <div className="py-4">
              <p className="mb-2">
                <span className="font-semibold">Display Name:</span>{" "}
                {selectedPeer.displayName}
              </p>
              <p className="mb-4">
                <span className="font-semibold">MetaMask Wallet:</span>{" "}
                {selectedPeer.metamaskWallet}
              </p>
              <div className="space-y-2">
                <Label htmlFor="usdtAmount">USDT Amount</Label>
                <Input
                  id="usdtAmount"
                  type="number"
                  value={usdtAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUsdtAmount(e.target.value)
                  }
                  placeholder="Enter USDT amount"
                />
              </div>
              <Button
                onClick={handleSendUSDT}
                disabled={!account || sendingUSDT || !usdtAmount}
                className="mt-4"
              >
                {sendingUSDT ? "Sending..." : "Send USDT"}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedPeer(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatSidebar
        sendAMessage={actions.sendChatMessage}
        chatMessages={chatMessages}
        localId={localParticipant?.id || ""}
        displayName={displayName}
      />

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
        <button
          onClick={handleLeaveCall}
          className="bg-red-500 p-3 rounded-full text-white hover:bg-red-600"
        >
          <PhoneOff size={24} />
        </button>
        <button
          onClick={handleToggleMute}
          className={`p-3 rounded-full text-white ${
            isMuted
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button
          onClick={handleToggleCamera}
          className={`p-3 rounded-full text-white ${
            isCameraOff
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
      </div>
    </div>
  );
};

export default MyVideoApp;
