import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UploadZone from "@/components/UploadZone";
import SpaceCategoryPills from "@/components/SpaceCategoryPills";
import MaterialPalette from "@/components/MaterialPalette";
import ArchitecturalStyle from "@/components/ArchitecturalStyle";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import ResultDashboard from "@/components/ResultDashboard";
import { FormData } from "@/types/calculator";
import {
  DesignSelection,
  GenerationState,
  initialDesignSelection,
  initialGenerationState,
} from "@/types/design-state";
import { getPaletteById } from "@/data/palettes";
import { getStyleById } from "@/data/styles";
import { buildDetailedMaterialPrompt, loadMaterialImagesAsBase64 } from "@/lib/palette-utils";
import { generateInteriorDesign } from "@/lib/openai-api";

const Index = () => {
  // Grouped state for design selections
  const [design, setDesign] = useState<DesignSelection>(initialDesignSelection);

  // Grouped state for generation/processing
  const [generation, setGeneration] = useState<GenerationState>(initialGenerationState);

  // Form data from calculator (kept separate as it's passed to child)
  const [formData, setFormData] = useState<FormData | null>(null);

  // Destructure for convenience
  const { uploadedImage, selectedCategory, selectedMaterial, selectedStyle, freestyleDescription } = design;
  const { isProcessing, isGenerating, showResults, generatedImage } = generation;

  const showDesignMatrix = uploadedImage && selectedCategory;
  // Allow generation with material selected OR freestyle description
  const canGenerate = selectedMaterial || freestyleDescription.trim().length > 0;

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setDesign((prev) => ({ ...prev, uploadedImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = () => {
    setGeneration((prev) => ({ ...prev, isProcessing: true, isGenerating: true }));
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
      }

      // Call GPT-4 Vision + DALL-E 3 to generate the interior design image
      const generatedImageBase64 = await generateInteriorDesign(
        uploadedImage,
        selectedCategory,
        materialPrompt || null,
        materialImages.length > 0 ? materialImages : null,
        style?.promptSnippet || null,
        freestyleDescription.trim() || null
      );

      // Set the generated image (already in base64 format)
      setGeneration((prev) => ({ ...prev, generatedImage: generatedImageBase64 }));
      toast.success("Interior visualization generated!", { position: "top-center" });

    } catch (err: any) {
      const errorMessage = err?.message || "An error occurred. Please try again.";
      toast.error(errorMessage);
    } finally {
      setGeneration((prev) => ({ ...prev, isGenerating: false }));
    }
  };

  const handleProcessingComplete = (data: FormData) => {
    setFormData(data);
    setGeneration((prev) => ({ ...prev, isProcessing: false, showResults: true }));
  };

  const handleRegenerateVisualization = () => {
    setGeneration({
      showResults: false,
      generatedImage: null,
      isProcessing: true,
      isGenerating: true,
    });
    generateInteriorRender();
  };

  const handleChangeStyle = () => {
    setGeneration((prev) => ({ ...prev, showResults: false }));
    setTimeout(() => {
      document.querySelector('#design-matrix')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectPaletteFromResults = (paletteId: string) => {
    setDesign((prev) => ({
      ...prev,
      selectedMaterial: paletteId,
      freestyleDescription: "", // Clear freestyle if they pick a curated palette
    }));
    setGeneration((prev) => ({ ...prev, showResults: false }));
    setTimeout(() => {
      document.querySelector('#design-matrix')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartFresh = () => {
    setDesign(initialDesignSelection);
    setGeneration(initialGenerationState);
    setFormData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wrapper setters for child components
  const handleSelectCategory = (category: string | null) => {
    setDesign((prev) => ({ ...prev, selectedCategory: category }));
  };

  const handleSelectMaterial = (material: string | null) => {
    setDesign((prev) => ({ ...prev, selectedMaterial: material }));
  };

  const handleSelectStyle = (style: string | null) => {
    setDesign((prev) => ({ ...prev, selectedStyle: style }));
  };

  const handleFreestyleChange = (description: string) => {
    setDesign((prev) => ({ ...prev, freestyleDescription: description }));
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
              <p className="mt-4">
                <Link 
                  to="/calculator" 
                  className="inline-block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors min-h-[44px] touch-manipulation"
                >
                  Or estimate budget only →
                </Link>
              </p>
            </div>

            <UploadZone 
              onImageUpload={handleImageUpload}
              uploadedImage={uploadedImage}
            />
            
            {/* Progressive disclosure: Room pills appear after upload */}
            {uploadedImage && (
              <div className="mt-4 md:mt-6 animate-fade-in">
                <SpaceCategoryPills
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                />
              </div>
            )}
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
                  onSelectMaterial={handleSelectMaterial}
                  freestyleDescription={freestyleDescription}
                  onFreestyleChange={handleFreestyleChange}
                />
                <ArchitecturalStyle
                  selectedStyle={selectedStyle}
                  onSelectStyle={handleSelectStyle}
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
        onSelectPalette={handleSelectPaletteFromResults}
      />

      <Footer />
    </div>
  );
};

export default Index;
