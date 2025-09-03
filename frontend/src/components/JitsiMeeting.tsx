import React from 'react';
import { JitsiMeeting as JitsiSDK } from '@jitsi/react-sdk';

export interface JitsiMeetingProps {
  domain: string;
  roomName: string;
  jwt?: string;
  appId?: string;
  configOverwrite?: {
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    enableWelcomePage?: boolean;
    prejoinPageEnabled?: boolean;
  };
  interfaceConfigOverwrite?: {
    TOOLBAR_BUTTONS?: string[];
    DISABLE_JOIN_LEAVE_NOTIFICATIONS?: boolean;
    VIDEO_LAYOUT_FIT?: string;
    MOBILE_APP_PROMO?: boolean;
    TILE_VIEW_MAX_COLUMNS?: number;
  };
  userInfo?: {
    displayName: string;
    email?: string;
  };
  getIFrameRef?: (iframeRef: HTMLElement) => void;
  onApiReady?: (api: any) => void;
  onReadyToClose?: () => void;
}

const JitsiMeeting: React.FC<JitsiMeetingProps> = ({
  domain,
  roomName,
  jwt,
  appId,
  configOverwrite = {},
  interfaceConfigOverwrite = {},
  userInfo,
  getIFrameRef,
  onApiReady,
  onReadyToClose
}) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <JitsiSDK
        domain={domain}
        roomName={domain === '8x8.vc' && appId ? `${appId}/${roomName}` : roomName}
        jwt={jwt}
        configOverwrite={{
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          ...configOverwrite,
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
            'livestreaming',
            'etherpad',
            'sharedvideo',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'invite',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'videobackgroundblur',
            'download',
            'help',
            'mute-everyone',
            'security'
          ],
          ...interfaceConfigOverwrite,
        }}
        userInfo={userInfo && {
          displayName: userInfo.displayName,
          email: userInfo.email || ''
        }}
        onApiReady={(api) => {
          onApiReady?.(api);
          const iframe = api.getIFrame();
          if (iframe) {
            getIFrameRef?.(iframe);
          }
        }}
        onReadyToClose={onReadyToClose}
      />
    </div>
  );
};

export default JitsiMeeting;
