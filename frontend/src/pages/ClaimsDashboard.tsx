import React, { useState, useEffect } from 'react';
import { Plus, FileText, Upload, X, Eye, Clock, MapPin, Phone, Building, Globe, ChevronRight } from 'lucide-react';

interface Claim {
  id: number;
  claimNumber: string;
  patientMobile: string;
  hospitalCity: string;
  hospitalState: string;
  language: string;
  status: string;
  createdAt: string;
  documents: string[]; // This will store file names after submission
}

interface ClaimFormData {
  claimNumber: string;
  patientMobile: string;
  hospitalCity: string;
  hospitalState: string;
  language: string;
  documents: File[]; // This will store File objects before submission
}

const ClaimsDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([
    {
      id: 1,
      claimNumber: "CLM-2024-001",
      patientMobile: "+1-234-567-8901",
      hospitalCity: "New York",
      hospitalState: "NY",
      language: "English",
      status: "open",
      createdAt: "2024-08-15",
      documents: ["medical_report.pdf", "prescription.pdf"]
    },
    {
      id: 2,
      claimNumber: "CLM-2024-002",
      patientMobile: "+1-234-567-8902",
      hospitalCity: "Los Angeles",
      hospitalState: "CA",
      language: "Spanish",
      status: "open",
      createdAt: "2024-08-16",
      documents: ["diagnosis.pdf"]
    },
    {
      id: 3,
      claimNumber: "CLM-2024-003",
      patientMobile: "+1-234-567-8903",
      hospitalCity: "Chicago",
      hospitalState: "IL",
      language: "English",
      status: "open",
      createdAt: "2024-08-17",
      documents: ["lab_results.zip", "xray.pdf"]
    }
  ]);
  
  const [formData, setFormData] = useState<ClaimFormData>({
    claimNumber: '',
    patientMobile: '',
    hospitalCity: '',
    hospitalState: '',
    language: '',
    documents: []
  });
  
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (files: FileList) => {
    const validFiles = Array.from(files).filter((file: File) => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type === 'application/zip' || 
                         file.name.endsWith('.zip');
      return isValidType;
    });
    
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...validFiles]
    }));
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.claimNumber || !formData.patientMobile || !formData.hospitalCity || 
        !formData.hospitalState || !formData.language) {
      alert('Please fill in all required fields');
      return;
    }
    
    const newClaim: Claim = {
      id: claims.length + 1,
      ...formData,
      status: 'open',
      createdAt: new Date().toISOString().split('T')[0],
      documents: formData.documents.map(file => file.name)
    };
    
    setClaims(prev => [newClaim, ...prev]);
    setFormData({
      claimNumber: '',
      patientMobile: '',
      hospitalCity: '',
      hospitalState: '',
      language: '',
      documents: []
    });
    setShowCreateModal(false);
  };

  const handleClaimClick = (claim: Claim) => {
    // In a real app, this would navigate to the claim details page
    console.log('Navigating to claim:', claim.claimNumber);
    // window.location.href = `/claims/${claim.id}`;
  };

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 
    'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean'
  ];

  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      {/* Header */}
      <div className="bg-black bg-opacity-20 backdrop-blur-sm border-b border-purple-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ClaimVerify</h1>
                <p className="text-purple-200 text-sm">Secure Claims Verification Platform</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Claim</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Open Claims</h2>
          <p className="text-purple-200">Manage and track your verification claims</p>
        </div>

        {/* Claims Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {claims.map((claim) => (
            <div
              key={claim.id}
              onClick={() => handleClaimClick(claim)}
              className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 hover:bg-opacity-15 transition-all duration-300 cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-300" />
                  </div>
                  <span className="text-purple-200 text-sm font-medium">
                    {claim.status === 'open' && 'Open'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-purple-300" />
                  <span className="text-purple-300 text-sm">{claim.createdAt}</span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-200 transition-colors">
                {claim.claimNumber}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-purple-200">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{claim.patientMobile}</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-200">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{claim.hospitalCity}, {claim.hospitalState}</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-200">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">{claim.language}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4 text-purple-300" />
                  <span className="text-purple-300 text-sm">
                    {claim.documents.length} document{claim.documents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {claims.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Claims Found</h3>
            <p className="text-purple-200 mb-6">Create your first claim to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Create New Claim
            </button>
          </div>
        )}
      </div>

      {/* Create Claim Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 w-full max-w-2xl border border-purple-500/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Create New Claim</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Claim Number *
                  </label>
                  <input
                    type="text"
                    name="claimNumber"
                    value={formData.claimNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:bg-opacity-15 transition-all"
                    placeholder="CLM-2024-XXX"
                  />
                </div>

                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Patient Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="patientMobile"
                    value={formData.patientMobile}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:bg-opacity-15 transition-all"
                    placeholder="+1-234-567-8900"
                  />
                </div>

                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Hospital City *
                  </label>
                  <input
                    type="text"
                    name="hospitalCity"
                    value={formData.hospitalCity}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:bg-opacity-15 transition-all"
                    placeholder="Enter city name"
                  />
                </div>

                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Hospital State *
                  </label>
                  <select
                    name="hospitalState"
                    value={formData.hospitalState}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:bg-opacity-15 transition-all"
                  >
                    <option value="" className="bg-purple-900">Select State</option>
                    {usStates.map(state => (
                      <option key={state} value={state} className="bg-purple-900">{state}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Language *
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:bg-opacity-15 transition-all"
                  >
                    <option value="" className="bg-purple-900">Select Language</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang} className="bg-purple-900">{lang}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Medical Documents (PDF or ZIP files)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                    dragActive 
                      ? 'border-purple-400 bg-purple-500/20' 
                      : 'border-purple-500/30 bg-white bg-opacity-5'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <Upload className="h-10 w-10 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-200 mb-2">
                      Drop your files here, or{' '}
                      <label className="text-purple-400 hover:text-purple-300 cursor-pointer underline">
                        browse
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.zip"
                          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-purple-300 text-sm">Support PDF and ZIP files</p>
                  </div>
                </div>

                {/* Uploaded Files */}
                {formData.documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-purple-200 text-sm font-medium">Uploaded Files:</h4>
                    {formData.documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white bg-opacity-5 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-purple-400" />
                          <span className="text-purple-200 text-sm">{file.name}</span>
                          <span className="text-purple-300 text-xs">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-purple-400 hover:text-red-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-purple-500/50 text-purple-200 rounded-lg hover:bg-white hover:bg-opacity-5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Create Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimsDashboard;