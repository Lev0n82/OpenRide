import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Package, MapPin, User, Phone, FileText, Truck } from 'lucide-react';

export default function DeliveryBooking() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const serviceType = searchParams.get('type') || 'delivery'; // 'delivery' or 'courier'
  const isCourier = serviceType === 'courier';
  const [formData, setFormData] = useState({
    pickupAddress: '',
    pickupLat: '',
    pickupLng: '',
    dropoffAddress: '',
    dropoffLat: '',
    dropoffLng: '',
    packageDescription: '',
    packageWeight: '',
    packageSize: 'medium' as 'small' | 'medium' | 'large' | 'xlarge',
    recipientName: '',
    recipientPhone: '',
    deliveryInstructions: '',
  });

  const requestDeliveryMutation = trpc.delivery.requestDelivery.useMutation({
    onSuccess: () => {
      toast.success('Delivery requested successfully!');
      navigate('/rider-dashboard');
    },
    onError: (error) => {
      toast.error(`Failed to request delivery: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate estimated fare based on distance (simplified)
    const estimatedFare = 1500; // $15.00 in cents (would be calculated from distance in production)
    
    requestDeliveryMutation.mutate({
      ...formData,
      packageWeight: parseFloat(formData.packageWeight),
      estimatedFare,
      estimatedDistance: 5000, // 5km placeholder
      estimatedDuration: 900, // 15 min placeholder
    });
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isCourier ? <Truck className="h-6 w-6" /> : <Package className="h-6 w-6" />}
            {isCourier ? 'Book Courier Service' : 'Request Delivery'}
          </CardTitle>
          <CardDescription>
            {isCourier 
              ? 'Professional courier service for businesses and bulk deliveries'
              : 'Send packages with OpenRide\'s trusted driver network'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pickup Location */}
            <div className="space-y-2">
              <Label htmlFor="pickupAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Pickup Address
              </Label>
              <Input
                id="pickupAddress"
                placeholder="123 Main St, City"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                required
              />
            </div>

            {/* Dropoff Location */}
            <div className="space-y-2">
              <Label htmlFor="dropoffAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Dropoff Address
              </Label>
              <Input
                id="dropoffAddress"
                placeholder="456 Oak Ave, City"
                value={formData.dropoffAddress}
                onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
                required
              />
            </div>

            {/* Package Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Package Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="packageDescription">Description</Label>
                <Input
                  id="packageDescription"
                  placeholder="Documents, electronics, etc."
                  value={formData.packageDescription}
                  onChange={(e) => setFormData({ ...formData, packageDescription: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageWeight">Weight (kg)</Label>
                  <Input
                    id="packageWeight"
                    type="number"
                    step="0.1"
                    placeholder="5"
                    value={formData.packageWeight}
                    onChange={(e) => setFormData({ ...formData, packageWeight: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packageSize">Size</Label>
                  <Select
                    value={formData.packageSize}
                    onValueChange={(value: any) => setFormData({ ...formData, packageSize: value })}
                  >
                    <SelectTrigger id="packageSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (Envelope)</SelectItem>
                      <SelectItem value="medium">Medium (Shoebox)</SelectItem>
                      <SelectItem value="large">Large (Suitcase)</SelectItem>
                      <SelectItem value="xlarge">XL (Multiple boxes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Recipient Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="recipientName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Recipient Name
                </Label>
                <Input
                  id="recipientName"
                  placeholder="John Doe"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Recipient Phone
                </Label>
                <Input
                  id="recipientPhone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="space-y-2">
              <Label htmlFor="deliveryInstructions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Delivery Instructions (Optional)
              </Label>
              <Textarea
                id="deliveryInstructions"
                placeholder="Leave at front door, call upon arrival, etc."
                value={formData.deliveryInstructions}
                onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                rows={3}
              />
            </div>

            {/* Estimated Cost */}
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Estimated Cost:</span>
                  <span className="text-2xl font-bold">$15.00</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  You'll earn 1 RIDE token for this delivery
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/rider-dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={requestDeliveryMutation.isPending}
                className="flex-1"
              >
                {requestDeliveryMutation.isPending ? 'Requesting...' : 'Request Delivery'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
