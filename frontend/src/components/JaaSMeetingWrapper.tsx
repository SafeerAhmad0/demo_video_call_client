import React, { useEffect, useState } from 'react';
import { JaaSMeeting } from '@jitsi/react-sdk';

interface JaaSMeetingWrapperProps {
  roomName: string;
  onMeetingEnd?: () => void;
}

// We'll get the JWT from our JWT server
const getJWT = async (roomName: string) => {
  try {
    const response = await fetch('http://localhost:3001/generate-jwt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomName
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get JWT: ${errorText}`);
    }
    const data = await response.json();
    if (!data.jwt) {
      throw new Error('No JWT returned from server');
    }
    return data.jwt;
  } catch (error) {
    console.error('Error getting JWT:', error);
    alert('Failed to get JWT token. Please try again.');
    return null;
  }
}

const JaaSMeetingWrapper: React.FC<JaaSMeetingWrapperProps> = ({
  roomName,
  onMeetingEnd
}) => {
  const appId = '8187'; // Your JaaS App ID
  const [jwt, setJwt] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchJWT = async () => {
      const token = await getJWT(roomName);
      setJwt(token);
    };
    fetchJWT();
  }, [roomName]);

  if (!jwt) {
    return <div className="w-full h-screen flex items-center justify-center">Loading meeting...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <JaaSMeeting
        appId={appId}
        jwt={jwt || undefined}
        roomName={roomName}
        getIFrameRef={(iframeRef) => {
          if (iframeRef) {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
            iframeRef.style.position = 'absolute';
            iframeRef.style.top = '0';
            iframeRef.style.left = '0';
          }
        }}
        onApiReady={(externalApi) => {
          externalApi.on('videoConferenceLeft', () => {
            console.log('User left the conference');
            onMeetingEnd?.();
          });
        }}
        configOverwrite={{
          startWithAudioMuted: true,
          disableModeratorIndicator: true,
          startScreenSharing: true,
          enableEmailInStats: false
        }}
        userInfo={{
          displayName: 'Claims Verification User',
          email: 'claims@verifycall.com'
        }}
      />
    </div>
  );

  if (!jwt) {
    return <div>Loading meeting...</div>;
  }

  return (
    <div style={{ height: "100vh", width: "100%", overflow: "hidden" }}>
      <JaaSMeeting
        appId={appId}
        jwt={jwt}
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: true,
          disableModeratorIndicator: true,
          startScreenSharing: true,
          enableEmailInStats: false
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          VIDEO_LAYOUT_FIT: 'nocrop',
          MOBILE_APP_PROMO: false,
          TILE_VIEW_MAX_COLUMNS: 4
        }}
        userInfo={{
          displayName: 'Claims Verification User'
        }}
        onApiReady={(externalApi) => {
          console.log('JaaS Meeting API ready');
          externalApi.on('videoConferenceLeft', () => {
            console.log('User left the conference');
            onMeetingEnd?.();
          });
        }}
        getIFrameRef={(iframeRef) => {
          if (iframeRef) {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }
        }}
      />
    </div>
  );

  useEffect(() => {
    // Add full height styles to html and body
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    
    return () => {
      // Cleanup styles when component unmounts
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.style.margin = '';
    };
  }, []);

  const containerStyle = {
    height: '100%',
    width: '100%',
    display: 'block',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  const SpinnerView = () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading meeting...</p>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%' }}>
      {appId && jwt && (
        <JaaSMeeting
          appId={appId}
          roomName={roomName}
          jwt={jwt}
          configOverwrite={{
            disableLocalVideoFlip: true,
            backgroundAlpha: 0.5
          }}
          interfaceConfigOverwrite={{
            VIDEO_LAYOUT_FIT: 'nocrop',
            MOBILE_APP_PROMO: false,
            TILE_VIEW_MAX_COLUMNS: 4
          }}
        //   spinner={SpinnerView}
          onApiReady={(externalApi: any) => {
            console.log('JaaS Meeting API ready', externalApi);
            externalApi.on('videoConferenceLeft', () => {
              console.log('User left the conference');
              onMeetingEnd?.();
            });
          }}
        />
      )}
    </div>
  );
};

export default JaaSMeetingWrapper;
