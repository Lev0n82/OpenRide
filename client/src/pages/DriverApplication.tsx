import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Car, FileText, CheckCircle, ArrowRight, ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type ApplicationStep = 'personal' | 'vehicle' | 'documents' | 'kyc' | 'review';

type DocumentType = 'license' | 'insurance' | 'registration';

export default function DriverApplication() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('personal');
  
  // Personal Information
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  
  // Vehicle Information
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState<number>(new Date().getFullYear());
  const [vehicleColor, setVehicleColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [passengerCapacity, setPassengerCapacity] = useState<number>(4);
  
  // Document uploads
  const [uploadProgress, setUploadProgress] = useState<Record<DocumentType, number>>({
    license: 0,
    insurance: 0,
    registration: 0,
  });
  const [uploadedDocs, setUploadedDocs] = useState<Record<DocumentType, string>>({
    license: '',
    insurance: '',
    registration: '',
  });
  
  // KYC status
  const [kycStatus, setKycStatus] = useState<'pending' | 'in_progress' | 'verified' | 'failed'>('pending');
  
  // Fetch existing application
  const { data: applicationData, refetch: refetchApplication } = trpc.driverApplication.getMyApplication.useQuery();
  
  // Load existing application data
  useEffect(() => {
    if (applicationData?.application) {
      const app = applicationData.application;
      setFullName(app.fullName);
      setEmail(app.email);
      setPhoneNumber(app.phoneNumber);
      if (app.vehicleMake) setVehicleMake(app.vehicleMake);
      if (app.vehicleModel) setVehicleModel(app.vehicleModel);
      if (app.vehicleYear) setVehicleYear(app.vehicleYear);
      if (app.vehicleColor) setVehicleColor(app.vehicleColor);
      if (app.licensePlate) setLicensePlate(app.licensePlate);
      if (app.passengerCapacity) setPassengerCapacity(app.passengerCapacity);
      setKycStatus(app.piKycStatus);
      
      // Load uploaded documents
      if (applicationData.documents) {
        const docMap: Record<DocumentType, string> = { license: '', insurance: '', registration: '' };
        applicationData.documents.forEach(doc => {
          docMap[doc.documentType] = doc.fileUrl;
          setUploadProgress(prev => ({ ...prev, [doc.documentType]: 100 }));
        });
        setUploadedDocs(docMap);
      }
    }
  }, [applicationData]);
  
  // Mutations
  const saveDraftMutation = trpc.driverApplication.saveDraftApplication.useMutation({
    onSuccess: () => {
      toast.success('Progress saved');
      refetchApplication();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });
  
  const uploadDocumentMutation = trpc.driverApplication.uploadDocument.useMutation({
    onSuccess: (data, variables) => {
      setUploadedDocs(prev => ({ ...prev, [variables.documentType]: data.fileUrl }));
      setUploadProgress(prev => ({ ...prev, [variables.documentType]: 100 }));
      toast.success(`${variables.documentType} uploaded successfully`);
      refetchApplication();
    },
    onError: (error, variables) => {
      setUploadProgress(prev => ({ ...prev, [variables.documentType]: 0 }));
      toast.error(`Failed to upload ${variables.documentType}: ${error.message}`);
    },
  });
  
  const checkKycMutation = trpc.driverApplication.checkPiKycStatus.useMutation({
    onSuccess: (data) => {
      setKycStatus(data.kycStatus as any);
      if (data.kycStatus !== 'verified') {
        toast.info(data.message);
      }
    },
    onError: (error) => {
      toast.error(`KYC check failed: ${error.message}`);
    },
  });
  
  const submitMutation = trpc.driverApplication.submitApplication.useMutation({
    onSuccess: () => {
      toast.success('Application submitted successfully! We will review it within 24-48 hours.');
      setLocation('/driver');
    },
    onError: (error) => {
      toast.error(`Submission failed: ${error.message}`);
    },
  });
  
  // Save draft when moving between steps
  const saveDraft = async () => {
    if (!fullName || !email || !phoneNumber) {
      return; // Don't save incomplete personal info
    }
    
    await saveDraftMutation.mutateAsync({
      fullName,
      email,
      phoneNumber,
      vehicleMake: vehicleMake || undefined,
      vehicleModel: vehicleModel || undefined,
      vehicleYear: vehicleYear || undefined,
      vehicleColor: vehicleColor || undefined,
      licensePlate: licensePlate || undefined,
      passengerCapacity: passengerCapacity || undefined,
    });
  };
  
  const handleFileUpload = async (file: File, documentType: DocumentType) => {
    if (!file) return;
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }
    
    setUploadProgress(prev => ({ ...prev, [documentType]: 10 }));
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      setUploadProgress(prev => ({ ...prev, [documentType]: 50 }));
      
      await uploadDocumentMutation.mutateAsync({
        documentType,
        fileData: base64,
        fileName: file.name,
        mimeType: file.type,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));
    }
  };
  
  const handlePiKYC = async () => {
    toast.info('Checking Pi Network KYC status...');
    await checkKycMutation.mutateAsync();
    
    if (kycStatus !== 'verified') {
      // Open Pi KYC portal
      window.open('https://kyc.pi.network', '_blank');
      toast.info('Please complete KYC verification in the opened window, then check status again');
    }
  };
  
  const handleSubmit = async () => {
    // Final validation
    if (!fullName || !email || !phoneNumber) {
      toast.error('Please complete personal information');
      setCurrentStep('personal');
      return;
    }
    
    if (!vehicleMake || !vehicleModel || !licensePlate) {
      toast.error('Please complete vehicle information');
      setCurrentStep('vehicle');
      return;
    }
    
    if (!uploadedDocs.license || !uploadedDocs.insurance || !uploadedDocs.registration) {
      toast.error('Please upload all required documents');
      setCurrentStep('documents');
      return;
    }
    
    if (kycStatus !== 'verified') {
      toast.error('Please complete Pi Network KYC verification');
      setCurrentStep('kyc');
      return;
    }
    
    await submitMutation.mutateAsync();
  };
  
  const nextStep = async () => {
    const steps: ApplicationStep[] = ['personal', 'vehicle', 'documents', 'kyc', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    
    // Validate current step
    if (currentStep === 'personal') {
      if (!fullName || !email || !phoneNumber) {
        toast.error('Please fill in all personal information');
        return;
      }
      await saveDraft();
    } else if (currentStep === 'vehicle') {
      if (!vehicleMake || !vehicleModel || !licensePlate) {
        toast.error('Please fill in all vehicle information');
        return;
      }
      await saveDraft();
    } else if (currentStep === 'documents') {
      if (!uploadedDocs.license || !uploadedDocs.insurance || !uploadedDocs.registration) {
        toast.error('Please upload all required documents');
        return;
      }
    } else if (currentStep === 'kyc') {
      if (kycStatus !== 'verified') {
        toast.error('Please complete Pi Network KYC verification');
        return;
      }
    }
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };
  
  const prevStep = () => {
    const steps: ApplicationStep[] = ['personal', 'vehicle', 'documents', 'kyc', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };
  
  const getStepNumber = (step: ApplicationStep): number => {
    const steps: ApplicationStep[] = ['personal', 'vehicle', 'documents', 'kyc', 'review'];
    return steps.indexOf(step) + 1;
  };
  
  const isStepComplete = (step: ApplicationStep): boolean => {
    switch (step) {
      case 'personal':
        return !!(fullName && email && phoneNumber);
      case 'vehicle':
        return !!(vehicleMake && vehicleModel && licensePlate);
      case 'documents':
        return !!(uploadedDocs.license && uploadedDocs.insurance && uploadedDocs.registration);
      case 'kyc':
        return kycStatus === 'verified';
      case 'review':
        return false;
      default:
        return false;
    }
  };
  
  // Show application status if already submitted
  if (applicationData?.application?.status === 'submitted' || applicationData?.application?.status === 'under_review') {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Application Under Review</CardTitle>
            <CardDescription>
              Your driver application has been submitted and is currently being reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-yellow-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium">Status: Under Review</span>
            </div>
            <p className="text-sm text-muted-foreground">
              We typically review applications within 24-48 hours. You will receive a notification once your application has been reviewed.
            </p>
            <Button onClick={() => setLocation('/dashboard')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (applicationData?.application?.status === 'approved') {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Application Approved
            </CardTitle>
            <CardDescription>
              Congratulations! Your driver application has been approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You can now start accepting ride requests. Go to your driver dashboard to get started.
            </p>
            <Button onClick={() => setLocation('/driver')}>
              Go to Driver Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (applicationData?.application?.status === 'rejected') {
    return (
      <>
        <a href="#main-content" className="sr-only">Skip to main content</a>
        <main id="main-content" className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Application Rejected</CardTitle>
            <CardDescription>
              Unfortunately, your driver application was not approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {applicationData.application.rejectionReason && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  <strong>Reason:</strong> {applicationData.application.rejectionReason}
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              You can submit a new application after addressing the issues mentioned above.
            </p>
            <Button onClick={() => setLocation('/dashboard')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
    );
  }
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Become a Driver</h1>
        <p className="text-muted-foreground mt-2">
          Complete the application process to start earning with OpenRide
        </p>
      </div>
      
      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {(['personal', 'vehicle', 'documents', 'kyc', 'review'] as ApplicationStep[]).map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`flex flex-col items-center ${index > 0 ? 'ml-4' : ''}`}>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  currentStep === step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isStepComplete(step)
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {isStepComplete(step) ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className="mt-2 text-xs font-medium capitalize">{step}</span>
            </div>
            {index < 4 && (
              <div
                className={`h-0.5 w-12 ${
                  isStepComplete(step) ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 'personal' && 'Personal Information'}
            {currentStep === 'vehicle' && 'Vehicle Information'}
            {currentStep === 'documents' && 'Required Documents'}
            {currentStep === 'kyc' && 'Identity Verification'}
            {currentStep === 'review' && 'Review & Submit'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'personal' && 'Tell us about yourself'}
            {currentStep === 'vehicle' && 'Provide details about your vehicle'}
            {currentStep === 'documents' && 'Upload required documents'}
            {currentStep === 'kyc' && 'Verify your identity with Pi Network'}
            {currentStep === 'review' && 'Review your application before submitting'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information Step */}
          {currentStep === 'personal' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          )}
          
          {/* Vehicle Information Step */}
          {currentStep === 'vehicle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleMake">Make *</Label>
                  <Input
                    id="vehicleMake"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Model *</Label>
                  <Input
                    id="vehicleModel"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Camry"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleYear">Year *</Label>
                  <Input
                    id="vehicleYear"
                    type="number"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(parseInt(e.target.value))}
                    placeholder="2020"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleColor">Color *</Label>
                  <Input
                    id="vehicleColor"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    placeholder="Silver"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licensePlate">License Plate *</Label>
                  <Input
                    id="licensePlate"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="ABC 1234"
                  />
                </div>
                <div>
                  <Label htmlFor="passengerCapacity">Passenger Capacity *</Label>
                  <Input
                    id="passengerCapacity"
                    type="number"
                    min="1"
                    max="8"
                    value={passengerCapacity}
                    onChange={(e) => setPassengerCapacity(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Documents Step */}
          {currentStep === 'documents' && (
            <div className="space-y-6">
              {(['license', 'insurance', 'registration'] as DocumentType[]).map((docType) => (
                <div key={docType} className="space-y-2">
                  <Label className="capitalize">
                    {docType === 'license' && "Driver's License *"}
                    {docType === 'insurance' && 'Insurance Certificate *'}
                    {docType === 'registration' && 'Vehicle Registration *'}
                  </Label>
                  {uploadedDocs[docType] ? (
                    <div className="flex items-center gap-2 rounded-md border border-green-600 bg-green-50 p-4">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Uploaded</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUploadedDocs(prev => ({ ...prev, [docType]: '' }));
                          setUploadProgress(prev => ({ ...prev, [docType]: 0 }));
                        }}
                      >
                        Replace
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, docType);
                        }}
                      />
                      {uploadProgress[docType] > 0 && uploadProgress[docType] < 100 && (
                        <Progress value={uploadProgress[docType]} className="h-2" />
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, or PDF (max 10MB)
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {/* KYC Step */}
          {currentStep === 'kyc' && (
            <div className="space-y-4">
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  OpenRide uses Pi Network's KYC verification to ensure all drivers are verified individuals.
                  This helps maintain trust and safety in our community.
                </p>
              </div>
              
              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Pi Network KYC</p>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="capitalize font-medium">{kycStatus.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {kycStatus === 'verified' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePiKYC}
                        disabled={checkKycMutation.isPending}
                      >
                        {checkKycMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          'Check Status'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.open('https://kyc.pi.network', '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Start KYC
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {fullName}</p>
                  <p><strong>Email:</strong> {email}</p>
                  <p><strong>Phone:</strong> {phoneNumber}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Vehicle Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Vehicle:</strong> {vehicleYear} {vehicleMake} {vehicleModel}</p>
                  <p><strong>Color:</strong> {vehicleColor}</p>
                  <p><strong>License Plate:</strong> {licensePlate}</p>
                  <p><strong>Capacity:</strong> {passengerCapacity} passengers</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Documents</h3>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Driver's License
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Insurance Certificate
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Vehicle Registration
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Identity Verification</h3>
                <p className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Pi Network KYC Verified
                </p>
              </div>
              
              <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
                <p className="text-sm text-yellow-800">
                  By submitting this application, you confirm that all information provided is accurate and complete.
                  False information may result in application rejection or account termination.
                </p>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 'personal'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep === 'review' ? (
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
