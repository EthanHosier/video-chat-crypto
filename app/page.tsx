"use client";

/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { useForm } from "react-hook-form";
import { useMetaMaskLogin } from "../hooks/useMetaMask";
import { useRouter } from "next/navigation";
import { addPeer } from "../lib/actions";
import { v4 as uuidv4 } from "uuid";

type FormData = {
  displayName: string;
};

export default function Example() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const { account, connectWallet, loading } = useMetaMaskLogin();
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    const uuid = uuidv4(); // Generate a UUID for the peer
    try {
      await addPeer(uuid, account || "", data.displayName);
      router.push(
        `/room?displayName=${encodeURIComponent(data.displayName)}&uuid=${uuid}`
      );
    } catch (error) {
      console.error("Error adding peer:", error);
      // Handle the error appropriately, e.g., show an error message to the user
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Enter your display name
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Display Name
              </label>
              <div className="mt-2">
                <input
                  id="displayName"
                  {...register("displayName", { required: true, minLength: 3 })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                />
                {errors.displayName && (
                  <p className="mt-2 text-sm text-red-600">
                    Display name must be at least 3 characters long
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Enter Room
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={connectWallet}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              disabled={loading}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/1024px-MetaMask_Fox.svg.png"
                alt="MetaMask Fox"
                className="h-5 w-5"
              />
              {loading
                ? "Loading..."
                : account
                ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
                : "Connect with MetaMask (Optional)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
