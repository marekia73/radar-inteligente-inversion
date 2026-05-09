import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface SafeChartContainerProps {
  children: ReactNode;
  minHeight?: number;
  className?: string;
}

export const SafeChartContainer: React.FC<SafeChartContainerProps> = ({ 
  children, 
  minHeight = 280, 
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setIsReady(true);
        }
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`w-full relative ${className}`} 
      style={{ height: minHeight, minHeight, minWidth: 0 }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
          Preparando gráfico...
        </div>
      )}
      {isReady && (
        <div style={{ width: '100%', height: '100%' }}>
          {children}
        </div>
      )}
    </div>
  );
};

