"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Loading from "../loading";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";

const WherebyProvider = dynamic(
  () =>
    import("@whereby.com/browser-sdk/react").then((mod) => mod.WherebyProvider),
  { ssr: false }
);

const MyVideoApp = dynamic(() => import("../components/MyVideoApp"), {
  ssr: false,
});

export default function PeersPage() {
  const [isClient, setIsClient] = React.useState(false);
  const searchParams = useSearchParams();
  const displayName = searchParams?.get("displayName") || "Anonymous";
  const uuid = searchParams?.get("uuid");

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Loading />;
  }

  return (
    <>
      <WherebyProvider>
        <MyVideoApp
          roomUrl="https://yeahyeah.whereby.com/adasdasdb9eaab0a-e7ce-457b-b5e0-cbc46b1095c3"
          displayName={displayName}
          externalId={uuid || ""}
        />
      </WherebyProvider>
      <Toaster />
    </>
  );
}
