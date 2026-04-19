import React from "react";
import { getVisualization, DEFAULT_PALETTE, DEFAULT_STYLE } from "@/data/visualisations";

interface StageCarouselProps {
  prevImage: string;
  currentImage: string;
  nextImage: string;
  isDragging: boolean;
  dragOffset: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onClickContainer: () => void;
  isVisualizationMismatched: boolean;
  roomName: string;
  hasUserImage: boolean;
}

export default function StageCarousel({
  prevImage,
  currentImage,
  nextImage,
  isDragging,
  dragOffset,
  containerRef,
  onClickContainer,
  isVisualizationMismatched,
  roomName,
  hasUserImage,
}: StageCarouselProps) {
  const fallbackImage = getVisualization(DEFAULT_PALETTE, roomName, DEFAULT_STYLE);
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src !== fallbackImage) e.currentTarget.src = fallbackImage;
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      onClick={onClickContainer}
    >
      {/* Inner track that slides */}
      <div
        className="absolute inset-0 flex"
        style={{
          width: '300%',
          transform: `translateX(calc(${-100 / 3}% + ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 300ms ease-out',
        }}
      >
        {/* Previous Image */}
        <div className="relative h-full flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
          <img
            src={prevImage}
            alt="Previous"
            className="w-full h-full object-cover"
            onError={handleImgError}
          />
        </div>

        {/* Current Image */}
        <div className="relative h-full flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
          <img
            src={currentImage}
            alt={`${roomName} visualization`}
            className={`w-full h-full transition-[filter] duration-300 ${hasUserImage ? 'object-contain' : 'object-cover'} ${isVisualizationMismatched ? 'blur-sm' : ''}`}
            onError={handleImgError}
          />
        </div>

        {/* Next Image */}
        <div className="relative h-full flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
          <img
            src={nextImage}
            alt="Next"
            className="w-full h-full object-cover"
            onError={handleImgError}
          />
        </div>
      </div>
    </div>
  );
}
