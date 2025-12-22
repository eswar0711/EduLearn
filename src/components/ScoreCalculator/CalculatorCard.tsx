// src/components/ScoreCalculator/CalculatorCard.tsx
import React from 'react';

interface CalculatorCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ title, children, className }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 mb-4 ${className ?? ''}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      {children}
    </div>
  );
};

export default CalculatorCard;
