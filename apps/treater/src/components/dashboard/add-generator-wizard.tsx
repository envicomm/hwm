import { useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  QrCode,
  Settings2,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { qrModeLabels, type QrMode } from "@/lib/mock-data";

interface AddGeneratorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GeneratorFormData) => void;
}

interface GeneratorFormData {
  name: string;
  facilityCode: string;
  isActive: boolean;
  contactEmail: string;
  contactPhone: string;
  address: string;
  latitude: string;
  longitude: string;
  qrMode: QrMode;
  maxStorageCapacityKg: string;
  maxBagCount: string;
  storageAlertThreshold: string;
}

const initialFormData: GeneratorFormData = {
  name: "",
  facilityCode: "",
  isActive: true,
  contactEmail: "",
  contactPhone: "",
  address: "",
  latitude: "",
  longitude: "",
  qrMode: "both",
  maxStorageCapacityKg: "200",
  maxBagCount: "50",
  storageAlertThreshold: "80",
};

const steps = [
  { id: 1, title: "Basic Info", icon: Building2 },
  { id: 2, title: "Contact", icon: Mail },
  { id: 3, title: "Location", icon: MapPin },
  { id: 4, title: "Configuration", icon: Settings2 },
  { id: 5, title: "Review", icon: Check },
];

export function AddGeneratorWizard({ isOpen, onClose, onSubmit }: AddGeneratorWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<GeneratorFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const updateField = <K extends keyof GeneratorFormData>(
    field: K,
    value: GeneratorFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onSubmit(formData);
    setIsSubmitting(false);
    setFormData(initialFormData);
    setCurrentStep(1);
    onClose();
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    onClose();
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.contactEmail.trim().length > 0 && formData.contactPhone.trim().length > 0;
      case 3:
        return formData.address.trim().length > 0;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 glass-elevated rounded-xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Add New Generator</h2>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of 5: {steps[currentStep - 1]?.title}
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
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
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
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
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
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="name">Hospital / Generator Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Metro General Hospital"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityCode">Facility Code (Optional)</Label>
                <Input
                  id="facilityCode"
                  placeholder="e.g., PH-NCR-0001"
                  value={formData.facilityCode}
                  onChange={(e) => updateField("facilityCode", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for regulatory compliance
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Label htmlFor="isActive">Active Status</Label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isActive}
                  onClick={() => updateField("isActive", !formData.isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-muted-foreground">
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="waste.dept@hospital.com"
                    value={formData.contactEmail}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+63 2 1234 5678"
                    value={formData.contactPhone}
                    onChange={(e) => updateField("contactPhone", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="address">Full Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    id="address"
                    placeholder="123 Medical Drive, Makati City, Metro Manila"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (Optional)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="14.5995"
                    value={formData.latitude}
                    onChange={(e) => updateField("latitude", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude (Optional)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="120.9842"
                    value={formData.longitude}
                    onChange={(e) => updateField("longitude", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                GPS coordinates help with route optimization
              </p>
            </div>
          )}

          {/* Step 4: Bag Configuration */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>QR Code Mode *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(qrModeLabels) as QrMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateField("qrMode", mode)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                        formData.qrMode === mode
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <QrCode
                        className={`h-5 w-5 ${
                          formData.qrMode === mode ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-xs font-medium">{qrModeLabels[mode]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxStorageCapacityKg">Max Storage (kg)</Label>
                  <Input
                    id="maxStorageCapacityKg"
                    type="number"
                    value={formData.maxStorageCapacityKg}
                    onChange={(e) => updateField("maxStorageCapacityKg", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBagCount">Max Bags</Label>
                  <Input
                    id="maxBagCount"
                    type="number"
                    value={formData.maxBagCount}
                    onChange={(e) => updateField("maxBagCount", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storageAlertThreshold">Alert at (%)</Label>
                  <Input
                    id="storageAlertThreshold"
                    type="number"
                    min="50"
                    max="100"
                    value={formData.storageAlertThreshold}
                    onChange={(e) => updateField("storageAlertThreshold", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{formData.name || "—"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.facilityCode || "No facility code"}
                    </p>
                    <Badge variant={formData.isActive ? "default" : "secondary"} className="mt-1">
                      {formData.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{formData.contactEmail || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{formData.contactPhone || "—"}</p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="text-sm">
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{formData.address || "—"}</p>
                  {formData.latitude && formData.longitude && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Coordinates: {formData.latitude}, {formData.longitude}
                    </p>
                  )}
                </div>

                <div className="h-px bg-border" />

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">QR Mode</p>
                    <p className="font-medium">{qrModeLabels[formData.qrMode]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Storage</p>
                    <p className="font-medium">{formData.maxStorageCapacityKg} kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Bags</p>
                    <p className="font-medium">{formData.maxBagCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Alert Threshold</p>
                    <p className="font-medium">{formData.storageAlertThreshold}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={!isStepValid()} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Create Generator
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
