"use server";

import supabase from "./supabase";

export const addPeer = async (
  uuid: string,
  metamaskWallet: string,
  displayName: string
) => {
  const { data, error } = await supabase.from("peers").insert({
    id: uuid,
    metamask_wallet: metamaskWallet,
    display_name: displayName,
  });

  if (error) {
    throw error;
  }

  return data;
};

export const getPeerByUuid = async (uuid: string) => {
  const { data, error } = await supabase
    .from("peers")
    .select("metamask_wallet, display_name")
    .eq("id", uuid)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Peer not found");
  }

  return {
    metamaskWallet: data.metamask_wallet,
    displayName: data.display_name,
  };
};
