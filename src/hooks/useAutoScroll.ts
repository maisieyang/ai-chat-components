'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoScrollOptions {
  enabled?: boolean;
  behavior?: ScrollBehavior;
  threshold?: number;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const {
    enabled = true,
    behavior = 'smooth',
    threshold = 100
  } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current && enabled) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  }, [enabled, behavior]);

  const checkIfAtBottom = useCallback(() => {
    if (!scrollRef.current) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < threshold;
    isAtBottomRef.current = isAtBottom;
    return isAtBottom;
  }, [threshold]);

  const handleScroll = useCallback(() => {
    checkIfAtBottom();
  }, [checkIfAtBottom]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 自动滚动到底部
  useEffect(() => {
    if (enabled && isAtBottomRef.current) {
      scrollToBottom();
    }
  }, [enabled, scrollToBottom]);

  return {
    scrollRef,
    scrollToBottom,
    isAtBottom: isAtBottomRef.current
  };
}
