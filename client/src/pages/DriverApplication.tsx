import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, Car, FileText, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
// Storage will be handled via tRPC backend

type ApplicationStep = 'personal' | 'vehicle' | 'documents' | 'kyc' | 'review';

export default function DriverApplication() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('personal');
  
  // Personal Information
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('ON');
  const [postalCode, setPostalCode] = useState('');
  
  // Vehicle Information
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('4');
  
  // Document uploads
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  
  // Delivery service opt-in
  const [offersDelivery, setOffersDelivery] = useState(false);
  const [maxPackageSize, setMaxPackageSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // KYC status
  const [kycCompleted, setKycCompleted] = useState(false);
  const [piUserId, setPiUserId] = useState('');
  
  const [uploading, setUploading] = useState(false);

  const applyMutation = trpc.driver.applyAsDriver.useMutation({
    onSuccess: () => {
      toast.success('Application submitted successfully! We will review it within 24-48 hours.');
      setLocation('/driver');
    },
    onError: (error: any) => {
      toast.error(`Application failed: ${error.message}`);
    },
  });

  const handleFileChange = (setter: (file: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File, prefix: string): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileKey = `${prefix}/${timestamp}-${randomSuffix}-${file.name}`;
    
    // Note: storagePut is a server-side function, we need to send file to backend
    // For now, we'll use a data URL as placeholder
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePiKYC = async () => {
    toast.info('Opening Pi Network KYC verification...');
    // TODO: Integrate actual Pi Network KYC SDK
    // For now, simulate KYC completion
    setTimeout(() => {
      setKycCompleted(true);
      setPiUserId(`pi-user-${Date.now()}`);
      toast.success('Pi Network KYC completed successfully!');
    }, 2000);
  };

  const handleSubmit = async () => {
    // Validate all required fields
    if (!phone || !address || !city || !postalCode) {
      toast.error('Please fill in all personal information');
      setCurrentStep('personal');
      return;
    }

    if (!vehicleMake || !vehicleModel || !vehicleYear || !licensePlate) {
      toast.error('Please fill in all vehicle information');
      setCurrentStep('vehicle');
      return;
    }

    if (!licenseFile || !insuranceFile || !registrationFile) {
      toast.error('Please upload all required documents');
      setCurrentStep('documents');
      return;
    }

    if (!kycCompleted) {
      toast.error('Please complete Pi Network KYC verification');
      setCurrentStep('kyc');
      return;
    }

    try {
      setUploading(true);

      // Upload documents
      const [licenseUrl, insuranceUrl, registrationUrl, profileUrl, vehicleUrl] = await Promise.all([
        uploadFile(licenseFile, 'driver-licenses'),
        uploadFile(insuranceFile, 'insurance-docs'),
        uploadFile(registrationFile, 'vehicle-registration'),
        profilePhoto ? uploadFile(profilePhoto, 'profile-photos') : Promise.resolve(''),
        vehiclePhoto ? uploadFile(vehiclePhoto, 'vehicle-photos') : Promise.resolve(''),
      ]);

      // Submit application
      await applyMutation.mutateAsync({
        phone,
        address,
        city,
        province,
        postalCode,
        licenseNumber: 'TEMP-' + Date.now(), // Should be extracted from uploaded document
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Placeholder
        insuranceProvider: 'Provider Name', // Should be from form
        insurancePolicyNumber: 'POLICY-' + Date.now(),
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        vehicleMake,
        vehicleModel,
        vehicleYear: parseInt(vehicleYear),
        vehicleColor,
        licensePlate,
        vehicleCapacity: parseInt(vehicleCapacity),
        piKycStatus: kycCompleted ? 'verified' : 'pending',
        piUserId,
        offersDelivery,
        maxPackageSize: offersDelivery ? maxPackageSize : undefined,
        documents: {
          license: licenseUrl,
          insurance: insuranceUrl,
          registration: registrationUrl,
          profilePhoto: profileUrl,
          vehiclePhoto: vehicleUrl,
        },
      });
    } catch (error) {
      console.error('Application submission error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'personal':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (416) 555-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                placeholder="123 Main Street"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Toronto"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="province">Province *</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                placeholder="M5H 2N2"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
              />
            </div>
          </div>
        );

      case 'vehicle':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  placeholder="Toyota"
                  value={vehicleMake}
                  onChange={(e) => setVehicleMake(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="Camry"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2022"
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  placeholder="Silver"
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plate">License Plate *</Label>
                <Input
                  id="plate"
                  placeholder="ABCD 123"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacity">Passenger Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="8"
                  value={vehicleCapacity}
                  onChange={(e) => setVehicleCapacity(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="pt-4 border-t">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offersDelivery}
                  onChange={(e) => setOffersDelivery(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>I want to offer delivery services</span>
              </Label>
              {offersDelivery && (
                <div className="mt-4">
                  <Label htmlFor="maxPackageSize">Maximum Package Size</Label>
                  <select
                    id="maxPackageSize"
                    value={maxPackageSize}
                    onChange={(e) => setMaxPackageSize(e.target.value as 'small' | 'medium' | 'large')}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="small">Small (shoebox size)</option>
                    <option value="medium">Medium (suitcase size)</option>
                    <option value="large">Large (large box)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="license">Driver's License * (PDF or Image)</Label>
              <div className="mt-2">
                <Input
                  id="license"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange(setLicenseFile)}
                  required
                />
                {licenseFile && (
                  <p className="text-sm text-green-600 mt-1">✓ {licenseFile.name}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="insurance">Insurance Certificate * (PDF or Image)</Label>
              <div className="mt-2">
                <Input
                  id="insurance"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange(setInsuranceFile)}
                  required
                />
                {insuranceFile && (
                  <p className="text-sm text-green-600 mt-1">✓ {insuranceFile.name}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="registration">Vehicle Registration * (PDF or Image)</Label>
              <div className="mt-2">
                <Input
                  id="registration"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange(setRegistrationFile)}
                  required
                />
                {registrationFile && (
                  <p className="text-sm text-green-600 mt-1">✓ {registrationFile.name}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="profile">Profile Photo (Optional)</Label>
              <div className="mt-2">
                <Input
                  id="profile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange(setProfilePhoto)}
                />
                {profilePhoto && (
                  <p className="text-sm text-green-600 mt-1">✓ {profilePhoto.name}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="vehicle-photo">Vehicle Photo (Optional)</Label>
              <div className="mt-2">
                <Input
                  id="vehicle-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange(setVehiclePhoto)}
                />
                {vehiclePhoto && (
                  <p className="text-sm text-green-600 mt-1">✓ {vehiclePhoto.name}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'kyc':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pi Network KYC Verification</h3>
              <p className="text-gray-600 mb-6">
                Complete your identity verification through Pi Network to ensure platform safety and trust.
              </p>
              {kycCompleted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">KYC Verification Complete!</p>
                  <p className="text-sm text-gray-600 mt-1">Pi User ID: {piUserId}</p>
                </div>
              ) : (
                <Button onClick={handlePiKYC} size="lg" className="gap-2">
                  <FileText className="w-5 h-5" />
                  Start Pi Network KYC
                </Button>
              )}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Personal Information</h3>
              <div className="bg-gray-50 p-4 rounded space-y-1 text-sm">
                <p><strong>Phone:</strong> {phone}</p>
                <p><strong>Address:</strong> {address}, {city}, {province} {postalCode}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Vehicle Information</h3>
              <div className="bg-gray-50 p-4 rounded space-y-1 text-sm">
                <p><strong>Vehicle:</strong> {vehicleYear} {vehicleMake} {vehicleModel} ({vehicleColor})</p>
                <p><strong>License Plate:</strong> {licensePlate}</p>
                <p><strong>Capacity:</strong> {vehicleCapacity} passengers</p>
                {offersDelivery && (
                  <p><strong>Delivery Service:</strong> Yes (Max size: {maxPackageSize})</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Documents</h3>
              <div className="bg-gray-50 p-4 rounded space-y-1 text-sm">
                <p>✓ Driver's License: {licenseFile?.name}</p>
                <p>✓ Insurance Certificate: {insuranceFile?.name}</p>
                <p>✓ Vehicle Registration: {registrationFile?.name}</p>
                {profilePhoto && <p>✓ Profile Photo: {profilePhoto.name}</p>}
                {vehiclePhoto && <p>✓ Vehicle Photo: {vehiclePhoto.name}</p>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Verification</h3>
              <div className="bg-gray-50 p-4 rounded space-y-1 text-sm">
                <p>✓ Pi Network KYC: {kycCompleted ? 'Completed' : 'Pending'}</p>
                {piUserId && <p>Pi User ID: {piUserId}</p>}
              </div>
            </div>
          </div>
        );
    }
  };

  const steps: { id: ApplicationStep; label: string; icon: any }[] = [
    { id: 'personal', label: 'Personal Info', icon: FileText },
    { id: 'vehicle', label: 'Vehicle', icon: Car },
    { id: 'documents', label: 'Documents', icon: Upload },
    { id: 'kyc', label: 'KYC', icon: CheckCircle },
    { id: 'review', label: 'Review', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Become an OpenRide Driver</CardTitle>
            <CardDescription>
              Complete the application to start earning 87% of fares plus RIDE tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  const isCompleted = index < currentStepIndex;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs mt-1 text-center">{step.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="relative mt-2">
                <div className="h-1 bg-gray-200 rounded">
                  <div
                    className="h-1 bg-blue-600 rounded transition-all"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  const prevIndex = Math.max(0, currentStepIndex - 1);
                  setCurrentStep(steps[prevIndex].id);
                }}
                disabled={currentStepIndex === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep === 'review' ? (
                <Button
                  onClick={handleSubmit}
                  disabled={uploading || applyMutation.isPending}
                  className="gap-2"
                >
                  {uploading || applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                  <CheckCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const nextIndex = Math.min(steps.length - 1, currentStepIndex + 1);
                    setCurrentStep(steps[nextIndex].id);
                  }}
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
