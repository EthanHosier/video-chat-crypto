import * as React from "react";
import { useRoomConnection, VideoView } from "@whereby.com/browser-sdk/react";

interface MyVideoAppProps {
  roomUrl: string;
  localStream: MediaStream;
}

const MAX_VISIBLE_PARTICIPANTS = 12;

export default function MyVideoApp({ roomUrl, localStream }: MyVideoAppProps) {
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const { state, actions } = useRoomConnection(roomUrl, {
    localMediaOptions: {
      audio: true,
      video: true,
    },
  });

  const { remoteParticipants, localParticipant } = state;
  const { joinRoom, leaveRoom } = actions;

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
    MAX_VISIBLE_PARTICIPANTS - 1
  );
  const additionalParticipants = Math.max(
    0,
    remoteParticipants.length - (MAX_VISIBLE_PARTICIPANTS - 1)
  );

  if (error) {
    return <div className="text-red-500 text-center p-4">{error.message}</div>;
  }

  if (isLoading) {
    return <div className="text-center p-4">Loading video connection...</div>;
  }

  return (
    <div className="bg-gray-900 h-screen w-screen p-6 items-start justify-start">
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
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
              {p.displayName || "Guest"}
            </div>
          </div>
        ))}

        {/* Placeholder Participants */}
        {Array.from({ length: 16 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square bg-gray-800 rounded-lg overflow-hidden relative"
            style={{ minWidth: "150px", maxWidth: "300px" }}
          >
            <div className="w-full h-full flex items-center justify-center text-white">
              No video
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
              Guest
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
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
            You
          </div>
        </div>

        {/* Additional Participants Count */}
        {additionalParticipants > 0 && (
          <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
            +{additionalParticipants}
          </div>
        )}
      </div>
    </div>
  );
}
