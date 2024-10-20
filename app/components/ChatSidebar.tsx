import React, { useState, useEffect, useRef, useMemo } from "react";
import { MessageCircle, ChevronDown, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@whereby.com/browser-sdk/react";
import toast from "react-hot-toast";

interface Message {
  id: number;
  text: string;
  sender: "user" | "other";
}

interface ChatMessageData {
  type: "chat" | "moneyTransfer";
  text: string;
  senderName: string;
  amount?: string;
  recipient?: string;
}

const ChatSidebar: React.FC<{
  sendAMessage: (text: string) => void;
  chatMessages: ChatMessage[];
  localId: string;
  displayName: string;
}> = ({ sendAMessage, chatMessages, localId, displayName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    console.log({ chatMessages });
    setMessages(
      chatMessages.map((message, index) => ({
        id: index, // Fallback to current timestamp if message.timestamp is undefined
        text: message.text,
        sender: message.senderId === localId ? "user" : "other",
      }))
    );
  }, [chatMessages, localId]);

  useEffect(() => {
    if (!isOpen && chatMessages.length > messages.length) {
      setUnreadCount(chatMessages.length - messages.length);
    }
  }, [chatMessages, messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const sendMessage = () => {
    if (inputText.trim()) {
      const messageData: ChatMessageData = {
        type: "chat",
        text: inputText,
        senderName: displayName,
      };
      sendAMessage(JSON.stringify(messageData));
      setInputText("");
    }
  };

  const renderMessage = (message: ChatMessage, key: string) => {
    try {
      const parsedMessage: ChatMessageData = JSON.parse(message.text);

      if (parsedMessage.type === "moneyTransfer") {
        toast.success(
          `Sent ${parsedMessage.amount} USDT to ${parsedMessage.recipient}`
        );
        return null;
      }

      return (
        <div key={key} className="mb-2">
          <span className="font-bold">{parsedMessage.senderName}: </span>
          {parsedMessage.text}
        </div>
      );
    } catch (e) {
      // Fallback for non-JSON messages (if any)
      return (
        <div key={key} className="mb-2">
          <span className="font-bold">
            {message.senderId === localId ? "You" : "Unknown"}:{" "}
          </span>
          {message.text}
        </div>
      );
    }
  };

  const messagess = useMemo(() => {
    return chatMessages.map((m, i) => renderMessage(m, i + ""));
  }, [chatMessages]);

  return (
    <>
      <button
        className={cn(
          "fixed bottom-6 right-6 bg-blue-500 text-white p-4 rounded-full shadow-lg z-20 hover:bg-blue-600 transition-colors duration-300",
          isOpen && "hidden"
        )}
        onClick={() => setIsOpen(true)}
      >
        <div className="relative">
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-3 w-3" />
          )}
        </div>
      </button>
      <div
        className={cn(
          "fixed right-0 bottom-0 h-[90vh] w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col rounded-t-2xl overflow-hidden z-30",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex-grow overflow-y-auto p-4 space-y-4 relative">
          <button
            className="text-gray-500 focus:outline-none hover:bg-gray-100 p-2 rounded-full transition-colors duration-300 absolute top-2 right-2"
            onClick={() => setIsOpen(false)}
          >
            <ChevronDown size={24} />
          </button>
          <div className="overflow-y-auto flex-grow">{messagess}</div>
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center bg-white rounded-full shadow-md">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="flex-grow p-3 bg-transparent focus:outline-none"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="p-3 text-blue-500 hover:text-blue-600 focus:outline-none transition-colors duration-300"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;
