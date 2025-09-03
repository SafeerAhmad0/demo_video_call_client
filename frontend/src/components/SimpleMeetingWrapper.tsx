import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface SimpleMeetingWrapperProps {
  roomName: string;
  onMeetingEnd?: () => void;
}

const SimpleMeetingWrapper: React.FC<SimpleMeetingWrapperProps> = ({
  roomName,
  onMeetingEnd
}) => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <JitsiMeeting
        domain="meet.jit.si"
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
          displayName: 'Claim Verification User',
          email: 'user@example.com'
        }}
        onApiReady={(externalApi) => {
          console.log('Jitsi Meeting API ready', externalApi);
          externalApi.on('videoConferenceLeft', () => {
            console.log('User left the conference');
            onMeetingEnd?.();
          });
        }}
        getIFrameRef={(iframeRef) => { 
          if (iframeRef) {
            iframeRef.style.height = '100%';
          }
        }}
      />
    </div>
  );
};

export default SimpleMeetingWrapper;
