"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

const GameOfLifeGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<boolean[][]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const isVisibleRef = useRef(true);
  const lastUpdateRef = useRef(0);

  const cellSize = 12;
  const liveChars = ['@', '#', '$', '%', '&', '*', '=', '+', '-', '!', '?'];
  const deadChar = '.';
  const updateInterval = 100;

  const initializeGrid = (width: number, height: number) => {
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);

    gridRef.current = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => Math.random() > 0.9)
    );

    const seedPatterns = [
      [[0,0], [0,1], [1,0], [1,1]],
      [[0,0], [0,1], [0,2]],
      [[0,1], [1,2], [2,0], [2,1], [2,2]],
      [[0,0], [0,1], [0,2], [0,3]]
    ];

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

    const rowMinus1 = row === 0 ? rows - 1 : row - 1;
    const rowPlus1 = row === rows - 1 ? 0 : row + 1;
    const colMinus1 = col === 0 ? cols - 1 : col - 1;
    const colPlus1 = col === cols - 1 ? 0 : col + 1;

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

    for (let row = 0; row < rows; row++) {
      newGrid[row] = new Array(cols);
      for (let col = 0; col < cols; col++) {
        const neighbors = countNeighbors(grid, row, col);
        const isAlive = grid[row][col];

        if (isAlive) {
          newGrid[row][col] = neighbors === 2 || neighbors === 3;
        } else {
          newGrid[row][col] = neighbors === 3;
        }
      }
    }

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
          const neighbors = countNeighbors(grid, row, col);
          let pattern = '';

          if (neighbors >= 3) {
            pattern = liveChars[Math.floor(Math.random() * 3)];
          } else if (neighbors >= 2) {
            pattern = liveChars[3 + Math.floor(Math.random() * 3)];
          } else {
            pattern = liveChars[6 + Math.floor(Math.random() * 4)];
          }

          ctx.fillStyle = `rgba(251, 146, 60, ${0.15 + Math.random() * 0.25})`;
          ctx.fillText(pattern, x, y);
        } else {
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
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      initializeGrid(canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    let scrollX = 0;
    let scrollY = 0;
    let scrollSpeedX = 0.3;
    let scrollSpeedY = 0.2;

    let lastUpdateTime = 0;
    const animate = (timestamp: number) => {
      if (!isVisibleRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      scrollX += scrollSpeedX;
      scrollY += scrollSpeedY;

      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (scrollX > rect.width) scrollX = 0;
        if (scrollY > rect.height) scrollY = 0;
      }

      if (timestamp - lastUpdateTime > updateInterval) {
        updateGrid();
        lastUpdateTime = timestamp;
      }

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
