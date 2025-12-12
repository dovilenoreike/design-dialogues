import { useState, useCallback } from "react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import SpaceCategoryPills from "@/components/SpaceCategoryPills";
import MaterialPalette from "@/components/MaterialPalette";
import ArchitecturalStyle from "@/components/ArchitecturalStyle";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import ResultDashboard from "@/components/ResultDashboard";

interface FormData {
  area: number;
  isRenovation: boolean;
  hasKitchen: boolean;
}

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  const showDesignMatrix = uploadedImage && selectedCategory;
  const canGenerate = selectedMaterial && selectedStyle;

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = () => {
    setIsProcessing(true);
  };

  const handleProcessingComplete = (data: FormData) => {
    setFormData(data);
    setIsProcessing(false);
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Section 1: The Canvas */}
          <section className="max-w-4xl mx-auto mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-serif headline-editorial mb-4">
                Design your space,<br />
                <span className="italic">dialogue</span> with possibilities.
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Upload your room, choose your style, and let our AI generate 
                personalized design solutions with accurate cost estimates.
              </p>
            </div>

            <UploadZone 
              onImageUpload={handleImageUpload}
              uploadedImage={uploadedImage}
            />
            
            <div className="mt-6">
              <SpaceCategoryPills 
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          </section>

          {/* Section 2: The Design Matrix */}
          {showDesignMatrix && (
            <section className="max-w-4xl mx-auto reveal-enter">
              <div className="border-t border-border pt-12 mb-8">
                <h3 className="text-2xl font-serif mb-2">Define Your Aesthetic</h3>
                <p className="text-muted-foreground">
                  Select materials and style to generate your design
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <MaterialPalette 
                  selectedMaterial={selectedMaterial}
                  onSelectMaterial={setSelectedMaterial}
                />
                <ArchitecturalStyle 
                  selectedStyle={selectedStyle}
                  onSelectStyle={setSelectedStyle}
                />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={`px-12 py-4 rounded-full font-medium text-sm transition-all duration-300 ${
                    canGenerate
                      ? "bg-foreground text-background hover:opacity-90"
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  }`}
                >
                  Generate Solutions
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Section 3: Processing Overlay */}
      <ProcessingOverlay 
        isVisible={isProcessing}
        onComplete={handleProcessingComplete}
      />

      {/* Section 4: Result Dashboard */}
      <ResultDashboard 
        isVisible={showResults}
        formData={formData}
        uploadedImage={uploadedImage}
        selectedMaterial={selectedMaterial}
        selectedStyle={selectedStyle}
      />
    </div>
  );
};

export default Index;
