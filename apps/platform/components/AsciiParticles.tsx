"use client";

import { useEffect, useRef } from 'react';

interface Particle {
  char: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
}

const AsciiParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  const asciiChars = "!@#$%^&*()_+-=[]{}|;:,.<>?~`0123456789";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const particleCount = 80;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      char: asciiChars[Math.floor(Math.random() * asciiChars.length)],
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 1.5 + 0.5, // Faster particles
      opacity: Math.random() * 0.6 + 0.2
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Update particle position
        particle.y -= particle.speed;

        // Reset particle if it goes off screen
        if (particle.y < -20) {
          particle.y = canvas.height + 20;
          particle.x = Math.random() * canvas.width;
          particle.char = asciiChars[Math.floor(Math.random() * asciiChars.length)];
        }

        // Draw particle
        ctx.font = '12px monospace';
        ctx.fillStyle = `rgba(251, 146, 60, ${particle.opacity})`; // Orange color
        ctx.fillText(particle.char, particle.x, particle.y);
      });

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
      className="absolute inset-0 pointer-events-none opacity-30"
      style={{ zIndex: 1 }}
    />
  );
};

export default AsciiParticles;