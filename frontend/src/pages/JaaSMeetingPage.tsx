import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import JaaSMeetingWrapper from '../components/JaaSMeetingWrapper';

export default function JaaSMeetingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomName = searchParams.get('roomName') || `meeting-${Date.now()}`;

  const handleMeetingEnd = () => {
    navigate('/dashboard');
  };

  return (
    <div className="h-screen w-full bg-gray-100">
      <JaaSMeetingWrapper
        roomName={roomName}
        onMeetingEnd={handleMeetingEnd}
      />
    </div>
  );
}
