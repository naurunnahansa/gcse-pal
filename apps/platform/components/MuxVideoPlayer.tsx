'use client';

import React, { useState, useRef } from 'react';
import '@mux/mux-player/themes/minimal';
import { Button } from '@/components/ui/button';
import { Upload, Play, Pause, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface MuxVideoPlayerProps {
  lessonId?: string;
  chapterId?: string;
  courseId?: string;
  videoUrl?: string;
  muxStatus?: string;
  onVideoUploadStart?: () => void;
  onVideoUploadComplete?: (videoUrl: string) => void;
  onVideoUploadError?: (error: string) => void;
  editable?: boolean;
  className?: string;
}

export const MuxVideoPlayer: React.FC<MuxVideoPlayerProps> = ({
  lessonId,
  chapterId,
  courseId,
  videoUrl,
  muxStatus = 'none',
  onVideoUploadStart,
  onVideoUploadComplete,
  onVideoUploadError,
  editable = false,
  className = '',
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a video file');
      onVideoUploadError?.('Invalid file type. Please select a video file.');
      return;
    }

    // Validate file size (max 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      setUploadError('Video file must be less than 2GB');
      onVideoUploadError?.('Video file must be less than 2GB');
      return;
    }

    if (!lessonId || !chapterId || !courseId) {
      setUploadError('Missing required identifiers');
      onVideoUploadError?.('Missing required information');
      return;
    }

    await uploadVideo(file);
  };

  const uploadVideo = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    onVideoUploadStart?.();

    try {
      // Create upload URL
      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          chapterId,
          courseId,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create upload URL');
      }

      const { uploadUrl } = result.data;

      // Upload to Mux
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      return new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            setUploadProgress(100);
            onVideoUploadComplete?.('Processing video...');
            resolve();
          } else {
            const error = `Upload failed with status: ${xhr.status}`;
            setUploadError(error);
            onVideoUploadError?.(error);
            reject(new Error(error));
          }
          setIsUploading(false);
        };

        xhr.onerror = () => {
          const error = 'Network error during upload';
          setUploadError(error);
          onVideoUploadError?.(error);
          setIsUploading(false);
          reject(new Error(error));
        };

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      onVideoUploadError?.(errorMessage);
      setIsUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (muxStatus) {
      case 'preparing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (muxStatus) {
      case 'preparing':
        return 'Preparing upload...';
      case 'processing':
        return 'Processing video...';
      case 'ready':
        return 'Video ready';
      case 'error':
        return 'Upload failed';
      default:
        return null;
    }
  };

  if (isUploading) {
    return (
      <div className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Uploading video...</p>
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
          </div>
        </div>
      </div>
    );
  }

  if (videoUrl && muxStatus === 'ready') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
          <video
            src={videoUrl}
            controls
            playsInline
            className="w-full h-full"
            style={{ objectFit: 'contain' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
        {editable && (
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Replace Video
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status indicator */}
      {(muxStatus !== 'none' && muxStatus !== 'ready') && (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon()}
          <span className="text-sm text-gray-600">{getStatusText()}</span>
        </div>
      )}

      {/* Upload area */}
      {editable && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-gray-500" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Upload video</p>
              <p className="text-xs text-gray-500">
                Click to select or drag and drop<br />
                MP4, MOV, WebM (max 2GB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {uploadError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{uploadError}</span>
        </div>
      )}

      {/* Existing video info */}
      {videoUrl && muxStatus !== 'ready' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Video is being processed. It will appear here once ready.
          </p>
        </div>
      )}
    </div>
  );
};