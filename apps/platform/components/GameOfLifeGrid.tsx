"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

const GameOfLifeGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<boolean[][]>([]);
  const animationFrameRef = useRef<number>();
  const isVisibleRef = useRef(true);
  const lastUpdateRef = useRef(0);

  const cellSize = 12; // Increased cell size for better performance
  const liveChars = ['@', '#', '$', '%', '&', '*', '=', '+', '-', '!', '?'];
  const deadChar = '.';
  const updateInterval = 100; // Update every 100ms instead of every frame

  const initializeGrid = (width: number, height: number) => {
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);

    // Start with mostly empty grid (90% dead cells)
    gridRef.current = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => Math.random() > 0.9)
    );

    // Add a few random "seed" patterns that are known to grow well
    const seedPatterns = [
      // Block pattern (2x2 block)
      [[0,0], [0,1], [1,0], [1,1]],
      // Blinker pattern (3x1 line)
      [[0,0], [0,1], [0,2]],
      // Glider pattern (small spaceship)
      [[0,1], [1,2], [2,0], [2,1], [2,2]],
      // Horizontal line
      [[0,0], [0,1], [0,2], [0,3]]
    ];

    // Place 3-5 random seed patterns
    const numSeeds = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numSeeds; i++) {
      const pattern = seedPatterns[Math.floor(Math.random() * seedPatterns.length)];
      const startRow = Math.floor(Math.random() * (rows - 3));
      const startCol = Math.floor(Math.random() * (cols - 4));

      pattern.forEach(([dr, dc]) => {
        const row = (startRow + dr + rows) % rows;
        const col = (startCol + dc + cols) % cols;
        gridRef.current[row][col] = true;
      });
    }
  };

  const countNeighbors = useCallback((grid: boolean[][], row: number, col: number) => {
    let count = 0;
    const rows = grid.length;
    const cols = grid[0].length;

    // Optimized neighbor counting with manual bounds checking
    const rowMinus1 = row === 0 ? rows - 1 : row - 1;
    const rowPlus1 = row === rows - 1 ? 0 : row + 1;
    const colMinus1 = col === 0 ? cols - 1 : col - 1;
    const colPlus1 = col === cols - 1 ? 0 : col + 1;

    // Check all 8 neighbors
    if (grid[rowMinus1][colMinus1]) count++;
    if (grid[rowMinus1][col]) count++;
    if (grid[rowMinus1][colPlus1]) count++;
    if (grid[row][colMinus1]) count++;
    if (grid[row][colPlus1]) count++;
    if (grid[rowPlus1][colMinus1]) count++;
    if (grid[rowPlus1][col]) count++;
    if (grid[rowPlus1][colPlus1]) count++;

    return count;
  }, []);

  const updateGrid = useCallback(() => {
    const grid = gridRef.current;
    if (!grid || grid.length === 0) return;

    const rows = grid.length;
    const cols = grid[0].length;
    const newGrid = new Array(rows);

    // Conway's Game of Life rules with optimization
    for (let row = 0; row < rows; row++) {
      newGrid[row] = new Array(cols);
      for (let col = 0; col < cols; col++) {
        const neighbors = countNeighbors(grid, row, col);
        const isAlive = grid[row][col];

        if (isAlive) {
          // Any live cell with 2 or 3 neighbors survives
          newGrid[row][col] = neighbors === 2 || neighbors === 3;
        } else {
          // Any dead cell with exactly 3 neighbors becomes alive
          newGrid[row][col] = neighbors === 3;
        }
      }
    }

    // Very rare random mutations (like cosmic rays) - only 1 in 2000 chance
    if (Math.random() < 0.0005) {
      const randomRow = Math.floor(Math.random() * rows);
      const randomCol = Math.floor(Math.random() * cols);
      newGrid[randomRow][randomCol] = true;
    }

    gridRef.current = newGrid;
  }, [countNeighbors]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const grid = gridRef.current;
    const rows = grid.length;
    const cols = grid[0].length;

    ctx.clearRect(0, 0, width, height);
    ctx.font = `${cellSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;

        if (grid[row][col]) {
          // Live cell - create denser ASCII patterns
          const neighbors = countNeighbors(grid, row, col);
          let pattern = '';

          if (neighbors >= 3) {
            pattern = liveChars[Math.floor(Math.random() * 3)]; // Use @ # $ for high density
          } else if (neighbors >= 2) {
            pattern = liveChars[3 + Math.floor(Math.random() * 3)]; // Use % & * for medium density
          } else {
            pattern = liveChars[6 + Math.floor(Math.random() * 4)]; // Use = + - ! ? for low density
          }

          ctx.fillStyle = `rgba(251, 146, 60, ${0.15 + Math.random() * 0.25})`;
          ctx.fillText(pattern, x, y);
        } else {
          // Dead cell - use spaces and dots for emptiness
          const useDot = Math.random() > 0.7;
          if (useDot) {
            ctx.fillStyle = `rgba(156, 163, 175, ${0.08 + Math.random() * 0.12})`;
            ctx.fillText(deadChar, x, y);
          }
        }
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * 2; // Reduced from 3x to 2x for performance
      canvas.height = rect.height * 2;
      initializeGrid(canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Intersection Observer for performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    // Auto-scroll the Game of Life background
    let scrollX = 0;
    let scrollY = 0;
    let scrollSpeedX = 0.3; // Reduced speed
    let scrollSpeedY = 0.2; // Reduced speed

    let lastUpdateTime = 0;
    const animate = (timestamp: number) => {
      if (!isVisibleRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Update scroll position
      scrollX += scrollSpeedX;
      scrollY += scrollSpeedY;

      // Wrap scroll position
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (scrollX > rect.width) scrollX = 0;
        if (scrollY > rect.height) scrollY = 0;
      }

      // Update grid based on time interval, not frame count
      if (timestamp - lastUpdateTime > updateInterval) {
        updateGrid();
        lastUpdateTime = timestamp;
      }

      // Clear and draw with scroll offset
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(-scrollX, -scrollY);
      drawGrid(ctx, canvas.width, canvas.height);
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      observer.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateGrid, updateInterval]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default GameOfLifeGrid;