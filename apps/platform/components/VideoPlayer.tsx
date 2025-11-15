'use client';

import React from 'react';
import '@mux/mux-player/themes/minimal';
import { Loader2, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  muxStatus?: string;
  title?: string;
  poster?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  muxStatus = 'none',
  title,
  poster,
  className = '',
  autoplay = false,
  muted = false,
}) => {
  // If video is not ready, show loading or error state
  if (muxStatus === 'processing' || muxStatus === 'preparing') {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg aspect-video ${className}`}>
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-sm text-gray-600">
            {muxStatus === 'preparing' ? 'Preparing video...' : 'Processing video...'}
          </p>
          <p className="text-xs text-gray-500">
            This may take a few minutes
          </p>
        </div>
      </div>
    );
  }

  if (muxStatus === 'error') {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded-lg aspect-video ${className}`}>
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <p className="text-sm text-red-600">Video unavailable</p>
          <p className="text-xs text-red-500">
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  if (!videoUrl || muxStatus !== 'ready') {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg aspect-video ${className}`}>
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No video available</p>
        </div>
      </div>
    );
  }

  // Extract playback ID from Mux URL
  // Mux URLs are typically: https://stream.mux.com/{playbackId}.m3u8
  const playbackId = videoUrl.split('/').pop()?.replace('.m3u8', '');

  if (!playbackId) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded-lg aspect-video ${className}`}>
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <p className="text-sm text-red-600">Invalid video format</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <video
          src={videoUrl}
          controls
          playsInline
          poster={poster}
          autoPlay={autoplay}
          muted={muted}
          className="w-full h-full"
          style={{ objectFit: 'contain' }}
          title={title}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};