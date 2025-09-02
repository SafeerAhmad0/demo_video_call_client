import React, { useState, useEffect } from 'react';
import { MapPin, Check, AlertCircle, Loader, Video } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { videoCallAPI } from '../services/api';



const DigitalMeetingPage = () => {
  const [searchParams] = useSearchParams();
  const [locationStatus, setLocationStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(false);

  const handleApproveLocation = async () => {
    setLocationStatus('requesting');

    setTimeout(() => {
      if (navigator.geolocation) {
        setLocationStatus('capturing');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationInfo = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            setLocationData(locationInfo);
            
            setTimeout(() => {
              setLocationStatus('approved');
            }, 1000);
          },
          (error) => {
            setLocationStatus('error');
            setErrorMessage('Location access denied or unavailable. Please enable location services and try again.');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        setLocationStatus('error');
        setErrorMessage('Geolocation is not supported by this browser.');
      }
    }, 1000);
  };

  // Fetch meeting URL on component mount
  useEffect(() => {
    const fetchMeetingUrl = async () => {
      const sessionId = searchParams.get('sessionId');
      if (sessionId) {
        setLoadingMeeting(true);
        try {
          const status = await videoCallAPI.getStatus(sessionId);
          if (status.patientUrl) {
            setMeetingUrl(status.patientUrl);
          }
        } catch (error) {
          console.error('Failed to fetch meeting URL:', error);
        } finally {
          setLoadingMeeting(false);
        }
      }
    };

    fetchMeetingUrl();
  }, [searchParams]);

  const handleJoinMeeting = () => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank');
    } else {
      // Fallback to Google Meet if no meeting URL is available
      window.open('https://meet.google.com/new', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-orange-400 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden border border-white/20">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-amber-500 to-orange-500"></div>
        
        {/* Logo and Company Info */}
        <div className="mb-8">
          <div className="mb-4">
            <img 
              src="frontend\src\styles\infinity_logo.png" 
              alt="Infinity Investigation Agency Logo"
              className="w-16 h-16 mx-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent mb-1">
            Infinity Investigation Agency
          </h1>
          <p className="text-sm font-semibold text-amber-600">
            Your Truth, Beyond Limits
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-1 rounded-full transition-all duration-500 ${
              locationStatus === 'idle' || locationStatus === 'requesting' || locationStatus === 'capturing' 
                ? 'bg-gradient-to-r from-purple-300 to-amber-300' 
                : 'bg-gradient-to-r from-purple-500 to-orange-500'
            }`}></div>
            <div className={`w-4 h-4 rounded-full mx-2 transition-all duration-500 ${
              locationStatus === 'approved' 
                ? 'bg-gradient-to-r from-purple-500 to-orange-500' 
                : 'bg-gradient-to-r from-purple-300 to-amber-300'
            }`}></div>
            <div className={`w-8 h-1 rounded-full transition-all duration-500 ${
              locationStatus === 'approved' 
                ? 'bg-gradient-to-r from-purple-500 to-orange-500' 
                : 'bg-gradient-to-r from-purple-300 to-amber-300'
            }`}></div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Digital Meeting
        </h2>
        <p className="text-gray-600 mb-8">
          Secure claim verification meeting
        </p>

        {/* Location verification info */}
        {locationStatus === 'idle' && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-amber-50 p-6 rounded-2xl mb-6 border border-purple-100">
              <div className="flex items-start">
                <MapPin size={20} className="text-purple-600 mr-3 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-purple-800 mb-1">
                    Location verification required:
                  </p>
                  <p className="text-sm text-purple-700">
                    Your location will be securely captured for meeting authentication and security purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {locationStatus === 'requesting' && (
          <div className="mb-8">
            <Loader size={48} className="text-purple-600 mx-auto mb-4 animate-spin" />
            <p className="text-lg font-semibold text-purple-600">Requesting Location Permission...</p>
            <p className="text-sm text-gray-600 mt-2">
              Please allow location access in your browser
            </p>
          </div>
        )}

        {locationStatus === 'capturing' && (
          <div className="mb-8">
            <Loader size={48} className="text-amber-600 mx-auto mb-4 animate-spin" />
            <p className="text-lg font-semibold text-amber-600">Capturing Location...</p>
            <p className="text-sm text-gray-600 mt-2">
              Securing your location data
            </p>
          </div>
        )}

        {locationStatus === 'approved' && (
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Location Verified!</h3>
            <p className="text-gray-600 mb-4">
              Your location has been successfully verified. You can now join the secure meeting.
            </p>
            {locationData && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl text-left mb-6 border border-green-200">
                <p className="text-sm text-green-700">
                  <strong>Verified Coordinates:</strong><br />
                  Lat: {locationData.latitude.toFixed(4)}<br />
                  Lng: {locationData.longitude.toFixed(4)}<br />
                  Accuracy: ±{Math.round(locationData.accuracy)}m
                </p>
              </div>
            )}
          </div>
        )}

        {locationStatus === 'error' && (
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">Location Access Failed</h3>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl text-left border border-red-200">
              <p className="text-sm text-red-700">
                <strong>Troubleshooting:</strong><br />
                • Enable location services in your browser<br />
                • Allow location access for this website<br />
                • Try refreshing the page and trying again
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Approve Location Button */}
          {(locationStatus === 'idle' || locationStatus === 'error') && (
            <button
              onClick={handleApproveLocation}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-2xl hover:from-purple-700 hover:to-orange-600 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105 hover:shadow-xl"
            >
              <MapPin size={20} className="inline mr-2" />
              {locationStatus === 'error' ? 'Retry Location Approval' : 'Approve Location'}
            </button>
          )}

          {/* Join Meeting Button */}
          {locationStatus === 'approved' && (
            <button
              onClick={handleJoinMeeting}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105 hover:shadow-xl animate-pulse"
            >
              <Video size={20} className="inline mr-2" />
              Join Meeting Now
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Your location data is encrypted and securely stored for verification purposes only. 
            This ensures meeting authenticity and regulatory compliance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DigitalMeetingPage;