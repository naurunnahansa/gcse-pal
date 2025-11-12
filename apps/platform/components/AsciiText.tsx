"use client";

import { useEffect, useRef, useState } from 'react';

interface AsciiTextProps {
  text?: string;
  className?: string;
  speed?: number;
  characters?: string;
}

const AsciiText: React.FC<AsciiTextProps> = ({
  text = "GCSE PAL",
  className = "",
  speed = 0.01,
  characters = "!@#$%^&*()_+-=[]{}|;:,.<>?~`"
}) => {
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const animationRef = useRef<NodeJS.Timeout>();

  // ASCII art representations of letters
  const asciiLetters: { [key: string]: string[] } = {
    'G': [
      "  ██████  ",
      " ██    ██ ",
      " ██  █ ██ ",
      " ████████ ",
      " ██     ██",
      " ██     ██",
      "  ███████ "
    ],
    'C': [
      "   ██████ ",
      " ██       ",
      " ██       ",
      " ██       ",
      " ██       ",
      " ██       ",
      "   ██████ "
    ],
    'S': [
      "  ███████ ",
      " ██     ██",
      " ██      ",
      "   █████  ",
      "      ██ ",
      " ██     ██",
      "  ███████ "
    ],
    'E': [
      " ████████ ",
      " ██       ",
      " ██       ",
      " ██████   ",
      " ██       ",
      " ██       ",
      " ████████ "
    ],
    'P': [
      " ████████ ",
      " ██     ██",
      " ██     ██",
      " ████████ ",
      " ██       ",
      " ██       ",
      " ██       "
    ],
    'A': [
      "     ██   ",
      "    ████  ",
      "   ██  ██ ",
      " ██    ██ ",
      " ████████ ",
      " ██    ██ ",
      " ██    ██ "
    ],
    'L': [
      " ██       ",
      " ██       ",
      " ██       ",
      " ██       ",
      " ██       ",
      " ██       ",
      " ████████ "
    ],
    ' ': [
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
      "         "
    ]
  };

  const getRandomChar = () => characters[Math.floor(Math.random() * characters.length)];

  const generateRandomizedLines = (originalLines: string[]): string[] => {
    return originalLines.map(line =>
      line.split('').map(char =>
        char === ' ' ? ' ' : getRandomChar()
      ).join('')
    );
  };

  const morphToTarget = (currentLines: string[], targetLines: string[], step: number): string[] => {
    if (step >= 10) return targetLines;

    return currentLines.map((line, i) =>
      line.split('').map((char, j) => {
        if (targetLines[i][j] === ' ') return ' ';
        if (char === targetLines[i][j]) return char;
        return Math.random() > 0.3 ? targetLines[i][j] : getRandomChar();
      }).join('')
    );
  };

  useEffect(() => {
    const words = text.toUpperCase().split(' ');
    let allAsciiLines: string[] = [];

    // Generate ASCII art for the entire text
    words.forEach((word, wordIndex) => {
      const wordAsciiLines: string[][] = [];

      for (let i = 0; i < 7; i++) {
        wordAsciiLines[i] = "";
      }

      word.split('').forEach(letter => {
        const letterAscii = asciiLetters[letter] || asciiLetters[' '];
        letterAscii.forEach((line, lineIndex) => {
          wordAsciiLines[lineIndex] += line + "  ";
        });
      });

      if (wordIndex > 0) {
        // Add space between words
        wordAsciiLines.forEach((line, i) => {
          wordAsciiLines[i] = "     " + line;
        });
      }

      allAsciiLines.push(...wordAsciiLines);
    });

    let animationStep = 0;
    let currentLines = generateRandomizedLines(allAsciiLines);

    const animate = () => {
      if (animationStep < 10) {
        currentLines = morphToTarget(currentLines, allAsciiLines, animationStep);
        setDisplayedText([...currentLines]);
        animationStep++;
      } else {
        // Start random morphing - more frequent and faster
        if (Math.random() > 0.3) {
          const morphCount = Math.floor(Math.random() * 3) + 1; // 1-3 characters at once
          for (let i = 0; i < morphCount; i++) {
            const randomLine = Math.floor(Math.random() * currentLines.length);
            const randomChar = Math.floor(Math.random() * currentLines[0].length);
            if (allAsciiLines[randomLine][randomChar] !== ' ') {
              currentLines[randomLine] = currentLines[randomLine].substring(0, randomChar) +
                                        getRandomChar() +
                                        currentLines[randomLine].substring(randomChar + 1);
            }
          }
          setDisplayedText([...currentLines]);
        }
      }
    };

    animationRef.current = setInterval(animate, speed);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [text, speed, characters]);

  return (
    <div className={`ascii-text ${className}`}>
      <pre className="text-primary/10 font-mono text-xs leading-tight select-none overflow-hidden">
        {displayedText.map((line, index) => (
          <div key={index} className="whitespace-pre">
            {line}
          </div>
        ))}
      </pre>
    </div>
  );
};

export default AsciiText;
