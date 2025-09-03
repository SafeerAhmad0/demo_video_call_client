import React from 'react';
import { useParams } from 'react-router-dom';
import JaaSMeetingWrapper from '../components/JaaSMeetingWrapper';

const JaaSMeetingOnly: React.FC = () => {
  const { roomName } = useParams<{ roomName: string }>();

  return (
    <div className="min-h-screen">
      <JaaSMeetingWrapper
        roomName={roomName || `meeting-${Date.now()}`}
        onMeetingEnd={() => window.close()}
      />
    </div>
  );
};

export default JaaSMeetingOnly;
