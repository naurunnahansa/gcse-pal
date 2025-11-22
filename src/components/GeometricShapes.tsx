import React from 'react';

interface GeometricShapesProps {
  className?: string;
}

export function GeometricShapes({ className }: GeometricShapesProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {/* Large Orange Circle */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary opacity-10 mix-blend-multiply" />
      
      {/* Off-Black Square */}
      <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-foreground opacity-5 rotate-12" />
      
      {/* Triangle (using CSS borders) */}
      <div 
        className="absolute top-[20%] left-[10%] w-0 h-0 border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-b-[100px] border-b-primary opacity-10 rotate-[-15deg]" 
      />
      
      {/* Small Circle */}
      <div className="absolute bottom-[30%] right-[20%] w-[100px] h-[100px] rounded-full bg-foreground opacity-5" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
    </div>
  );
}
