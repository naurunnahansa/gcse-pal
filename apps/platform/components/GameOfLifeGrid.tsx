"use client";

import { useEffect, useRef } from 'react';

const GameOfLifeGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<boolean[][]>([]);
  const animationFrameRef = useRef<number>();

  const cellSize = 8;
  const liveChars = ['@', '#', '$', '%', '&', '*', '=', '+', '-', '!', '?'];
  const deadChar = '.';

  const initializeGrid = (width: number, height: number) => {
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);

    gridRef.current = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => Math.random() > 0.7)
    );
  };

  const countNeighbors = (grid: boolean[][], row: number, col: number) => {
    let count = 0;
    const rows = grid.length;
    const cols = grid[0].length;

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;

        const newRow = (row + i + rows) % rows;
        const newCol = (col + j + cols) % cols;

        if (grid[newRow][newCol]) count++;
      }
    }

    return count;
  };

  const updateGrid = () => {
    const grid = gridRef.current;
    const rows = grid.length;
    const cols = grid[0].length;
    const newGrid = grid.map(row => [...row]);

    // Conway's Game of Life rules
    for (let row = 0; row < rows; row++) {
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

    // Add random mutations
    for (let i = 0; i < 5; i++) {
      const randomRow = Math.floor(Math.random() * rows);
      const randomCol = Math.floor(Math.random() * cols);
      newGrid[randomRow][randomCol] = Math.random() > 0.5;
    }

    gridRef.current = newGrid;
  };

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
      canvas.width = rect.width * 3; // Triple width for scrolling
      canvas.height = rect.height * 3; // Triple height for scrolling
      initializeGrid(canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Auto-scroll the Game of Life background
    let scrollX = 0;
    let scrollY = 0;
    let scrollSpeedX = 0.5;
    let scrollSpeedY = 0.3;

    let frameCount = 0;
    const animate = () => {
      frameCount++;

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

      // Update grid every 60 frames (1 second at 60fps) for much slower evolution
      if (frameCount % 60 === 0) {
        updateGrid();
      }

      // Clear and draw with scroll offset
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(-scrollX, -scrollY);
      drawGrid(ctx, canvas.width, canvas.height);
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default GameOfLifeGrid;