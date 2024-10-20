import React, { useState, useEffect, useRef, useMemo } from "react";
import { MessageCircle, ChevronDown, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@whereby.com/browser-sdk/react";
import toast from "react-hot-toast";
import Confetti from "react-confetti";

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

type MoneyTransferMessage = {
  type: "moneyTransfer";
  amount: string;
  recipient: string;
  senderName: string;
};

interface ChatSidebarProps {
  sendAMessage: (text: string) => void;
  chatMessages: ChatMessage[];
  localId: string;
  displayName: string;
  currentQuestion: string | null;
  currentAnswer: string | null;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sendAMessage,
  chatMessages,
  localId,
  displayName,
  currentQuestion,
  currentAnswer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [processedTransfers, setProcessedTransfers] = useState<
    Set<ChatMessage>
  >(new Set());

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

  useEffect(() => {
    chatMessages.forEach((message) => {
      try {
        const parsedMessage: ChatMessageData = JSON.parse(message.text);
        if (
          parsedMessage.type === "moneyTransfer" &&
          !processedTransfers.has(message)
        ) {
          triggerMoneyConfetti();
          toast.success(
            `${parsedMessage.senderName} sent ${parsedMessage.amount} USDT to ${parsedMessage.recipient}`
          );
          setProcessedTransfers((prev) => new Set(prev).add(message));
        }
      } catch (e) {
        // Ignore parsing errors for non-JSON messages
      }
    });
  }, [chatMessages, processedTransfers]);

  const sendMessage = () => {
    if (inputText.trim()) {
      const messageData: ChatMessageData = {
        type: "chat",
        text: inputText,
        senderName: displayName,
      };
      sendAMessage(JSON.stringify(messageData));

      // Check if the answer is correct
      if (
        currentQuestion &&
        currentAnswer &&
        inputText.trim().toLowerCase() === currentAnswer.toLowerCase()
      ) {
        triggerCorrectAnswerConfetti();
        toast.success(`Correct answer! Well done, ${displayName}!`);
      }

      setInputText("");
    }
  };

  const triggerMoneyConfetti = () => {
    console.log("Triggering money confetti");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const triggerCorrectAnswerConfetti = () => {
    console.log("Triggering correct answer confetti");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const renderMessage = (message: ChatMessage, key: string) => {
    try {
      const parsedMessage: ChatMessageData = JSON.parse(message.text);

      if (parsedMessage.type === "moneyTransfer") {
        return (
          <div key={key} className="mb-2 text-green-500 font-bold">
            Money Transfer: {parsedMessage.senderName} sent{" "}
            {parsedMessage.amount} USDT to {parsedMessage.recipient}
          </div>
        );
      }

      return (
        <div key={key} className="mb-2">
          <span className="font-bold">{parsedMessage.senderName}: </span>
          {parsedMessage.text}
        </div>
      );
    } catch (e) {
      console.error("Error parsing message:", e);
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
    console.log("Rendering messages:", chatMessages);
    return chatMessages.map((m, i) => renderMessage(m, i + ""));
  }, [chatMessages]);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          confettiSource={{
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            w: 0,
            h: 0,
          }}
          colors={["#85bb65", "#85bb65", "#85bb65", "#FFD700"]} // Green and gold colors for money
        />
      )}
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
