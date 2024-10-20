"use client";

import * as React from "react";
import { WherebyProvider } from "@whereby.com/browser-sdk/react";
import { useLocalStream } from "@/app/hooks/useLocalStream";
import MyVideoApp from "../components/MyVideoApp";
import { useSearchParams } from "next/navigation";
import Loading from "../loading";
import { useMetaMaskLogin } from "@/hooks/useMetaMask";
import { Toaster } from "react-hot-toast";

export default function PeersPage() {
  const localStream = useLocalStream();
  const searchParams = useSearchParams();
  const displayName = searchParams.get("displayName") || "Anonymous";
  const uuid = searchParams.get("uuid");
  const { account } = useMetaMaskLogin();

  if (!localStream) {
    return <Loading />;
  }

  if (!account) {
    return <div>loading...</div>;
  }

  console.log(account);

  return (
    <WherebyProvider>
      <MyVideoApp
        roomUrl="https://yeahyeah.whereby.com/test100363d44-36dc-43ae-93b3-09dd1c6567a0"
        localStream={localStream}
        displayName={displayName}
        externalId={uuid || ""}
      />
      <Toaster />
    </WherebyProvider>
  );
}
