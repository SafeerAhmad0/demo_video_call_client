import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, FileText, Phone, MapPin, Globe, Upload, Check } from 'lucide-react';
import { claimsAPI } from '../services/api';

interface CreateClaimFormProps {
  onBack: () => void;
}

interface ClaimFormData {
  claimID: string;
  patientName: string;
  patientMobile: string;
  hospitalCity: string;
  hospitalState: string;
  patientLanguage: string;
}

interface ClaimFormErrors {
  [key: string]: string;
}

type SubmitStatus = {
  type: 'success' | 'error';
  message: string;
} | null;

type FormStep = 'form' | 'upload' | 'complete';

const CreateClaimForm: React.FC<CreateClaimFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<ClaimFormData>({
    claimID: '',
    patientName: '',
    patientMobile: '',
    hospitalCity: '',
    hospitalState: '',
    patientLanguage: '',
  });

  const [errors, setErrors] = useState<ClaimFormErrors>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<FormStep>('form');
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const uploadFileViaAPI = async (file: File, claimId: string): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('claimId', claimId);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const data = await response.json();
      console.log('File uploaded:', data.key);
    } catch (error) {
      console.error('API upload error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const validTypes = [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
      ];
      return (
        validTypes.includes(file.type) ||
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.zip')
      );
    });

    if (validFiles.length !== files.length) {
      setErrors(prev => ({
        ...prev,
        files: 'Only PDF and ZIP files are allowed.',
      }));
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    setErrors(prev => ({ ...prev, files: '' }));

    // Upload files via API with ClaimID folder
    setIsUploading(true);
    
    for (const file of validFiles) {
      try {
        await uploadFileViaAPI(file, formData.claimID);
        setUploadedFileNames(prev => [...prev, file.name]);
        console.log('File uploaded via API:', file.name);
      } catch (error) {
        console.error('Error uploading file:', error);
        setErrors(prev => ({
          ...prev,
          files: 'Error uploading file via API.',
        }));
      }
    }
    
    setIsUploading(false);
  };


  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedFileNames(prev => prev.filter((_, i) => i !== index));
  };

  const validateFormData = (): ClaimFormErrors => {
    const newErrors: ClaimFormErrors = {};

    if (!formData.claimID.trim()) {
      newErrors.claimID = 'Claim ID is required';
    }

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }

    if (!formData.patientMobile.trim()) {
      newErrors.patientMobile = 'Patient mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.patientMobile.replace(/\s/g, ''))) {
      newErrors.patientMobile = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (!formData.hospitalCity.trim()) {
      newErrors.hospitalCity = 'Hospital city is required';
    }

    if (!formData.hospitalState) {
      newErrors.hospitalState = 'Hospital state is required';
    }

    if (!formData.patientLanguage) {
      newErrors.patientLanguage = 'Patient language is required';
    }

    return newErrors;
  };

  const validateFiles = (): ClaimFormErrors => {
    const newErrors: ClaimFormErrors = {};

    if (uploadedFiles.length === 0) {
      newErrors.files = 'At least one file must be uploaded';
    }

    if (isUploading) {
      newErrors.files = 'Files are still uploading';
    }

    return newErrors;
  };

  // Step 1: Save form data to PostgreSQL
  const handleSaveFormData = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateFormData();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSavingForm(true);
    try {
      // Save form data to PostgreSQL database using the API service
      const claimData = await claimsAPI.create({
        claim_number: formData.claimID,
        patient_mobile: formData.patientMobile,
        hospital_city: formData.hospitalCity,
        hospital_state: formData.hospitalState,
        language: formData.patientLanguage,
      });
      
      setSubmitStatus({ 
        type: 'success', 
        message: 'Claim data saved successfully! Now you can upload documents.' 
      });
      
      // Move to upload step
      setCurrentStep('upload');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSubmitStatus(null), 3000);

    } catch (error) {
      console.error('Error saving claim data:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to save claim data. Please try again.',
      });
    }
    setIsSavingForm(false);
  };

    // Step 2: Complete the process (files already uploaded via API)
  const handleCompleteSubmission = async (e: React.FormEvent) => {
    e.preventDefault();

    const fileValidationErrors = validateFiles();
    if (Object.keys(fileValidationErrors).length > 0) {
      setErrors(fileValidationErrors);
      return;
    }

    setSubmitStatus({ 
      type: 'success', 
      message: 'Claim created and documents uploaded successfully!' 
    });
    
    setCurrentStep('complete');

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitStatus(null);
      setUploadedFiles([]);
      setUploadedFileNames([]);
      setErrors({});
      setCurrentStep('form');
      setFormData({
        claimID: '',
        patientName: '',
        patientMobile: '',
        hospitalCity: '',
        hospitalState: '',
        patientLanguage: '',
      });
    }, 3000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canSubmitForm = !isSavingForm && currentStep === 'form';
  const canUploadFiles = currentStep === 'upload' && !isUploading;
  const canCompleteSubmission = currentStep === 'upload' && !isUploading && uploadedFiles.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-8 shadow-2xl">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center mb-6 text-purple-400 hover:text-purple-300 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>

          <h2 className="text-3xl font-bold text-white mb-8 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
            Create New Claim
          </h2>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${currentStep === 'form' ? 'text-purple-400' : currentStep === 'upload' || currentStep === 'complete' ? 'text-green-400' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'form' ? 'bg-purple-600' : currentStep === 'upload' || currentStep === 'complete' ? 'bg-green-600' : 'bg-gray-600'}`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Claim Details</span>
              </div>
              <div className={`flex-1 h-0.5 mx-4 ${currentStep === 'upload' || currentStep === 'complete' ? 'bg-green-400' : 'bg-gray-600'}`}></div>
              <div className={`flex items-center ${currentStep === 'upload' ? 'text-purple-400' : currentStep === 'complete' ? 'text-green-400' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'upload' ? 'bg-purple-600' : currentStep === 'complete' ? 'bg-green-600' : 'bg-gray-600'}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Upload Documents</span>
              </div>
            </div>
          </div>

          {/* Display submit status */}
          {submitStatus && (
            <div className={`mb-6 p-4 rounded-xl border backdrop-blur-md ${
              submitStatus.type === 'success'
                ? 'bg-green-500/20 border-green-500/50 text-green-200'
                : 'bg-red-500/20 border-red-500/50 text-red-200'
            }`}>
              <div className="flex items-center space-x-3">
                {submitStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{submitStatus.message}</span>
              </div>
            </div>
          )}

          {/* Step 1: Form Fields */}
          {currentStep === 'form' && (
            <div>
              {/* Claim ID */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">Claim ID</label>
                <input
                  name="claimID"
                  value={formData.claimID}
                  onChange={handleInputChange}
                  placeholder="Enter Claim ID"
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                    errors.claimID ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.claimID && <p className="text-red-400 text-xs mt-1">{errors.claimID}</p>}
                <p className="text-gray-400 text-xs mt-1">Please enter the Claim ID manually</p>
              </div>

              {/* Patient Name */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">Patient Name</label>
                <input
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  placeholder="Enter patient's full name"
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                    errors.patientName ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.patientName && <p className="text-red-400 text-xs mt-1">{errors.patientName}</p>}
              </div>

              {/* Patient Mobile */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">Patient Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    name="patientMobile"
                    value={formData.patientMobile}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                      errors.patientMobile ? 'border-red-500' : 'border-slate-600'
                    }`}
                  />
                </div>
                {errors.patientMobile && <p className="text-red-400 text-xs mt-1">{errors.patientMobile}</p>}
              </div>

              {/* Hospital City */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">Hospital City</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    name="hospitalCity"
                    value={formData.hospitalCity}
                    onChange={handleInputChange}
                    placeholder="Enter hospital city"
                    className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                      errors.hospitalCity ? 'border-red-500' : 'border-slate-600'
                    }`}
                  />
                </div>
                {errors.hospitalCity && <p className="text-red-400 text-xs mt-1">{errors.hospitalCity}</p>}
              </div>

              {/* Hospital State */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">Hospital State</label>
                <select
                  name="hospitalState"
                  value={formData.hospitalState}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                    errors.hospitalState ? 'border-red-500' : 'border-slate-600'
                  }`}
                >
                  <option value="">Select State/UT</option>
                  <option value="AN">Andaman and Nicobar Islands</option>
                  <option value="AP">Andhra Pradesh</option>
                  <option value="AR">Arunachal Pradesh</option>
                  <option value="AS">Assam</option>
                  <option value="BR">Bihar</option>
                  <option value="CG">Chhattisgarh</option>
                  <option value="CH">Chandigarh</option>
                  <option value="DH">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="DL">Delhi</option>
                  <option value="GA">Goa</option>
                  <option value="GJ">Gujarat</option>
                  <option value="HR">Haryana</option>
                  <option value="HP">Himachal Pradesh</option>
                  <option value="JK">Jammu and Kashmir</option>
                  <option value="JH">Jharkhand</option>
                  <option value="KA">Karnataka</option>
                  <option value="KL">Kerala</option>
                  <option value="LA">Ladakh</option>
                  <option value="LD">Lakshadweep</option>
                  <option value="MP">Madhya Pradesh</option>
                  <option value="MH">Maharashtra</option>
                  <option value="MN">Manipur</option>
                  <option value="ML">Meghalaya</option>
                  <option value="MZ">Mizoram</option>
                  <option value="NL">Nagaland</option>
                  <option value="OR">Odisha</option>
                  <option value="PY">Puducherry</option>
                  <option value="PB">Punjab</option>
                  <option value="RJ">Rajasthan</option>
                  <option value="SK">Sikkim</option>
                  <option value="TN">Tamil Nadu</option>
                  <option value="TS">Telangana</option>
                  <option value="TR">Tripura</option>
                  <option value="UP">Uttar Pradesh</option>
                  <option value="UK">Uttarakhand</option>
                  <option value="WB">West Bengal</option>
                </select>
                {errors.hospitalState && <p className="text-red-400 text-xs mt-1">{errors.hospitalState}</p>}
              </div>

              {/* Patient Language */}
              <div className="mb-8">
                <label className="block text-white font-medium mb-2">Patient Language</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="patientLanguage"
                    value={formData.patientLanguage}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-8 py-3 bg-slate-700/50 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 appearance-none cursor-pointer ${
                      errors.patientLanguage ? 'border-red-500' : 'border-slate-600'
                    }`}
                  >
                    <option value="">Select Language</option>
                    <option value="hindi">Hindi</option>
                    <option value="english">English</option>
                    <option value="bengali">Bengali</option>
                    <option value="telugu">Telugu</option>
                    <option value="marathi">Marathi</option>
                    <option value="tamil">Tamil</option>
                    <option value="gujarati">Gujarati</option>
                    <option value="urdu">Urdu</option>
                    <option value="kannada">Kannada</option>
                    <option value="odia">Odia</option>
                    <option value="punjabi">Punjabi</option>
                    <option value="malayalam">Malayalam</option>
                    <option value="assamese">Assamese</option>
                    <option value="maithili">Maithili</option>
                    <option value="santali">Santali</option>
                    <option value="kashmiri">Kashmiri</option>
                    <option value="nepali">Nepali</option>
                    <option value="sindhi">Sindhi</option>
                    <option value="konkani">Konkani</option>
                    <option value="dogri">Dogri</option>
                    <option value="manipuri">Manipuri</option>
                    <option value="bodo">Bodo</option>
                  </select>
                </div>
                {errors.patientLanguage && <p className="text-red-400 text-xs mt-1">{errors.patientLanguage}</p>}
              </div>

              <button
                type="button"
                onClick={handleSaveFormData}
                disabled={!canSubmitForm}
                className={`w-full py-4 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-lg ${
                  !canSubmitForm
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                }`}
              >
                {isSavingForm ? (
                  <div className="flex items-center justify-center">
                    <Upload className="w-5 h-5 mr-2 animate-spin" />
                    Saving Claim Data...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Save Claim Data
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Step 2: File Upload */}
          {currentStep === 'upload' && (
            <div>
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
                <p className="text-green-200">
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Claim data saved successfully! ClaimID: <span className="font-bold">{formData.claimID}</span>
                </p>
                <p className="text-green-200 text-sm mt-1">
                  Now upload your documents to the "{formData.claimID}" folder via API.
                </p>
              </div>

              {/* File Upload */}
              <div className="mb-8">
                <label className="block text-white font-medium mb-2">Upload Files</label>
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-purple-500 transition-all duration-200">
                  <FileText className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">Drag & drop files here or click to browse</p>
                  <p className="text-gray-400 text-sm mb-2">Files will be uploaded to folder: <span className="font-bold text-purple-300">{formData.claimID}</span></p>
                  <p className="text-gray-400 text-sm mb-4">Supported formats: PDF, ZIP (Max 10MB each)</p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.zip"
                    disabled={!canUploadFiles}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`inline-flex items-center px-6 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      canUploadFiles
                        ? 'bg-purple-600 text-white hover:bg-purple-500'
                        : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Browse Files
                  </label>
                </div>
                {errors.files && <p className="text-red-400 text-xs mt-2">{errors.files}</p>}

                {/* Upload status */}
                {isUploading && (
                  <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-xl">
                    <p className="text-blue-200 text-sm">Uploading files via API to folder "{formData.claimID}"...</p>
                  </div>
                )}

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-3">Uploaded Files:</h4>
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-slate-700/50 px-4 py-3 rounded-xl text-white">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                              {uploadedFileNames.includes(file.name) && (
                                <p className="text-xs text-green-400">
                                  <Check className="w-3 h-3 inline mr-1" />
                                  Uploaded to S3/{formData.claimID}/
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-400 hover:text-red-300 transition-colors text-sm px-3 py-1 bg-red-500/20 rounded-lg"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCompleteSubmission}
                disabled={!canCompleteSubmission}
                className={`w-full py-4 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-lg ${
                  !canCompleteSubmission
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                }`}
              >
                {isUploading ? 'Uploading Files...' : 'Complete Claim Submission'}
              </button>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Claim Successfully Created!</h3>
              <p className="text-gray-300 mb-2">Claim ID: <span className="font-bold text-purple-300">{formData.claimID}</span></p>
              <p className="text-gray-400 text-sm">All documents have been uploaded successfully via API.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateClaimForm;