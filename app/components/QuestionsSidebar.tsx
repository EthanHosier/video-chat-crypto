import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, Send } from "lucide-react";

interface QuestionsSidebarProps {
  onSubmit: (question: string, answer: string) => void;
}

const QuestionsSidebar: React.FC<QuestionsSidebarProps> = ({ onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (question.trim() && answer.trim()) {
      onSubmit(question, answer);
      setQuestion("");
      setAnswer("");
    }
  };

  return (
    <>
      <button
        className={cn(
          "fixed bottom-6 left-6 bg-purple-500 text-white p-4 rounded-full shadow-lg z-20 hover:bg-purple-600 transition-colors duration-300",
          isOpen && "hidden"
        )}
        onClick={() => setIsOpen(true)}
      >
        Q
      </button>
      <div
        className={cn(
          "fixed left-0 bottom-0 h-[90vh] w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col rounded-t-2xl overflow-hidden z-30",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex-grow overflow-y-auto p-4 space-y-4 relative">
          <button
            className="text-gray-500 focus:outline-none hover:bg-gray-100 p-2 rounded-full transition-colors duration-300 absolute top-2 right-2"
            onClick={() => setIsOpen(false)}
          >
            <ChevronUp size={24} />
          </button>
          <h2 className="text-xl font-bold">Submit Question</h2>
          <div className="space-y-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter question..."
              rows={3}
            />
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter answer..."
              rows={3}
            />
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            className="w-full bg-purple-500 text-white p-3 rounded-full hover:bg-purple-600 transition-colors duration-300 flex items-center justify-center"
          >
            <Send size={20} className="mr-2" />
            Submit Question
          </button>
        </div>
      </div>
    </>
  );
};

export default QuestionsSidebar;
