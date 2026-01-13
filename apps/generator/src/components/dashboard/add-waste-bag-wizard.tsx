import { useState } from "react";
import {
  Package,
  QrCode,
  Weight,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Check,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { typeLabels, type WasteType } from "@/lib/mock-data";

interface AddWasteBagWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WasteBagFormData) => void | Promise<void>;
}

interface WasteBagFormData {
  wasteType: WasteType;
  qrCode: string;
  qrSource: "pre_manufactured" | "hospital_generated";
  weightKg: string;
  description: string;
  imageUrl: string;
}

const initialFormData: WasteBagFormData = {
  wasteType: "infectious",
  qrCode: "",
  qrSource: "hospital_generated",
  weightKg: "",
  description: "",
  imageUrl: "",
};

const steps = [
  { id: 1, title: "Waste Type", icon: Package },
  { id: 2, title: "QR & Weight", icon: QrCode },
  { id: 3, title: "Details", icon: FileText },
  { id: 4, title: "Review", icon: Check },
];

const wasteTypes: WasteType[] = [
  "infectious",
  "sharps",
  "pharmaceutical",
  "pathological",
  "chemical",
];

const wasteTypeDescriptions: Record<WasteType, string> = {
  infectious: "Contaminated materials from patient care",
  sharps: "Needles, syringes, and sharp instruments",
  pharmaceutical: "Expired or unused medications",
  pathological: "Tissue samples and body fluids",
  chemical: "Laboratory reagents and disinfectants",
};

const wasteTypeColors: Record<WasteType, string> = {
  infectious: "bg-yellow-500/10 border-yellow-500/50 hover:border-yellow-500",
  sharps: "bg-red-500/10 border-red-500/50 hover:border-red-500",
  pharmaceutical: "bg-blue-500/10 border-blue-500/50 hover:border-blue-500",
  pathological: "bg-purple-500/10 border-purple-500/50 hover:border-purple-500",
  chemical: "bg-orange-500/10 border-orange-500/50 hover:border-orange-500",
};

function generateQRCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "HWM-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function AddWasteBagWizard({
  isOpen,
  onClose,
  onSubmit,
}: AddWasteBagWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WasteBagFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const updateField = <K extends keyof WasteBagFormData>(
    field: K,
    value: WasteBagFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsSuccess(true);
    } catch (error) {
      console.error("Error creating waste bag:", error);
      // Keep the form open and don't show success
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setIsSuccess(false);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setIsSuccess(false);
    onClose();
  };

  const handleGenerateQR = () => {
    updateField("qrCode", generateQRCode());
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true; // Waste type has a default value
      case 2:
        return (
          formData.qrCode.trim().length > 0 &&
          formData.weightKg.trim().length > 0
        );
      case 3:
        return true; // Details are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 glass-elevated rounded-xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Add New Waste Bag</h2>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of 4: {steps[currentStep - 1]?.title}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted =
                currentStep > step.id || (isSuccess && step.id === 4);
              const isCurrent = currentStep === step.id && !isSuccess;
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center h-8 w-8 rounded-full transition-all ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                          ? "bg-primary/20 text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-36 h-0.5 mx-2 ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          {/* Step 1: Waste Type */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Select Waste Type *</Label>
                <div className="grid grid-cols-1 gap-3">
                  {wasteTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField("wasteType", type)}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                        formData.wasteType === type
                          ? "border-primary bg-primary/5"
                          : wasteTypeColors[type]
                      }`}
                    >
                      <div className="mt-0.5">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{typeLabels[type]}</p>
                        <p className="text-sm text-muted-foreground">
                          {wasteTypeDescriptions[type]}
                        </p>
                      </div>
                      {formData.wasteType === type && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: QR Code & Weight */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="qrCode">QR Code *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="qrCode"
                      placeholder="HWM-XXXXXXXX"
                      value={formData.qrCode}
                      onChange={(e) => updateField("qrCode", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateQR}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan or generate a unique QR code for this bag
                </p>
              </div>

              <div className="space-y-2">
                <Label>QR Source</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("qrSource", "pre_manufactured")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                      formData.qrSource === "pre_manufactured"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <Package className="h-5 w-5" />
                    <span className="text-xs font-medium">
                      Pre-manufactured
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateField("qrSource", "hospital_generated")
                    }
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                      formData.qrSource === "hospital_generated"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <QrCode className="h-5 w-5" />
                    <span className="text-xs font-medium">
                      Hospital Generated
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightKg">Weight (kg) *</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="weightKg"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    value={formData.weightKg}
                    onChange={(e) => updateField("weightKg", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Description & Image */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    id="description"
                    placeholder="e.g., Used needles from ER department"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => updateField("imageUrl", e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Add an image for AI-powered waste classification
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {typeLabels[formData.wasteType]}
                      </p>
                      <Badge variant="outline">{formData.wasteType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {wasteTypeDescriptions[formData.wasteType]}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">QR Code</p>
                    <p className="font-medium font-mono">
                      {formData.qrCode || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p className="font-medium">{formData.weightKg || "—"} kg</p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="text-sm">
                  <p className="text-muted-foreground">QR Source</p>
                  <p className="font-medium">
                    {formData.qrSource === "pre_manufactured"
                      ? "Pre-manufactured"
                      : "Hospital Generated"}
                  </p>
                </div>

                {formData.description && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Description</p>
                      <p className="font-medium">{formData.description}</p>
                    </div>
                  </>
                )}

                {formData.imageUrl && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Image URL</p>
                      <p className="font-medium text-xs break-all">
                        {formData.imageUrl}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center px-6 py-4 border-t bg-muted/30">
          {!isSuccess && (
            <Button
              variant="ghost"
              onClick={handleBack}
              hidden={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}

          {isSuccess && (
            <Button
              variant="outline"
              onClick={handleAddAnother}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="gap-2 ml-auto"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : isSuccess ? (
            <div className="flex items-center gap-2 ml-auto text-sm font-medium text-green-600">
              <Check className="h-4 w-4" />
              Waste Bag created successfully
            </div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 ml-auto"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Create Waste Bag
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
