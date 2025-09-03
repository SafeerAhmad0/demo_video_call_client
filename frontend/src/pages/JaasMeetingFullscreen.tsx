import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import JaaSMeetingWrapper from "../components/JaaSMeetingWrapper";

const JaasMeetingFullscreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomName = searchParams.get("roomName") || `meeting-${Date.now()}`;

  const handleMeetingEnd = () => {
    navigate("/dashboard");
  };

  return (
    <div style={{ height: `100%` }}>
      <JaaSMeetingWrapper roomName={roomName} onMeetingEnd={handleMeetingEnd} />
    </div>
  );
};

export default JaasMeetingFullscreen;
