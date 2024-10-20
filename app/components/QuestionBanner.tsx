import React from "react";

interface QuestionBannerProps {
  question: string;
}

const QuestionBanner: React.FC<QuestionBannerProps> = ({ question }) => {
  return (
    <div className="fixed top-[80px] left-0 right-0 bg-blue-500 text-white p-4 text-center">
      <p>{question}</p>
    </div>
  );
};

export default QuestionBanner;
