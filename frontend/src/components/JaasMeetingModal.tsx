import React from 'react';

interface JaasMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  setRoomName: (name: string) => void;
  onSubmit: () => void;
}

const JaasMeetingModal: React.FC<JaasMeetingModalProps> = ({
  isOpen,
  onClose,
  roomName,
  setRoomName,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="jaas-join-meeting-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6">
        <h3 id="jaas-join-meeting-title" className="text-xl font-bold text-white mb-1">Join JaaS Meeting</h3>
        <p className="text-sm text-slate-300 mb-5">Enter a JaaS room name to join.</p>

        <label className="block text-sm text-slate-300 mb-2">Room name</label>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(); } }}
          autoFocus
          placeholder="e.g. verifycall-demo"
          className="w-full px-4 py-3 bg-slate-700/60 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700/60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 transition-colors"
          >
            Join Meeting
          </button>
        </div>
      </div>
    </div>
  );
};

export default JaasMeetingModal;
