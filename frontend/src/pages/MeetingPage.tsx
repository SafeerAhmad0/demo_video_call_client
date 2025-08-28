import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import JitsiMeeting from "../components/JitsiMeeting";
import { videoCallAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function Meeting() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const sessionId = searchParams.get('sessionId');
  const roomName = searchParams.get('roomName') || "default-room";
  const jwtToken = searchParams.get('jwt');

  useEffect(() => {
    async function initializeMeeting() {
      try {
        if (!sessionId) {
          throw new Error('Session ID is required');
        }

        if (!user) {
          throw new Error('User not authenticated');
        }

        // If JWT token is provided in URL, use it directly
        if (jwtToken) {
          setToken(jwtToken);
          setLoading(false);
          return;
        }

        // If no JWT token in URL, try to get meeting status to see if we can get the token
        try {
          const meetingStatus = await videoCallAPI.getStatus(sessionId);
          // For now, we'll just set a default token if none is provided
          // In a real implementation, you might want to handle this differently
          setToken(null); // No token available, Jitsi will work without it
          setLoading(false);
        } catch (statusError) {
          console.error('Error getting meeting status:', statusError);
          setToken(null); // Fallback to no token
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing meeting:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize meeting');
        setLoading(false);
      }
    }

    initializeMeeting();
  }, [sessionId, roomName, user, jwtToken]);

  const handleMeetingEnd = async () => {
    try {
      if (sessionId) {
        // Update video call status to completed
        await videoCallAPI.updateStatus(sessionId, 'completed');
      }
      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error ending meeting:', err);
      // Still navigate back even if status update fails
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading video conference...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Failed to Load Meeting
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Remove the conditional render that might prevent JitsiMeeting from mounting properly
  // JitsiMeeting can work without a token

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        jwt={token || undefined}
        configOverwrite={{ 
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'profile',
            'chat',
            'recording',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'stats',
            'shortcuts',
            'tileview',
            'help',
          ],
        }}
        onReadyToClose={handleMeetingEnd}
        getIFrameRef={(iframeRef) => {
          if (iframeRef) {
            iframeRef.style.height = "100%";
            iframeRef.style.width = "100%";
          }
        }}
      />
    </div>
  );
}
