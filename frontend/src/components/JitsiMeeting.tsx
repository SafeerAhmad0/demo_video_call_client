import React, { useEffect, useRef, useState } from 'react';

interface JitsiMeetingProps {
  domain: string;
  roomName: string;
  jwt?: string;
  configOverwrite?: any;
  interfaceConfigOverwrite?: any;
  getIFrameRef?: (iframeRef: HTMLIFrameElement) => void;
  onApiReady?: (api: any) => void;
  onReadyToClose?: () => void;
  width?: string | number;
  height?: string | number;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const JitsiMeeting: React.FC<JitsiMeetingProps> = ({
  domain,
  roomName,
  jwt,
  configOverwrite = {},
  interfaceConfigOverwrite = {},
  getIFrameRef,
  onApiReady,
  onReadyToClose,
  width = '100%',
  height = '100%',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = `https://${domain}/external_api.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadJitsiScript();

        if (!containerRef.current) {
          throw new Error('Container ref not available');
        }

        const options = {
          roomName,
          width,
          height,
          parentNode: containerRef.current,
          jwt,
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            ...configOverwrite,
          },
          interfaceConfigOverwrite: {
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
          },
        };

        const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
        setApi(jitsiApi);

        // Get iframe reference
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe && getIFrameRef) {
          getIFrameRef(iframe);
        }

        // Set up event listeners
        jitsiApi.addEventListener('videoConferenceJoined', () => {
          console.log('User joined the conference');
          setIsLoading(false);
        });

        jitsiApi.addEventListener('videoConferenceLeft', () => {
          console.log('User left the conference');
          if (onReadyToClose) {
            onReadyToClose();
          }
        });

        jitsiApi.addEventListener('readyToClose', () => {
          console.log('Ready to close');
          if (onReadyToClose) {
            onReadyToClose();
          }
        });

        if (onApiReady) {
          onApiReady(jitsiApi);
        }

      } catch (err) {
        console.error('Error initializing Jitsi:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Jitsi Meet');
        setIsLoading(false);
      }
    };

    initializeJitsi();

    // Cleanup function
    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [api, configOverwrite, domain, getIFrameRef, height, interfaceConfigOverwrite, jwt, onApiReady, onReadyToClose, roomName, width]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Failed to Load Video Conference
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video conference...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      className="jitsi-meeting-container"
    />
  );
};

export default JitsiMeeting;
