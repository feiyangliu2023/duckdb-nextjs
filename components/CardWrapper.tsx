import React, { ReactNode } from 'react';

interface CardWrapperProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const CardWrapper: React.FC<CardWrapperProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default CardWrapper;