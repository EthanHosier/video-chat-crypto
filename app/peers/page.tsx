"use client";

import * as React from "react";
import { WherebyProvider } from "@whereby.com/browser-sdk/react";
import { useLocalStream } from "@/app/hooks/useLocalStream";
import MyVideoApp from "../components/MyVideoApp";

export default function PeersPage() {
  const localStream = useLocalStream();

  if (!localStream) {
    return <div>Loading...</div>;
  }

  return (
    <WherebyProvider>
      <MyVideoApp
        roomUrl="https://yeahyeah.whereby.com/yeahhh315c1fdc-e94c-4a8f-8423-8eff6c0b75c9"
        localStream={localStream}
      />
    </WherebyProvider>
  );
}
