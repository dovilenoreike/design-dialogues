import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResultDashboard from "@/components/ResultDashboard";
import { FormData } from "@/types/calculator";

const Calculator = () => {
  const [formData, setFormData] = useState<FormData>({
    area: 50,
    numberOfAdults: 2,
    numberOfChildren: 0,
    isRenovation: false,
    isUrgent: false,
    services: { spacePlanning: true, interiorFinishes: true, furnishingDecor: true },
    kitchenLength: 4,
    wardrobeLength: 3,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <ResultDashboard
          mode="calculator"
          isVisible={true}
          formData={formData}
          uploadedImage={null}
          selectedMaterial={null}
          selectedStyle={null}
          onFormDataChange={setFormData}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Calculator;
