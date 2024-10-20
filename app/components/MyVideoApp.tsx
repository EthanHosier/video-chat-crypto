"use client";

import React, { useState } from "react";
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
import Image from "next/image";
import QuestionsSidebar from "./QuestionsSidebar";
import QuestionBanner from "./QuestionBanner";
import Confetti from "react-confetti";

type MoneyTransferMessage = {
  type: "moneyTransfer";
  amount: string;
  recipient: string;
  senderName: string;
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
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  const { state, actions } = useRoomConnection(roomUrl, {
    localMediaOptions: {
      audio: true,
      video: true,
    },
    externalId,
  });

  const { remoteParticipants, localParticipant, chatMessages } = state;
  const { joinRoom, leaveRoom, toggleMicrophone } = actions;
  const [showConfetti, setShowConfetti] = useState(false);

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
          actions.sendChatMessage(
            JSON.stringify({
              type: "moneyTransfer",
              amount: usdtAmount,
              recipient: selectedPeer.displayName,
              senderName: displayName,
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

  const handleQuestionSubmit = (question: string, answer: string) => {
    actions.sendChatMessage(
      JSON.stringify({
        type: "question",
        question,
        answer,
      })
    );
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  React.useEffect(() => {
    const handleMessage = (message: any) => {
      try {
        const parsedMessage = JSON.parse(message.text);
        if (parsedMessage.type === "question") {
          setCurrentQuestion(parsedMessage.question);
          setCurrentAnswer(parsedMessage.answer);
        } else if (parsedMessage.type === "correctAnswer") {
          triggerConfetti();
          toast.success(
            `${parsedMessage.displayName} gave the correct answer!`
          );
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    chatMessages.forEach(handleMessage);
  }, [chatMessages]);

  if (error) {
    return <div className="text-red-500 text-center p-4">{error.message}</div>;
  }

  if (isLoading) {
    return <div className="text-center p-4">Loading video connection...</div>;
  }

  return (
    <div className="bg-gray-900 h-screen w-screen flex flex-col">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      {/* Updated Responsive Banner with Smaller Buttons */}
      <div className="bg-[#3478F3] text-white py-4 px-4 sm:px-6 md:px-8 flex flex-row items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3 mb-3 sm:mb-0">
          <div className="relative">
            <img
              src="https://media.istockphoto.com/id/1442556244/photo/portrait-of-young-beautiful-woman-with-perfect-smooth-skin-isolated-over-white-background.jpg?s=612x612&w=0&k=20&c=4S7HufG4HDXznwuxFdliWndEAcWGKGvgqC45Ig0Zqog="
              alt={displayName}
              width={48}
              height={48}
              className="rounded-full border-2 border-white aspect-square object-cover"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <span className="font-semibold text-lg">{displayName}</span>
            <p className="text-xs text-blue-100">Online</p>
          </div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-full py-2 px-3 flex items-center space-x-2">
          <img
            src="https://thegivingblock.com/wp-content/uploads/2023/02/TetherUSDT.png"
            alt="USDT"
            width={20}
            height={20}
          />
          <span className="font-bold text-base">400 USDT</span>
        </div>
      </div>

      <div className="flex-grow p-6 items-start justify-start relative">
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
        <Dialog
          open={!!selectedPeer}
          onOpenChange={() => setSelectedPeer(null)}
        >
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
          currentQuestion={currentQuestion}
          currentAnswer={currentAnswer}
        />

        {account === process.env.NEXT_PUBLIC_ADMIN_WALLET && (
          <QuestionsSidebar onSubmit={handleQuestionSubmit} />
        )}

        {currentQuestion && <QuestionBanner question={currentQuestion} />}

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
    </div>
  );
};

export default MyVideoApp;
