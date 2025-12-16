import { useState } from "react";
import { Link } from "react-router-dom";
import ResultDashboard from "@/components/ResultDashboard";
import { FormData, ServiceSelection } from "@/types/calculator";

const Calculator = () => {
  const [formData, setFormData] = useState<FormData>({
    area: 50,
    isRenovation: false,
    services: { spacePlanning: true, interiorFinishes: true, furnishingDecor: true },
    kitchenLength: 4,
    wardrobeLength: 3,
  });

  return (
    <ResultDashboard
      mode="calculator"
      isVisible={true}
      formData={formData}
      uploadedImage={null}
      selectedMaterial={null}
      selectedStyle={null}
      onFormDataChange={setFormData}
    />
  );
};

export default Calculator;
