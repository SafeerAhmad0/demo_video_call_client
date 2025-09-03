import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import JitsiMeeting from "../components/JitsiMeeting";
import { videoCallAPI } from "../services/api";
import { jitsiAPI } from "../services/jitsi";
import { useAuth } from "../contexts/AuthContext";

export default function Meeting() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);

  const sessionId = searchParams.get('sessionId');
  const roomName = searchParams.get('roomName') || "default-room";
  const meetingUrl = searchParams.get('meetingUrl'); // full URL flow (e.g., moderated link)

  // Helper function to decode JWT token
  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch (e) {
      console.error('Error decoding JWT:', e);
      return null;
    }
  };

  useEffect(() => {
    async function initializeMeeting() {
      try {
        const useJwt = searchParams.get('useJwt') === 'true';

        if (useJwt) {
          const displayName = user?.email || 'Moderator';
          const data = await jitsiAPI.getToken({
            room: roomName,
            user_name: displayName,
            is_moderator: true
          });

          if (data.token) {
            setJwtToken(data.token);
            setAppId(data.appId);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error initializing meeting:', err);
        setError('Failed to initialize meeting. Please try again.');
        setLoading(false);
      }
    }

    initializeMeeting();
  }, [roomName, user?.email, searchParams]);

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

  if (meetingUrl) {
    // If we have a full meeting URL, just render it in an iframe
    return (
      <div style={{ height: "100vh", width: "100%" }}>
        <iframe
          src={meetingUrl}
          allow="camera; microphone; display-capture"
          style={{
            height: "100%",
            width: "100%",
            border: "none"
          }}
          title="Jitsi Meeting"
        />
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {jwtToken ? (
        <JitsiMeeting
          domain="8x8.vc"
          roomName={appId ? `${appId}/${roomName}` : roomName}
          jwt={jwtToken}
          onApiReady={(api) => {
            console.log('Jitsi API ready', api);
          }}
          getIFrameRef={(iframeRef) => {
            if (iframeRef) {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
            }
          }}
          configOverwrite={{
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            enableWelcomePage: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          }}
          userInfo={{
            displayName: user?.email || 'Agent',
          }}
          onReadyToClose={handleMeetingEnd}
        />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading meeting...</p>
          </div>
        </div>
      )}
    </div>
  );
}
