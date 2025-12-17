import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import SpaceCategoryPills from "@/components/SpaceCategoryPills";
import MaterialPalette from "@/components/MaterialPalette";
import ArchitecturalStyle from "@/components/ArchitecturalStyle";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import ResultDashboard from "@/components/ResultDashboard";
import { FormData } from "@/types/calculator";
import { getPaletteById } from "@/data/palettes";
import { getStyleById } from "@/data/styles";
import { supabase } from "@/integrations/supabase/client";
import { buildDetailedMaterialPrompt, loadMaterialImagesAsBase64 } from "@/lib/palette-utils";

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [freestyleDescription, setFreestyleDescription] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const showDesignMatrix = uploadedImage && selectedCategory;
  // Allow generation with material selected OR freestyle description
  const canGenerate = selectedMaterial || freestyleDescription.trim().length > 0;

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = () => {
    setIsProcessing(true);
    setIsGenerating(true);
    generateInteriorRender();
  };

  const generateInteriorRender = async () => {
    if (!uploadedImage || !selectedCategory) return;

    try {
      const palette = selectedMaterial ? getPaletteById(selectedMaterial) : null;
      const style = selectedStyle ? getStyleById(selectedStyle) : null;

      // Build detailed material prompt with room-specific purposes
      let materialPrompt = "";
      let materialImages: string[] = [];
      
      if (palette) {
        materialPrompt = buildDetailedMaterialPrompt(palette, selectedCategory);
        // Load material reference images
        materialImages = await loadMaterialImagesAsBase64(palette.id, selectedCategory, palette);
        console.log(`Loaded ${materialImages.length} material reference images for ${selectedCategory}`);
      }

      const { data, error } = await supabase.functions.invoke('generate-interior', {
        body: {
          imageBase64: uploadedImage,
          roomCategory: selectedCategory,
          materialPrompt: materialPrompt || null,
          materialImages: materialImages.length > 0 ? materialImages : null,
          stylePrompt: style?.promptSnippet,
          freestyleDescription: freestyleDescription.trim() || null
        }
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error("Failed to generate interior. Please try again.");
        setIsGenerating(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setIsGenerating(false);
        return;
      }

      if (data?.generatedImage) {
        setGeneratedImage(data.generatedImage);
        toast.success("Interior visualization generated!", { position: "top-center" });
      }
    } catch (err) {
      console.error("Generation error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProcessingComplete = (data: FormData) => {
    setFormData(data);
    setIsProcessing(false);
    setShowResults(true);
  };

  const handleRegenerateVisualization = () => {
    setShowResults(false);
    setGeneratedImage(null);
    setIsProcessing(true);
    setIsGenerating(true);
    generateInteriorRender();
  };

  const handleChangeStyle = () => {
    setShowResults(false);
    setTimeout(() => {
      document.querySelector('#design-matrix')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartFresh = () => {
    setShowResults(false);
    setUploadedImage(null);
    setSelectedCategory(null);
    setSelectedMaterial(null);
    setSelectedStyle(null);
    setFreestyleDescription("");
    setFormData(null);
    setGeneratedImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24 pb-12 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Section 1: The Canvas */}
          <section className="max-w-4xl mx-auto mb-10 md:mb-16">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif headline-editorial mb-3 md:mb-4">
                Design your space,<br />
                <span className="italic">dialogue</span> with possibilities.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-2">
                Upload your room, choose your style, and let our AI generate 
                personalized design solutions with accurate cost estimates.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Or <Link to="/calculator" className="underline hover:text-foreground transition-colors">estimate budget only</Link> →
              </p>
            </div>

            <UploadZone 
              onImageUpload={handleImageUpload}
              uploadedImage={uploadedImage}
            />
            
            <div className="mt-4 md:mt-6">
              <SpaceCategoryPills 
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                disabled={!uploadedImage}
              />
            </div>
          </section>

          {/* Section 2: The Design Matrix */}
          {showDesignMatrix && (
            <section id="design-matrix" className="max-w-4xl mx-auto reveal-enter">
              <div className="border-t border-border pt-8 md:pt-12 mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-serif mb-1 md:mb-2">Define Your Aesthetic</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Select materials to generate your design
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <MaterialPalette 
                  selectedMaterial={selectedMaterial}
                  onSelectMaterial={setSelectedMaterial}
                  freestyleDescription={freestyleDescription}
                  onFreestyleChange={setFreestyleDescription}
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
                  className={`w-full sm:w-auto px-8 sm:px-12 py-3.5 md:py-4 rounded-full font-medium text-sm transition-all duration-300 ${
                    canGenerate
                      ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
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
        isGenerating={isGenerating}
      />

      {/* Section 4: Result Dashboard */}
      <ResultDashboard 
        isVisible={showResults}
        formData={formData}
        uploadedImage={uploadedImage}
        generatedImage={generatedImage}
        selectedMaterial={selectedMaterial}
        selectedStyle={selectedStyle}
        freestyleDescription={freestyleDescription}
        onFormDataChange={setFormData}
        onRegenerateVisualization={handleRegenerateVisualization}
        onChangeStyle={handleChangeStyle}
        onStartFresh={handleStartFresh}
      />
    </div>
  );
};

export default Index;
