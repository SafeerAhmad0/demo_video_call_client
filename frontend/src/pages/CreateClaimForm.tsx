import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, FileText, Phone, MapPin, Globe } from 'lucide-react';

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

  useEffect(() => {
    // Generate random claim ID on mount
    setFormData(prev => ({
      ...prev,
      claimID: `CLM-${Math.floor(100000 + Math.random() * 900000)}`
    }));
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): ClaimFormErrors => {
    const newErrors: ClaimFormErrors = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }

    if (!formData.patientMobile.trim()) {
      newErrors.patientMobile = 'Patient mobile number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.patientMobile)) {
      newErrors.patientMobile = 'Please enter a valid mobile number';
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

    if (uploadedFiles.length === 0) {
      newErrors.files = 'At least one file must be uploaded';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const formDataToSubmit = new FormData();

      // Append form fields
      for (const [key, value] of Object.entries(formData)) {
        formDataToSubmit.append(key, value);
      }

      // Append files
      uploadedFiles.forEach((file, index) => {
        formDataToSubmit.append(`file_${index}`, file);
      });

      const response = await fetch('/api/claims', {
        method: 'POST',
        body: formDataToSubmit,
      });

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Claim created successfully!' });

        // Reset form
        setTimeout(() => {
          setSubmitStatus(null);
          setUploadedFiles([]);
          setErrors({});
          setFormData({
            claimID: `CLM-${Math.floor(100000 + Math.random() * 900000)}`,
            patientName: '',
            patientMobile: '',
            hospitalCity: '',
            hospitalState: '',
            patientLanguage: '',
          });
        }, 3000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: 'Failed to create claim. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Something went wrong. Please try again later.',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-8 shadow-2xl">
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

          {/* Claim ID (readonly) */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Claim ID</label>
            <input
              name="claimID"
              value={formData.claimID}
              readOnly
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-gray-400 cursor-not-allowed"
            />
            <p className="text-gray-400 text-xs mt-1">Automatically generated claim ID</p>
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
                placeholder="+1-555-0123"
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
              <option value="">Select State</option>
              <option value="AL">Alabama</option>
              <option value="AK">Alaska</option>
              <option value="AZ">Arizona</option>
              <option value="AR">Arkansas</option>
              <option value="CA">California</option>
              <option value="CO">Colorado</option>
              <option value="CT">Connecticut</option>
              <option value="DE">Delaware</option>
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="HI">Hawaii</option>
              <option value="ID">Idaho</option>
              <option value="IL">Illinois</option>
              <option value="IN">Indiana</option>
              <option value="IA">Iowa</option>
              <option value="KS">Kansas</option>
              <option value="KY">Kentucky</option>
              <option value="LA">Louisiana</option>
              <option value="ME">Maine</option>
              <option value="MD">Maryland</option>
              <option value="MA">Massachusetts</option>
              <option value="MI">Michigan</option>
              <option value="MN">Minnesota</option>
              <option value="MS">Mississippi</option>
              <option value="MO">Missouri</option>
              <option value="MT">Montana</option>
              <option value="NE">Nebraska</option>
              <option value="NV">Nevada</option>
              <option value="NH">New Hampshire</option>
              <option value="NJ">New Jersey</option>
              <option value="NM">New Mexico</option>
              <option value="NY">New York</option>
              <option value="NC">North Carolina</option>
              <option value="ND">North Dakota</option>
              <option value="OH">Ohio</option>
              <option value="OK">Oklahoma</option>
              <option value="OR">Oregon</option>
              <option value="PA">Pennsylvania</option>
              <option value="RI">Rhode Island</option>
              <option value="SC">South Carolina</option>
              <option value="SD">South Dakota</option>
              <option value="TN">Tennessee</option>
              <option value="TX">Texas</option>
              <option value="UT">Utah</option>
              <option value="VT">Vermont</option>
              <option value="VA">Virginia</option>
              <option value="WA">Washington</option>
              <option value="WV">West Virginia</option>
              <option value="WI">Wisconsin</option>
              <option value="WY">Wyoming</option>
            </select>
            {errors.hospitalState && <p className="text-red-400 text-xs mt-1">{errors.hospitalState}</p>}
          </div>

          {/* Patient Language */}
          <div className="mb-6">
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
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="chinese">Chinese</option>
                <option value="hindi">Hindi</option>
                <option value="arabic">Arabic</option>
                <option value="portuguese">Portuguese</option>
                <option value="russian">Russian</option>
                <option value="japanese">Japanese</option>
              </select>
            </div>
            {errors.patientLanguage && <p className="text-red-400 text-xs mt-1">{errors.patientLanguage}</p>}
          </div>

          {/* File Upload */}
          <div className="mb-8">
            <label className="block text-white font-medium mb-2">Upload Files</label>
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-purple-500 transition-all duration-200">
              <FileText className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">Drag & drop files here or click to browse</p>
              <p className="text-gray-400 text-sm mb-4">Supported formats: PDF, ZIP (Max 10MB each)</p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.zip"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-all duration-200 cursor-pointer"
              >
                <FileText className="w-5 h-5 mr-2" />
                Browse Files
              </label>
            </div>
            {errors.files && <p className="text-red-400 text-xs mt-2">{errors.files}</p>}

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
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
          >
            Submit Claim
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateClaimForm;
