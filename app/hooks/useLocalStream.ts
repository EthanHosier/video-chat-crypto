import { useState, useEffect } from "react";

export function useLocalStream() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function getMediaStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    }

    getMediaStream();
  }, []);

  return localStream;
}
