import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, VideoOff, Mic, MicOff, Phone, Users, FileText, Download, Shield, MapPin } from 'lucide-react';

interface Screenshot {
  id: number;
  timestamp: string;
  filename: string;
  description: string;
  s3Url: string;
}

interface LocationData {
  id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  claimId: string;
  description: string;
  s3Url: string;
}

interface Recording {
  id: number;
  startTime: string;
  claimId: string;
  filename: string;
  status: 'Recording' | 'Completed';
  endTime?: string;
  s3Url?: string;
}

const VideoVerification = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const claimDetails = {
    id: 'CLM-2025-8847',
    type: 'Pre-Authorization Review',
    patient: 'John Smith',
    procedure: 'MRI Knee Joint',
    status: 'Under Review'
  };

  // Simulated Daily.co integration
  useEffect(() => {
    if (isCallActive) {
      // Simulate participants joining
    }
  }, [isCallActive]);

  const joinCall = async () => {
    setIsCallActive(true);
    // Simulate Daily.co call join
    console.log('Joining Daily.co room for health verification...');
  };

  const leaveCall = () => {
    setIsCallActive(false);
    setIsRecording(false);
    console.log('Left Daily.co room');
  };

  const takeScreenshot = async () => {
    const timestamp = new Date().toISOString();
    const screenshot = {
      id: Date.now(),
      timestamp,
      filename: `screenshot_${claimDetails.id}_${Date.now()}.jpg`,
      description: 'Medical document verification',
      s3Url: `https://health-insurance-bucket.s3.amazonaws.com/screenshots/screenshot_${Date.now()}.jpg`
    };
    
    setScreenshots(prev => [...prev, screenshot]);
    
    // Simulate API call to store in S3
    console.log('Screenshot saved to S3:', screenshot);
  };

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const timestamp = new Date().toISOString();
        const locationData = {
          id: Date.now(),
          timestamp,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          claimId: claimDetails.id,
          description: 'Patient location verification',
          s3Url: `https://health-insurance-bucket.s3.amazonaws.com/locations/location_${Date.now()}.json`
        };
        
        setLocations(prev => [...prev, locationData]);
        
        // Simulate API call to store in S3
        console.log('Location data saved to S3:', locationData);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location. Please ensure location services are enabled.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const startRecording = () => {
    setIsRecording(true);
    const recording = {
      id: Date.now(),
      startTime: new Date().toISOString(),
      claimId: claimDetails.id,
      filename: `recording_${claimDetails.id}_${Date.now()}.mp4`,
      status: 'Recording' as 'Recording'
    };
    
    setRecordings(prev => [...prev, recording]);
    console.log('Started recording to S3:', recording);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordings(prev => prev.map(rec => 
      rec.status === 'Recording' 
        ? { ...rec, endTime: new Date().toISOString(), status: 'Completed', s3Url: `https://health-insurance-bucket.s3.amazonaws.com/recordings/${rec.filename}` }
        : rec
    ));
    console.log('Recording stopped and saved to S3');
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Shield className="text-blue-600" size={32} />
                Health Insurance Verification System
              </h1>
              <p className="text-gray-600 mt-2">Secure video verification powered by Daily.co</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Claim ID: {claimDetails.id}</p>
              <p className="font-semibold text-gray-800">{claimDetails.type}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Call Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Video Verification Session</h2>
                <p className="text-sm text-gray-600">Patient: {claimDetails.patient} | Procedure: {claimDetails.procedure}</p>
              </div>
              
              <div className="relative h-96 bg-gray-900">
                {isCallActive ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
                      <div className="bg-gray-800 rounded-lg flex items-center justify-center relative">
                        <div className="text-white text-center">
                          <Users size={48} className="mx-auto mb-2" />
                          <p>Dr. Sarah Johnson</p>
                          <p className="text-sm text-gray-300">Medical Reviewer</p>
                        </div>
                      </div>
                      <div className="bg-gray-700 rounded-lg flex items-center justify-center relative">
                        <div className="text-white text-center">
                          <Users size={48} className="mx-auto mb-2" />
                          <p>John Smith</p>
                          <p className="text-sm text-gray-300">Patient</p>
                          {isVideoOff && <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
                            <VideoOff className="text-white" size={32} />
                          </div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video size={64} className="mx-auto mb-4" />
                      <h3 className="text-xl font-semibold">Ready to start verification</h3>
                      <p className="text-gray-300">Click "Join Call" to begin the session</p>
                    </div>
                  </div>
                )}
                
                {isRecording && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Recording
                  </div>
                )}
              </div>

              {/* Call Controls */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex justify-center space-x-4">
                  {!isCallActive ? (
                    <button
                      onClick={joinCall}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Phone size={20} />
                      Join Call
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={toggleMute}
                        className={`p-3 rounded-full transition-colors ${
                          isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                        } text-white`}
                      >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                      
                      <button
                        onClick={toggleVideo}
                        className={`p-3 rounded-full transition-colors ${
                          isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                        } text-white`}
                      >
                        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                      </button>
                      
                      <button
                        onClick={takeScreenshot}
                        className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        title="Take Screenshot"
                      >
                        <Camera size={20} />
                      </button>
                      
                      <button
                        onClick={captureLocation}
                        className="p-3 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors"
                        title="Capture Location"
                      >
                        <MapPin size={20} />
                      </button>
                      
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-full transition-colors ${
                          isRecording 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-purple-600 hover:bg-purple-700'
                        } text-white`}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                      >
                        <div className={`w-5 h-5 ${isRecording ? 'bg-white' : 'bg-white rounded-full'}`} />
                      </button>
                      
                      <button
                        onClick={leaveCall}
                        className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        <Phone className="transform rotate-135" size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Claim Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Claim Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-orange-600">{claimDetails.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span>{claimDetails.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient:</span>
                  <span>{claimDetails.patient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Procedure:</span>
                  <span>{claimDetails.procedure}</span>
                </div>
              </div>
            </div>

            {/* Screenshots */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Screenshots ({screenshots.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {screenshots.length === 0 ? (
                  <p className="text-gray-500 text-sm">No screenshots taken yet</p>
                ) : (
                  screenshots.map((screenshot) => (
                    <div key={screenshot.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{screenshot.filename}</p>
                        <p className="text-xs text-gray-500">{new Date(screenshot.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700">
                        <Download size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Locations */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Locations ({locations.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {locations.length === 0 ? (
                  <p className="text-gray-500 text-sm">No location data captured yet</p>
                ) : (
                  locations.map((location) => (
                    <div key={location.id} className="p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(location.timestamp).toLocaleTimeString()} | 
                            Accuracy: ±{Math.round(location.accuracy)}m
                          </p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700">
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recordings */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recordings ({recordings.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recordings.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recordings yet</p>
                ) : (
                  recordings.map((recording) => (
                    <div key={recording.id} className="p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{recording.filename}</p>
                          <p className="text-xs text-gray-500">
                            {recording.status} | Started: {new Date(recording.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            recording.status === 'Recording' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {recording.status}
                          </span>
                          {recording.status === 'Completed' && (
                            <button className="text-blue-600 hover:text-blue-700">
                              <Download size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoVerification;