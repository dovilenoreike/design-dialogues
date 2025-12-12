import { Upload, Image as ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";

interface UploadZoneProps {
  onImageUpload: (file: File) => void;
  uploadedImage: string | null;
}

const UploadZone = ({ onImageUpload, uploadedImage }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

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
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  return (
    <div
      className={`relative w-full aspect-[16/9] rounded-2xl border-2 border-dashed transition-all duration-300 ease-out overflow-hidden ${
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
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-all duration-300 flex items-center justify-center">
            <label className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
              <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-2">
                <Upload size={16} />
                <span className="text-sm font-medium">Replace Image</span>
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
        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <ImageIcon size={28} className="text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-1">
            Drop your space here
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse
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
