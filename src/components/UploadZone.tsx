import { Upload, Image as ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useHaptic } from "@/hooks/use-haptic";

interface UploadZoneProps {
  onImageUpload: (file: File) => void;
  uploadedImage: string | null;
}

const UploadZone = ({ onImageUpload, uploadedImage }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const haptic = useHaptic();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      haptic.success();
      onImageUpload(file);
    }
  }, [onImageUpload, haptic]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      haptic.success();
      onImageUpload(file);
    }
  }, [onImageUpload, haptic]);

  return (
    <div
      className={`relative w-full aspect-[4/3] md:aspect-[16/9] rounded-xl md:rounded-2xl border-2 border-dashed transition-all duration-300 ease-out overflow-hidden touch-manipulation ${
        isDragging 
          ? "border-foreground bg-secondary/50" 
          : uploadedImage 
            ? "border-transparent" 
            : "border-border hover:border-foreground/30 bg-secondary/30"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {uploadedImage ? (
        <div className="relative w-full h-full group">
          <img
            src={uploadedImage}
            alt="Uploaded space"
            className="w-full h-full object-cover"
          />
          {/* Mobile: always show button, Desktop: show on hover */}
          <div className="absolute inset-0 bg-foreground/0 md:group-hover:bg-foreground/20 transition-all duration-300 flex items-end md:items-center justify-center p-4 md:p-0">
            <label className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 cursor-pointer active:scale-95 transition-transform">
              <div className="glass-panel px-4 md:px-6 py-2.5 md:py-3 rounded-full flex items-center gap-2 min-h-[44px]">
                <Upload size={14} className="md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-medium">Replace</span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
          </div>
        </div>
      ) : (
        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-4 active:bg-secondary/50 transition-colors">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center mb-3 md:mb-4">
            <ImageIcon size={22} className="md:w-7 md:h-7 text-muted-foreground" />
          </div>
          <p className="text-sm md:text-base text-foreground font-medium mb-1 text-center">
            Drop your room here
          </p>
          <p className="text-xs md:text-sm text-muted-foreground text-center">
            Photo, sketch, or floor plan
          </p>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
      )}
    </div>
  );
};

export default UploadZone;
