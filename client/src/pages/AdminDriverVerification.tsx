import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, FileText, Loader2, Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';

export default function AdminDriverVerification() {
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('submitted');
  
  // Fetch pending applications
  const { data: applicationsData, refetch } = trpc.driverApplication.getPendingApplications.useQuery();
  
  // Fetch selected application details
  const { data: applicationDetails } = trpc.driverApplication.getApplicationDetails.useQuery(
    { applicationId: selectedApplicationId! },
    { enabled: !!selectedApplicationId }
  );
  
  // Review mutation
  const reviewMutation = trpc.driverApplication.reviewApplication.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setReviewDialogOpen(false);
      setSelectedApplicationId(null);
      setRejectionReason('');
      refetch();
    },
    onError: (error) => {
      toast.error(`Review failed: ${error.message}`);
    },
  });
  
  const handleReview = async () => {
    if (!selectedApplicationId) return;
    
    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    await reviewMutation.mutateAsync({
      applicationId: selectedApplicationId,
      action: reviewAction,
      rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
    });
  };
  
  const openReviewDialog = (applicationId: number, action: 'approve' | 'reject') => {
    setSelectedApplicationId(applicationId);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };
  
  const getStatusBadge = (status: ApplicationStatus) => {
    const variants: Record<ApplicationStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', color: string }> = {
      draft: { variant: 'outline', color: 'text-gray-800' },
      submitted: { variant: 'secondary', color: 'text-blue-600' },
      under_review: { variant: 'secondary', color: 'text-yellow-600' },
      approved: { variant: 'default', color: 'text-green-600' },
      rejected: { variant: 'destructive', color: 'text-red-600' },
    };
    
    return (
      <Badge variant={variants[status].variant} className={variants[status].color}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };
  
  // Filter applications
  const filteredApplications = applicationsData?.applications.filter(app => {
    const matchesSearch = 
      app.application.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.application.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.application.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.application.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];
  
  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Driver Application Verification</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve driver applications
        </p>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or license plate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Applications List */}
      <div className="grid gap-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.application.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {application.application.fullName}
                      {getStatusBadge(application.application.status)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {application.application.email} • {application.application.phoneNumber}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApplicationId(application.application.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    {application.application.status === 'submitted' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openReviewDialog(application.application.id, 'approve')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openReviewDialog(application.application.id, 'reject')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vehicle</p>
                    <p className="font-medium">
                      {application.application.vehicleYear} {application.application.vehicleMake} {application.application.vehicleModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">License Plate</p>
                    <p className="font-medium">{application.application.licensePlate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Capacity</p>
                    <p className="font-medium">{application.application.passengerCapacity} passengers</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">KYC Status</p>
                    <p className="font-medium capitalize">{application.application.piKycStatus.replace('_', ' ')}</p>
                  </div>
                </div>
                
                {application.application.status === 'rejected' && application.application.rejectionReason && (
                  <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {application.application.rejectionReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Application Details Dialog */}
      {selectedApplicationId && applicationDetails && (
        <Dialog open={!!selectedApplicationId && !reviewDialogOpen} onOpenChange={() => setSelectedApplicationId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Review all information and documents
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-medium">{applicationDetails.application.fullName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{applicationDetails.application.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{applicationDetails.application.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pi KYC Status</p>
                    <p className="font-medium capitalize">{applicationDetails.application.piKycStatus.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
              
              {/* Vehicle Information */}
              <div>
                <h3 className="font-semibold mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Make & Model</p>
                    <p className="font-medium">
                      {applicationDetails.application.vehicleYear} {applicationDetails.application.vehicleMake} {applicationDetails.application.vehicleModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Color</p>
                    <p className="font-medium">{applicationDetails.application.vehicleColor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">License Plate</p>
                    <p className="font-medium">{applicationDetails.application.licensePlate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Passenger Capacity</p>
                    <p className="font-medium">{applicationDetails.application.passengerCapacity} passengers</p>
                  </div>
                </div>
              </div>
              
              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-3">Uploaded Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {applicationDetails.documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm capitalize flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {doc.documentType.replace('_', ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {doc.mimeType.startsWith('image/') ? (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={doc.fileUrl}
                                alt={doc.documentType}
                                className="w-full h-40 object-cover rounded-md border"
                              />
                            </a>
                          ) : (
                            <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md border">
                              <FileText className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            <p className="truncate">{doc.fileName}</p>
                            <p>{(doc.fileSize / 1024).toFixed(0)} KB</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                          >
                            <Eye className="mr-2 h-3 w-3" />
                            View Full Size
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedApplicationId(null)}>
                Close
              </Button>
              {applicationDetails.application.status === 'submitted' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setReviewDialogOpen(true);
                      setReviewAction('reject');
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setReviewDialogOpen(true);
                      setReviewAction('approve');
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Review Confirmation Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? 'This will approve the driver application and create their driver profile.'
                : 'Please provide a reason for rejection. The applicant will be notified.'}
            </DialogDescription>
          </DialogHeader>
          
          {reviewAction === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Documents are not clear, vehicle does not meet requirements..."
                rows={4}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewAction === 'approve' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
