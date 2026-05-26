import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';

export interface TerminalLine {
  text: string;
  color?: 'white' | 'secondary' | 'tertiary' | 'blue' | 'green' | 'empty';
  progressBar?: boolean;
  delay?: number;
}

interface TerminalProps {
  lines: TerminalLine[];
  title?: string;
  loop?: boolean;
  loopDelay?: number;
  typingSpeed?: number;
  className?: string;
  showWindowDots?: boolean;
}

const colorMap = {
  white: '#ffffff',
  secondary: '#888888',
  tertiary: '#555555',
  blue: '#3b82f6',
  green: '#22c55e',
  empty: 'transparent',
};

const cursorTransition: Transition = {
  duration: 0.8,
  repeat: Infinity,
  ease: 'linear',
};

export default function Terminal({
  lines,
  title = 'sorelax refresh',
  loop = true,
  loopDelay = 8000,
  typingSpeed = 80,
  className = '',
  showWindowDots = true,
}: TerminalProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  const reset = useCallback(() => {
    setVisibleLines(0);
    setIsComplete(false);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (visibleLines >= lines.length) {
      setIsComplete(true);
      if (loop) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, loopDelay - elapsed);
        timeoutRef.current = setTimeout(() => {
          setCurrentCycle((c) => c + 1);
          reset();
        }, remaining);
      }
      return;
    }

    const currentLine = lines[visibleLines];
    const delay = currentLine?.delay ?? typingSpeed;

    timeoutRef.current = setTimeout(() => {
      setVisibleLines((prev) => prev + 1);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visibleLines, lines, loop, loopDelay, typingSpeed, reset]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={`w-full max-w-terminal mx-auto ${className}`}>
      {/* Terminal window chrome */}
      <div className="rounded-card border border-border bg-code-bg overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/30 relative">
          <div className="flex items-center gap-2">
            {showWindowDots && (
              <>
                <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
              </>
            )}
          </div>
          <span className="absolute left-1/2 -translate-x-1/2 text-xs text-text-tertiary font-mono">
            {title}
          </span>
          <div className="w-16" />
        </div>

        {/* Terminal content */}
        <div className="p-6 font-mono text-[13px] leading-6 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {lines.slice(0, visibleLines).map((line, index) => {
              if (line.color === 'empty') {
                return <div key={`${currentCycle}-${index}`} className="h-6" />;
              }

              return (
                <motion.div
                  key={`${currentCycle}-${index}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="whitespace-pre-wrap break-all"
                  style={{ color: colorMap[line.color || 'white'] }}
                >
                  {line.progressBar ? (
                    <span className="flex items-center gap-2 flex-wrap">
                      <span style={{ color: colorMap.blue }}>◆</span>
                      <span className="text-white">{line.text.split('  ')[0]?.trim()}</span>
                      <motion.span
                        className="inline-block"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <motion.span
                          className="inline-block overflow-hidden whitespace-nowrap"
                          initial={{ width: 0 }}
                          animate={{ width: 'auto' }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
                        >
                          {'██████████████'}
                        </motion.span>
                      </motion.span>
                      <span style={{ color: colorMap.green }}>✓</span>
                      <span className="text-text-secondary">
                        {line.text.split('✓')[1] || ''}
                      </span>
                    </span>
                  ) : (
                    line.text
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Blinking cursor */}
          {!isComplete && visibleLines > 0 && (
            <motion.span
              className="inline-block w-2 h-4 bg-text-secondary ml-0.5 align-middle"
              animate={{ opacity: [1, 0] }}
              transition={cursorTransition}
            />
          )}
        </div>
      </div>
    </div>
  );
}
