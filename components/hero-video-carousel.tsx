"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react"; // Keep Play icon for overlay

interface VideoCarouselProps {
  videos: {
    src: string;
    alt: string;
  }[];
}

export function VideoCarousel({ videos }: VideoCarouselProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Assume playing initially
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current
          .play()
          .catch((e) => console.error("Video play failed:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentVideoIndex, isPlaying]);

  const handleDotClick = (index: number) => {
    setCurrentVideoIndex(index);
    setIsPlaying(true); // Play video when a dot is clicked
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current
          .play()
          .catch((e) => console.error("Video play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="relative flex justify-center items-center h-[300px] md:h-[400px] lg:h-[581px] rounded-tr-[80px] rounded-bl-[80px] overflow-hidden shadow-lg border border-gray-200">
      {currentVideo && (
        <video
          ref={videoRef}
          key={currentVideo.src}
          src={currentVideo.src}
          className="object-cover w-full h-full"
          loop
          muted
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          aria-label={currentVideo.alt}
        >
          Your browser does not support the video tag.
        </video>
      )}

      {/* Play button overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Button
            variant="ghost"
            size="icon"
            className="h-20 w-20 rounded-full bg-white/80 hover:bg-white text-v0-blue-500"
            onClick={togglePlayPause}
            aria-label="Play video"
          >
            <Play className="h-10 w-10 fill-current" />
            <span className="sr-only">Play video</span>
          </Button>
        </div>
      )}

      {/* Dot pagination */}
      {videos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          {videos.map((_, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={`h-3 w-3 rounded-full ${
                index === currentVideoIndex
                  ? "bg-primary"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
