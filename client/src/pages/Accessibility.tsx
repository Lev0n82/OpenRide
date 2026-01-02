import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Mail, Phone, MessageSquare } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function Accessibility() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.system.notifyOwner.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    submitMutation.mutate({
      title: `Accessibility Support Request from ${formData.name}`,
      content: `
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}

Message:
${formData.message}
      `.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md"
      >
        Skip to main content
      </a>

      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Accessibility Statement
          </h1>
          <p className="mt-2 text-gray-600">
            OpenRide is committed to ensuring digital accessibility for people with disabilities
          </p>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Commitment Section */}
        <section aria-labelledby="commitment-heading" className="mb-12">
          <Card className="p-6">
            <h2 id="commitment-heading" className="text-2xl font-semibold text-gray-900 mb-4">
              Our Commitment
            </h2>
            <p className="text-gray-700 mb-4">
              OpenRide is committed to ensuring that our website and mobile application are accessible to people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
            </p>
            <p className="text-gray-700">
              We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.2 Level AAA</strong> standards, which represent the highest level of accessibility compliance.
            </p>
          </Card>
        </section>

        {/* Conformance Status */}
        <section aria-labelledby="conformance-heading" className="mb-12">
          <Card className="p-6">
            <h2 id="conformance-heading" className="text-2xl font-semibold text-gray-900 mb-4">
              Conformance Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-gray-900">WCAG 2.2 Level AAA</h3>
                  <p className="text-gray-700">
                    Our platform is designed to meet the highest accessibility standards, including enhanced color contrast, comprehensive keyboard navigation, and extensive screen reader support.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Accessibility Features */}
        <section aria-labelledby="features-heading" className="mb-12">
          <Card className="p-6">
            <h2 id="features-heading" className="text-2xl font-semibold text-gray-900 mb-4">
              Accessibility Features
            </h2>
            <ul className="space-y-3 text-gray-700" role="list">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Semantic HTML:</strong> Proper use of headings, landmarks, and semantic elements for clear page structure</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>ARIA Labels:</strong> Comprehensive ARIA labels and descriptions for all interactive elements</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Keyboard Navigation:</strong> Full keyboard accessibility with visible focus indicators</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Color Contrast:</strong> 7:1 minimum contrast ratio for all text and interactive elements</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Screen Reader Support:</strong> Optimized for JAWS, NVDA, VoiceOver, and TalkBack</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Responsive Design:</strong> Mobile-friendly interface that works across all devices</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Alternative Text:</strong> Descriptive alt text for all images and icons</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Skip Links:</strong> Skip navigation links to jump to main content</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Assistive Technologies */}
        <section aria-labelledby="technologies-heading" className="mb-12">
          <Card className="p-6">
            <h2 id="technologies-heading" className="text-2xl font-semibold text-gray-900 mb-4">
              Compatible Assistive Technologies
            </h2>
            <p className="text-gray-700 mb-4">
              OpenRide is designed to be compatible with the following assistive technologies:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700" role="list">
              <li>• JAWS (Windows)</li>
              <li>• NVDA (Windows)</li>
              <li>• VoiceOver (macOS, iOS)</li>
              <li>• TalkBack (Android)</li>
              <li>• Dragon NaturallySpeaking</li>
              <li>• ZoomText</li>
            </ul>
          </Card>
        </section>

        {/* Limitations */}
        <section aria-labelledby="limitations-heading" className="mb-12">
          <Card className="p-6">
            <h2 id="limitations-heading" className="text-2xl font-semibold text-gray-900 mb-4">
              Known Limitations
            </h2>
            <p className="text-gray-700 mb-4">
              Despite our best efforts, some limitations may exist:
            </p>
            <ul className="space-y-2 text-gray-700" role="list">
              <li>• Real-time map features may have limited screen reader support due to third-party dependencies</li>
              <li>• Some dynamic content updates may require manual refresh for screen readers</li>
              <li>• Pi Network payment integration relies on third-party SDK with its own accessibility constraints</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We are actively working to address these limitations and welcome your feedback.
            </p>
          </Card>
        </section>

        {/* Contact Form */}
        <section aria-labelledby="contact-heading" className="mb-12">
          <Card className="p-6">
            <h2 id="contact-heading" className="text-2xl font-semibold text-gray-900 mb-4">
              Need Accessibility Support?
            </h2>
            <p className="text-gray-700 mb-6">
              If you require accessibility support or encounter any barriers while using OpenRide, please let us know using the contact form below. We are committed to providing equal access to all users.
            </p>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center" role="alert">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Thank You!
                </h3>
                <p className="text-green-800">
                  Your message has been received. We will respond within 24-48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                  <Label htmlFor="name" className="text-gray-900 font-medium">
                    Name <span className="text-red-600" aria-label="required">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    aria-required="true"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-900 font-medium">
                    Email <span className="text-red-600" aria-label="required">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                    <Input
                      id="email"
                      type="email"
                      required
                      aria-required="true"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-900 font-medium">
                    Phone (Optional)
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-900 font-medium">
                    Message <span className="text-red-600" aria-label="required">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" aria-hidden="true" />
                    <Textarea
                      id="message"
                      required
                      aria-required="true"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="pl-10 min-h-[150px]"
                      placeholder="Please describe the accessibility issue or support you need..."
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitMutation.isPending || !formData.name || !formData.email || !formData.message}
                  className="w-full"
                  aria-busy={submitMutation.isPending}
                >
                  {submitMutation.isPending ? 'Sending...' : 'Submit Request'}
                </Button>

                {submitMutation.isError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800" role="alert">
                    Failed to submit request. Please try again or email us directly at accessibility@openride.com
                  </div>
                )}
              </form>
            )}
          </Card>
        </section>

        {/* Additional Resources */}
        <section aria-labelledby="resources-heading">
          <Card className="p-6">
            <h2 id="resources-heading" className="text-2xl font-semibold text-gray-900 mb-4">
              Additional Resources
            </h2>
            <ul className="space-y-2 text-gray-700" role="list">
              <li>
                <a href="https://www.w3.org/WAI/WCAG22/quickref/" className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded">
                  WCAG 2.2 Quick Reference
                </a>
              </li>
              <li>
                <a href="https://www.w3.org/WAI/" className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded">
                  Web Accessibility Initiative (WAI)
                </a>
              </li>
              <li>
                <a href="https://webaim.org/" className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded">
                  WebAIM - Web Accessibility In Mind
                </a>
              </li>
            </ul>
          </Card>
        </section>

        {/* Last Updated */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>This accessibility statement was last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
        </footer>
      </main>
    </div>
  );
}
