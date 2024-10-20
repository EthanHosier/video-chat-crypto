import * as React from "react";
import { useRoomConnection, VideoView } from "@whereby.com/browser-sdk/react";
import ChatSidebar from "./ChatSidebar";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface MyVideoAppProps {
  roomUrl: string;
  localStream: MediaStream;
  displayName: string; // Add this prop to receive the desired display name
}

export default function MyVideoApp({
  roomUrl,
  localStream,
  displayName,
}: MyVideoAppProps) {
  const router = useRouter();
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [maxVisibleParticipants, setMaxVisibleParticipants] = React.useState(6);
  const [isMuted, setIsMuted] = React.useState(true);
  const [isCameraOff, setIsCameraOff] = React.useState(false);

  const { state, actions } = useRoomConnection(roomUrl, {
    localMediaOptions: {
      audio: true,
      video: true,
    },
  });

  const { remoteParticipants, localParticipant, chatMessages } = state;
  const { joinRoom, leaveRoom, toggleMicrophone } = actions;

  const updateMaxVisibleParticipants = React.useCallback(() => {
    const width = window.innerWidth;
    if (width < 640) {
      // Small phones
      setMaxVisibleParticipants(7);
    } else if (width < 768) {
      // Large phones
      setMaxVisibleParticipants(4);
    } else if (width < 1024) {
      // Tablets
      setMaxVisibleParticipants(6);
    } else {
      // Desktops and larger screens
      setMaxVisibleParticipants(8);
    }
  }, []);

  React.useEffect(() => {
    updateMaxVisibleParticipants();
    window.addEventListener("resize", updateMaxVisibleParticipants);
    return () =>
      window.removeEventListener("resize", updateMaxVisibleParticipants);
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
            className="aspect-square bg-gray-800 rounded-lg overflow-hidden relative"
            style={{ minWidth: "150px", maxWidth: "300px" }}
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
      <ChatSidebar
        sendAMessage={actions.sendChatMessage}
        chatMessages={chatMessages}
        localId={localParticipant?.id || ""}
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
}
