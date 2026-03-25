import React from "react";

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
}: StageCarouselProps) {
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
          />
        </div>

        {/* Current Image */}
        <div className="relative h-full flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
          <img
            src={currentImage}
            alt={`${roomName} visualization`}
            className={`w-full h-full object-cover transition-[filter] duration-300 ${isVisualizationMismatched ? 'blur-sm' : ''}`}
          />
        </div>

        {/* Next Image */}
        <div className="relative h-full flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
          <img
            src={nextImage}
            alt="Next"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
