import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Video, Phone, FileText, Eye, Check, ChevronRight, ExternalLink, Send, Copy, MapPin, Link2 } from 'lucide-react';
import { claimsAPI, videoCallAPI, formsAPI, smsAPI } from '../services/api';

const MultiStepForm = () => {
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    patientName: '',
    dob: '',
    mobile: '',
    relationship: '',
    insuredName: '',
    policyNumber: '',
    product: '',
    hospitalName: '',
    hospitalLocation: '',
    hospitalState: '',
    doa: '',
    dod: '',
    ntId: '',
    hospitalStatus: '',
    diagnosisDetails: '',
    finalStatusRemarks: '',
    email: '',
    message: ''
  });
  
  const [videoCallStatus, setVideoCallStatus] = useState<'idle' | 'generated' | 'pending' | 'completed'>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [meetingLinks, setMeetingLinks] = useState({ patientLink: '', doctorLink: '' });
  const [smsStatus, setSmsStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [geolocation, setGeolocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  
  const [claimInfo, setClaimInfo] = useState<{
    claimId: string;
    patientMobile: string;
    hospitalCity: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);

  // Fetch claim data when component mounts
  useEffect(() => {
    const fetchClaimData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        const claimData = await claimsAPI.getById(parseInt(id));
        setClaimInfo({
          claimId: claimData.claim_number,
          patientMobile: claimData.patient_mobile,
          hospitalCity: claimData.hospital_city
        });
        // Pre-fill patient mobile in form data
        setFormData(prev => ({ ...prev, mobile: claimData.patient_mobile }));
      } catch (error) {
        console.error('Error fetching claim data:', error);
        alert('Failed to load claim data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClaimData();
  }, [id]);

  const steps = [
    { id: 1, title: 'Video Setup', icon: Video, description: 'Generate meeting links' },
    { id: 2, title: 'Claim Details', icon: FileText, description: 'Fill verification form' },
    { id: 3, title: 'Preview & Submit', icon: Eye, description: 'Review and confirm' }
  ];

  // Capture geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => console.error('Error getting geolocation:', error)
      );
    }
  }, []);

  const completeStep = React.useCallback((stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  }, [completedSteps]);


  const canAccessStep = (stepId: number) => stepId === 1 || completedSteps.includes(stepId - 1);

  const generateMeetingLinks = async () => {
    if (!claimInfo) return;
    
    try {
      const response = await videoCallAPI.create({
        claimId: claimInfo.claimId,
        patientName: formData.patientName || 'Patient',
        procedure: 'Medical Verification'
      });
      
      if (response.success) {
        setSessionId(response.sessionId);
        setMeetingLinks({ 
          patientLink: response.patientUrl, 
          doctorLink: response.roomUrl 
        });
        setVideoCallStatus('generated');
        // SMS is sent as part of the video call creation
        setSmsStatus(response.smsSent ? 'sent' : 'error');
      }
    } catch (error) {
      alert('Error generating meeting links. Please try again.');
    }
  };

  const sendPatientSMS = async () => {
    if (!claimInfo?.patientMobile || !meetingLinks.patientLink) {
      alert('Patient mobile number or meeting link is missing');
      return;
    }
    
    setSmsStatus('sending');
    try {
      const message = `VerifyCall Video Verification\n\nHello ${formData.patientName || 'Patient'},\n\nPlease join your video verification call for claim ${claimInfo.claimId}:\n\n🔗 Meeting Link: ${meetingLinks.patientLink}\n\n📋 Procedure: Medical Verification\n\n⏰ Please join as soon as possible. The call will be recorded for verification purposes.\n\nIf you have any issues, please contact support.\n\nThank you,\nVerifyCall Team`;
      
      const response = await smsAPI.send(claimInfo.patientMobile, message, claimInfo.claimId);
      
      if (response.success) {
        setSmsStatus('sent');
        alert('SMS sent successfully!');
      } else {
        setSmsStatus('error');
        alert(`Failed to send SMS: ${response.message}`);
      }
    } catch (error) {
      setSmsStatus('error');
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS. Please try again.');
    }
  };

  const joinVideoCall = () => {
    if (!meetingLinks.doctorLink || !sessionId) {
      alert('Doctor meeting link or session ID is not available');
      return;
    }

    // Open the doctor link in a new tab
    const newWindow = window.open(meetingLinks.doctorLink, '_blank');

    // Set status to pending and start polling for completion
    setVideoCallStatus('pending');

    // Poll for video call status to detect completion
    const pollForCompletion = async () => {
      try {
        const data = await videoCallAPI.getStatus(sessionId);
        if (data.status === 'completed') {
          setVideoCallStatus('completed');
          completeStep(1);
          return;
        }

        // Continue polling every 2 seconds if call is still active
        setTimeout(pollForCompletion, 2000);
      } catch (error) {
        console.error('Error polling video call status:', error);
        // Retry after 2 seconds even if there's an error
        setTimeout(pollForCompletion, 2000);
      }
    };

    // Start polling
    pollForCompletion();
  };

  const completeVideoCall = async () => {
    if (!sessionId) {
      alert('Session ID is not available');
      return;
    }

    try {
      await videoCallAPI.complete(sessionId);
      setVideoCallStatus('completed');
      completeStep(1);
      alert('Video call completed successfully! Recording has been uploaded.');
    } catch (error) {
      console.error('Error completing video call:', error);
      alert('Failed to complete video call. Please try again.');
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} link copied to clipboard!`);
    } catch {
      alert('Failed to copy');
    }
  };

  const handleFormSubmit = () => {
    const requiredFields = ['patientName', 'insuredName', 'policyNumber', 'hospitalName'];
    if (requiredFields.every(f => formData[f as keyof typeof formData])) {
      completeStep(2);
      setCurrentStep(3);
    } else {
      alert('Please fill all required fields');
    }
  };

  const handleFinalSubmit = async () => {
    if (!sessionId) return alert('Session ID missing');
    if (!claimInfo) return alert('Claim information missing');
    
    try {
      // Submit form data
      const response = await formsAPI.submit({
        session_id: sessionId,
        full_name: formData.patientName,
        email: formData.email,
        phone: formData.mobile,
        policy_number: formData.policyNumber,
        message: formData.diagnosisDetails,
        latitude: geolocation?.latitude,
        longitude: geolocation?.longitude,
        geo_accuracy_m: geolocation?.accuracy
      });
      
      if (response.success) {
        completeStep(3);
        alert('Claim verification submitted successfully!');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Submission failed');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <Video size={32} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-white mb-2">VerifyCall</h1>
              <p className="text-blue-200">Insurance Claims Verification System</p>
            </div>
          </div>
          <p className="text-lg text-blue-100">Complete video verification and claim processing</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-300 cursor-pointer ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-500 border-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : canAccessStep(step.id)
                      ? 'bg-white border-gray-300 text-gray-600 hover:border-blue-300'
                      : 'bg-gray-700 border-gray-600 text-gray-400'
                  }`}
                  onClick={() => canAccessStep(step.id) && setCurrentStep(step.id)}
                >
                  {completedSteps.includes(step.id) ? <Check size={24} /> : <step.icon size={24} />}
                </div>
                <div className="ml-4 text-white text-left">
                  <div className="font-semibold">{step.title}</div>
                  <div className="text-sm text-blue-200">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-8 transition-colors duration-300 ${
                    completedSteps.includes(step.id) ? 'bg-green-300' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Claim Info Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-blue-200 text-sm">Claim ID:</span>
                  <div className="font-semibold">{claimInfo?.claimId || 'Loading...'}</div>
                </div>
                <div>
                  <span className="text-blue-200 text-sm">Patient Mobile:</span>
                  <div className="font-semibold">{claimInfo?.patientMobile || 'Loading...'}</div>
                </div>
                <div>
                  <span className="text-blue-200 text-sm">Hospital City:</span>
                  <div className="font-semibold">{claimInfo?.hospitalCity || 'Loading...'}</div>
                </div>
              </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Video Call Setup</h2>
              
              {videoCallStatus === 'idle' && (
                <div className="space-y-6">
                  <p className="text-gray-600 mb-6">Generate secure meeting links for patient and doctor video verification</p>
                  <button 
                    onClick={generateMeetingLinks} 
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold shadow-lg"
                  >
                    <Video size={20} className="inline mr-2" />
                    Generate Meeting Links
                  </button>
                </div>
              )}
              
              {videoCallStatus === 'generated' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-lg mb-4 text-blue-800">Meeting Links Generated</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="font-medium text-gray-800">Patient Link:</p>
                            <p className="text-sm text-gray-600 break-all">{meetingLinks.patientLink}</p>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(meetingLinks.patientLink, 'Patient')}
                            className="ml-4 p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <button 
                          onClick={sendPatientSMS}
                          disabled={smsStatus === 'sending'}
                          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                            smsStatus === 'sent' 
                              ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                              : smsStatus === 'sending'
                              ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <Send size={16} className="inline mr-2" />
                          {smsStatus === 'sent' ? 'SMS Sent ✓' : smsStatus === 'sending' ? 'Sending...' : 'Send SMS to Patient'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-xl">
                    <div className="bg-white p-4 rounded-lg border mb-4">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <p className="font-medium text-gray-800">Doctor Link:</p>
                          <p className="text-sm text-gray-600 break-all">{meetingLinks.doctorLink}</p>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={joinVideoCall}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold shadow-lg"
                    >
                      <Video size={20} className="inline mr-2" />
                      Join Video Call as Doctor
                    </button>
                  </div>
                </div>
              )}
              
              {videoCallStatus === 'pending' && (
                <div className="space-y-6">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Video size={32} className="text-white" />
                    </div>
                    <p className="text-xl font-semibold text-blue-600">Video Call in Progress...</p>
                    <p className="text-gray-600 mb-6">Waiting for call completion</p>
                  </div>
                  <button
                    onClick={completeVideoCall}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg"
                  >
                    <Check size={20} className="inline mr-2" />
                    Complete Video Call and Upload Video Recording
                  </button>
                </div>
              )}
              
              {videoCallStatus === 'completed' && (
                <div className="space-y-6">
                  <div className="text-green-600">
                    <Check size={64} className="mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Video Call Completed!</h3>
                    <p className="text-gray-600 mb-6">You can now proceed to fill the claim details</p>
                  </div>
                  <button 
                    onClick={() => setCurrentStep(2)} 
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold shadow-lg"
                  >
                    Continue to Claim Details
                    <ChevronRight size={20} className="inline ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Claim Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                  <input 
                    name="patientName" 
                    placeholder="Enter patient name" 
                    value={formData.patientName} 
                    onChange={handleInputChange} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input 
                    name="dob" 
                    type="date"
                    value={formData.dob} 
                    onChange={handleInputChange} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Insured Name *</label>
                  <input 
                    name="insuredName" 
                    placeholder="Enter insured name" 
                    value={formData.insuredName} 
                    onChange={handleInputChange} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Policy Number *</label>
                  <input 
                    name="policyNumber" 
                    placeholder="Enter policy number" 
                    value={formData.policyNumber} 
                    onChange={handleInputChange} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name *</label>
                  <input 
                    name="hospitalName" 
                    placeholder="Enter hospital name" 
                    value={formData.hospitalName} 
                    onChange={handleInputChange} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Location</label>
                  <input 
                    name="hospitalLocation" 
                    placeholder="Enter hospital location" 
                    value={formData.hospitalLocation} 
                    onChange={handleInputChange} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Admission</label>
                  <input 
                    name="doa" 
                    type="date"
                    value={formData.doa} 
                    onChange={handleInputChange} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Discharge</label>
                  <input 
                    name="dod" 
                    type="date"
                    value={formData.dod} 
                    onChange={handleInputChange} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis Details</label>
                <textarea 
                  name="diagnosisDetails" 
                  placeholder="Enter diagnosis details" 
                  value={formData.diagnosisDetails} 
                  onChange={handleInputChange} 
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mt-8 text-center">
                <button 
                  onClick={handleFormSubmit} 
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg"
                >
                  Continue to Preview
                  <ChevronRight size={20} className="inline ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Preview & Submit</h2>
              
              <div className="bg-gray-50 p-6 rounded-xl mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Claim Information Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Patient Name:</span>
                    <div className="font-semibold">{formData.patientName || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Insured Name:</span>
                    <div className="font-semibold">{formData.insuredName || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Policy Number:</span>
                    <div className="font-semibold">{formData.policyNumber || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Hospital Name:</span>
                    <div className="font-semibold">{formData.hospitalName || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Session ID:</span>
                    <div className="font-semibold font-mono">{sessionId}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Hospital City:</span>
                    <div className="font-semibold">{claimInfo?.hospitalCity || 'Not available'}</div>
                  </div>
                </div>
                
                {formData.diagnosisDetails && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-600">Diagnosis Details:</span>
                    <div className="mt-1 p-3 bg-white rounded border text-sm">{formData.diagnosisDetails}</div>
                  </div>
                )}
              </div>
              
              {geolocation && (
                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                  <div className="flex items-center mb-2">
                    <MapPin size={16} className="text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">Location Captured</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Coordinates: {geolocation.latitude.toFixed(6)}, {geolocation.longitude.toFixed(6)} 
                    <span className="ml-2">(±{Math.round(geolocation.accuracy)}m accuracy)</span>
                  </p>
                </div>
              )}
              
              <div className="text-center">
                <button 
                  onClick={handleFinalSubmit} 
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold shadow-lg"
                >
                  <Check size={20} className="inline mr-2" />
                  Submit Verification Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;