import React, { useState, useEffect } from 'react';
import { Video, Phone, FileText, Eye, Check, ChevronRight, ExternalLink } from 'lucide-react';
import { videoCallAPI, formsAPI, geolocationAPI } from '../services/api';

const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    policyNumber: ''
  });
  const [videoCallStatus, setVideoCallStatus] = useState('idle'); // idle, pending, completed
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [geolocation, setGeolocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  const steps = [
    { id: 1, title: 'Video Call', icon: Video, description: 'Connect with our team' },
    { id: 2, title: 'Form Filling', icon: FileText, description: 'Provide your details' },
    { id: 3, title: 'Preview & Submit', icon: Eye, description: 'Review and confirm' }
  ];

  // Capture geolocation on component mount
  useEffect(() => {
    const captureGeolocation = async () => {
      try {
        const position = await geolocationAPI.getCurrentPosition();
        setGeolocation(position);
      } catch (error) {
        console.error('Error getting geolocation:', error);
      }
    };

    captureGeolocation();
  }, []);

  const completeStep = React.useCallback((stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  }, [completedSteps]); // Add completedSteps to the dependency array of useCallback

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (videoCallStatus === 'pending' && sessionId) {
      pollInterval = setInterval(async () => {
        try {
          const data = await videoCallAPI.getStatus(sessionId);
          
          if (data.status === 'completed') {
            setVideoCallStatus('completed');
            completeStep(1);
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Error polling video call status:', error);
        }
      }, 2000); // Poll every 2 seconds
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [videoCallStatus, sessionId, completeStep]);

  const canAccessStep = (stepId: number) => {
    if (stepId === 1) return true;
    return completedSteps.includes(stepId - 1);
  };

  const startVideoCall = async () => {
    try {
      const response = await videoCallAPI.create({
        claimId: 'CLM-2025-8847',
        patientName: 'John Smith',
        procedure: 'MRI Knee Joint'
      });

      if (response.success) {
        setSessionId(response.sessionId);
        setVideoCallStatus('pending');
        
        // Open video call in new tab
        const videoCallWindow = window.open(
          `/meeting?sessionId=${response.sessionId}&roomName=${response.roomName}`,
          '_blank',
          'width=1200,height=800,scrollbars=yes,resizable=yes'
        );
        
        if (!videoCallWindow) {
          alert('Please allow popups for this site to open the video call window.');
          setVideoCallStatus('idle');
        }
      } else {
        alert('Failed to create video call session. Please try again.');
      }
    } catch (error) {
      console.error('Error creating video call:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const handleFormSubmit = () => {
    if (formData.name && formData.email && formData.phone) {
      completeStep(2);
      setCurrentStep(3);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      if (!sessionId) {
        alert('Session ID is missing. Please restart the process.');
        return;
      }

      // Prepare form data with geolocation
      const submissionData = {
        session_id: sessionId,
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        policy_number: formData.policyNumber,
        message: formData.message,
        ...(geolocation && {
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          geo_accuracy_m: geolocation.accuracy,
        }),
      };

      const response = await formsAPI.submit(submissionData);
      
      if (response.success) {
        completeStep(3);
        alert('Application submitted successfully! You will receive a confirmation email shortly.');
      } else {
        alert('Submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isFormValid = formData.name && formData.email && formData.phone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Health Insurance Verification</h1>
          <p className="text-lg text-gray-600">Complete these steps to process your claim</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-300 ${
                  completedSteps.includes(step.id)
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : canAccessStep(step.id)
                    ? 'bg-white border-gray-300 text-gray-600 hover:border-blue-300'
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}>
                  {completedSteps.includes(step.id) ? (
                    <Check size={24} />
                  ) : (
                    <step.icon size={24} />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-4 transition-colors duration-300 ${
                    completedSteps.includes(step.id) ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Step Labels */}
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="text-center w-16">
                <h3 className={`font-semibold text-sm ${
                  completedSteps.includes(step.id) ? 'text-green-600' : 
                  currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Step 1: Video Call */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Video size={48} className="text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Video Call Verification</h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Start with a secure video consultation for identity and document verification. This is required for claim processing and fraud prevention.
                </p>
              </div>

              {videoCallStatus === 'idle' && (
                <div className="space-y-4">
                  <button
                    onClick={startVideoCall}
                    className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Video className="mr-3" size={24} />
                    Start Video Call
                    <ExternalLink className="ml-2" size={20} />
                  </button>
                  <p className="text-sm text-gray-500">This will open in a new window</p>
                </div>
              )}

              {videoCallStatus === 'pending' && (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Phone size={32} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-blue-600 font-semibold text-lg">Video Call in Progress</p>
                    <p className="text-gray-600">Please complete the video call in the opened window</p>
                    {sessionId && (
                      <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-yellow-800 text-sm">
                      <strong>Note:</strong> Complete the video call and verification process. This page will automatically update when finished.
                    </p>
                  </div>
                </div>
              )}

              {videoCallStatus === 'completed' && (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Check size={40} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-green-600 font-semibold text-xl">Video Call Completed Successfully!</p>
                    <p className="text-gray-600">Identity verification and document review completed</p>
                    {sessionId && (
                      <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 shadow-lg"
                  >
                    Continue to Form
                    <ChevronRight className="ml-2" size={20} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Form Filling */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText size={48} className="text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Personal Information</h2>
                <p className="text-gray-600">Please provide your contact details for claim processing</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Policy Number</label>
                  <input
                    type="text"
                    name="policyNumber"
                    value={formData.policyNumber || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="Enter your policy number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="Any additional information about your claim..."
                  />
                </div>

                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    disabled={!isFormValid}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      isFormValid
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Continue to Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Submit */}
          {currentStep === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Eye size={48} className="text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Review Your Application</h2>
                <p className="text-gray-600">Please review all information before final submission</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Video Call Status */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-2">
                    <Check className="text-green-600 mr-3" size={24} />
                    <h3 className="text-lg font-semibold text-green-800">Video Verification Completed</h3>
                  </div>
                  <div className="text-green-700 space-y-1">
                    <p>✓ Identity verification successful</p>
                    <p>✓ Document review completed</p>
                    {sessionId && <p className="text-sm">Session ID: {sessionId}</p>}
                  </div>
                </div>

                {/* Form Data Preview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Your Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-blue-200">
                      <span className="font-medium text-blue-700">Name:</span>
                      <span className="text-blue-800">{formData.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-blue-200">
                      <span className="font-medium text-blue-700">Email:</span>
                      <span className="text-blue-800">{formData.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-blue-200">
                      <span className="font-medium text-blue-700">Phone:</span>
                      <span className="text-blue-800">{formData.phone}</span>
                    </div>
                    {formData.policyNumber && (
                      <div className="flex justify-between py-2 border-b border-blue-200">
                        <span className="font-medium text-blue-700">Policy Number:</span>
                        <span className="text-blue-800">{formData.policyNumber}</span>
                      </div>
                    )}
                    {formData.message && (
                      <div className="py-2">
                        <span className="font-medium text-blue-700 block mb-2">Message:</span>
                        <span className="text-blue-800 italic">{formData.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-purple-800 text-sm text-center">
                    🔒 All information is encrypted and securely transmitted. Your privacy is protected.
                  </p>
                </div>

                <div className="flex justify-between pt-6">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center space-x-4">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => canAccessStep(step.id) && setCurrentStep(step.id)}
              disabled={!canAccessStep(step.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentStep === step.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : completedSteps.includes(step.id)
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : canAccessStep(step.id)
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              Step {step.id}
            </button>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-lg">
            <span className="text-sm font-medium text-gray-600 mr-2">
              Progress: {completedSteps.length} of {steps.length} steps completed
            </span>
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Session Info */}
        {sessionId && (
          <div className="mt-6 text-center">
            <div className="inline-block bg-gray-100 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-600">
                Session: {sessionId} | Video Call Status: 
                <span className={`ml-1 font-semibold ${
                  videoCallStatus === 'completed' ? 'text-green-600' : 
                  videoCallStatus === 'pending' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {videoCallStatus.charAt(0).toUpperCase() + videoCallStatus.slice(1)}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiStepForm;