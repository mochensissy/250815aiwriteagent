/**
 * 懒加载图片组件
 * 
 * 支持图片懒加载、占位符、错误处理
 * 提升页面加载性能
 */

import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  errorFallback,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用Intersection Observer实现懒加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const defaultPlaceholder = (
    <div className="flex items-center justify-center bg-gray-100 text-gray-400">
      <ImageIcon className="w-8 h-8" />
    </div>
  );

  const defaultErrorFallback = (
    <div className="flex items-center justify-center bg-red-50 text-red-400">
      <AlertCircle className="w-8 h-8" />
    </div>
  );

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {!isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder || defaultPlaceholder}
        </div>
      )}
      
      {isInView && !hasError && (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              {placeholder || defaultPlaceholder}
            </div>
          )}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {errorFallback || defaultErrorFallback}
        </div>
      )}
    </div>
  );
};

export default LazyImage;

