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
        roomUrl="https://yeahyeah.whereby.com/test100363d44-36dc-43ae-93b3-09dd1c6567a0"
        localStream={localStream}
      />
    </WherebyProvider>
  );
}
