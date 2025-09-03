import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { claimsAPI, videoCallAPI } from '../services/api';
import { 
  Video, 
  Plus, 
  Eye, 
  LogOut, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Search,
  Filter,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Link,
  VideoIcon
} from 'lucide-react';
import JaasMeetingModal from '../components/JaasMeetingModal';
import JaaSMeetingWrapper from '../components/JaaSMeetingWrapper';
import SimpleMeetingWrapper from '../components/SimpleMeetingWrapper';

// Interface for c      {/* JaaS Meeting Wrapper */}
      {showJaaSMeeting && (
        <div className="fixed inset-0 z-50 h-screen w-screen overflow-hidden">
          <JaaSMeetingWrapper
            roomName={`meeting-${Date.now()}`}
            onMeetingEnd={() => setShowJaaSMeeting(false)}
          />
        </div>
      )} - matches the API response
          <JaaSMeetingWrapper
            roomName={`meeting-${Date.now()}`}
      //       onMeetingEnd={() => setShowJaaSMeeting(false)}
      //     />
      //   </div>
      // )} 
interface Claim {
  id: number;
  claim_number: string;
  patient_mobile: string;
  hospital_city: string;
  hospital_state: string;
  language: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Join meeting modal state
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinRoomName, setJoinRoomName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showJaaSMeeting, setShowJaaSMeeting] = useState(false);
  const [showSimpleMeeting, setShowSimpleMeeting] = useState(false);
  const [jaasRoomName, setJaasRoomName] = useState('');
  const [isJaaSModalOpen, setIsJaaSModalOpen] = useState(false);

  // Close on Escape when any modal open
  useEffect(() => {
    if (!isJoinModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsJoinModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isJoinModalOpen]);

  // Fetch claims from the backend
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const fetchedClaims = await claimsAPI.getAll();
      setClaims(fetchedClaims);
      setFilteredClaims(fetchedClaims);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load claims on component mount
  useEffect(() => {
    fetchClaims();
  }, []);

  // Refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClaims();
    setRefreshing(false);
  };



  // Filter claims based on search term, status, and date range
  useEffect(() => {
    let filtered = claims;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(claim =>
        claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.patient_mobile.includes(searchTerm) ||
        claim.hospital_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.hospital_state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === statusFilter);
    }

    // Apply date range filter
    if (startDate && endDate) {
      filtered = filtered.filter(claim => {
        const claimDate = new Date(claim.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        return claimDate >= start && claimDate <= end;
      });
    }

    setFilteredClaims(filtered);
  }, [claims, searchTerm, statusFilter, startDate, endDate]);

  const handleGenerateMeetingLink = async (claim: Claim) => {
    try {
      // Create video call session and send SMS
      const response = await videoCallAPI.create({
        claimId: claim.claim_number,
        patientName: `Patient ${claim.claim_number}`,
        procedure: 'Medical Verification'
      });

      if (response.success) {
        alert(`Meeting created successfully! SMS ${response.smsSent ? 'sent' : 'not sent'} to patient.`);
        console.log('Meeting details:', response);
      } else {
        alert('Failed to create meeting. Please try again.');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please check the console for details.');
    }
  };

  const handleStartVideoCall = async (claim: Claim) => {
    try {
      // Create video call session first
      const response = await videoCallAPI.create({
        claimId: claim.claim_number,
        patientName: `Patient ${claim.claim_number}`,
        procedure: 'Medical Verification'
      });

      if (response.success) {
        // Navigate to meeting page with session ID and room name (no JWT token needed)
        navigate(`/meeting?sessionId=${response.sessionId}&roomName=${response.roomName}`);
      } else {
        alert('Failed to start video call. Please try again.');
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call. Please check the console for details.');
    }
  };

const handleLogout = async () => {
    await logout();
    navigate('/homepage');
  };

  const handleCreateNewClaim = () => {
    navigate('/create-claim');
  };

  const handleDetailedDashboard = () => {
    alert('Detailed Dashboard clicked');
  };

  // Add the JaaS meeting button to the header section
  const handleCreateMeeting123 = () => {
    setShowJaaSMeeting(true);
  };

  const handleMeetingEnd = () => {
    setShowJaaSMeeting(false);
  };

  // Jitsi: helper to create a random room name
  const generateRoomName = () => {
    const rnd = Math.random().toString(36).substring(2, 8);
    return `verifycall-${rnd}`;
  };

  // Open Jitsi React SDK docs
  const handleOpenJitsiDocs = () => {
    window.open('https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-react-sdk', '_blank', 'noopener,noreferrer');
  };

  // Create a quick meeting (no JAAS/JWT). Uses meet.jit.si via our Meeting page
  const handleCreateMeeting = () => {
    const room = generateRoomName();
    navigate(`/meeting?roomName=${encodeURIComponent(room)}&useJwt=true`);
  };

  // Create a JaaS meeting (with JWT)
  const handleCreateJaaSMeeting = () => {
    navigate('/jaas-meeting');
  };

  // Join an existing JaaS meeting
  const handleJoinJaaSMeeting = () => {
    if (!jaasRoomName.trim()) {
      alert('Please enter a room name');
      return;
    }
    setShowJaaSMeeting(true);
    setIsJaaSModalOpen(false);
  };

  // Open JaaS join modal
  const openJaaSModal = () => {
    setIsJaaSModalOpen(true);
    setJaasRoomName('');
  };

  // Join an existing meeting by room name
  const openJoinModal = () => {
    setJoinError('');
    setJoinRoomName('');
    setIsJoinModalOpen(true);
  };

  const closeJoinModal = () => {
    setIsJoinModalOpen(false);
  };

  const submitJoinMeeting = () => {
    const input = joinRoomName.trim();
    if (!input) {
      setJoinError('Please enter a room name or full meeting URL.');
      return;
    }
    setIsJoinModalOpen(false);
    // If user pasted a full URL (e.g., moderated link), route using meetingUrl param
    if (/^https?:\/\//i.test(input)) {
      navigate(`/meeting?meetingUrl=${encodeURIComponent(input)}`);
    } else {
      navigate(`/meeting?roomName=${encodeURIComponent(input)}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'closed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'open':
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  // Calculate average TAT for closed claims
  // Since tat_hours is not available in the API response, we'll calculate it based on created_at
  const calculateAverageTAT = () => {
    const closedClaims = filteredClaims.filter(claim => claim.status === 'closed');
    if (closedClaims.length === 0) return 0;
    
    // For demo purposes, we'll use a fixed TAT since we don't have closed_at timestamps
    return 24; // 24 hours average TAT for demo
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-6"></div>
          <p className="text-white text-xl font-medium">Loading dashboard...</p>
          <p className="text-purple-300 text-sm mt-2">Fetching your claims data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/60 backdrop-blur-md border-b border-slate-700/50 shadow-2xl">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Video className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                  VerifyCall Dashboard
                </h1>
                <p className="text-gray-300 text-sm font-medium">Insurance Claims Verification System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 px-4 py-2 bg-slate-700/50 rounded-xl border border-slate-600">
                <User className="w-5 h-5 text-purple-400" />
                <span className="text-gray-200 font-medium">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={handleCreateNewClaim}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Create New Claim</span>
          </button>
          
          <button
            onClick={handleDetailedDashboard}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold">Detailed Dashboard</span>
          </button>

          {/* Jitsi Buttons */}
         

          

          <button
            onClick={openJoinModal}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-xl hover:from-cyan-700 hover:to-cyan-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Video className="w-5 h-5" />
            <span className="font-semibold">Join Meeting</span>
          </button>

          <div className="border-l-2 border-slate-600 mx-2"></div>

      

         

          <button
            onClick={() => navigate('/jaas-meeting')}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl hover:from-pink-700 hover:to-pink-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Video className="w-5 h-5" />
            <span className="font-semibold">JaaS Meeting</span>
          </button>

          <button
            onClick={() => setShowSimpleMeeting(true)}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Video className="w-5 h-5" />
            <span className="font-semibold">Jitsi Meeting</span>
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by claim number, mobile, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <div className="relative min-w-[150px]">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-8 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredClaims.length} of {claims.length} claims
            {(startDate && endDate) && (
              <span className="ml-2 text-purple-300">
                • Filtered by date: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 overflow-x-auto">
          {/* Total Claims */}
          <div className="group relative overflow-hidden bg-gradient-to-r from-slate-800/90 via-slate-700/80 to-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:scale-[1.02] hover:border-blue-500/30 flex-1 min-w-[250px]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-400 text-sm font-medium tracking-wide uppercase mb-2">Total Claims</p>
                <p className="text-4xl font-black text-white mb-1 tracking-tight">{filteredClaims.length}</p>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 via-blue-400/15 to-cyan-500/20 rounded-2xl flex items-center justify-center border border-blue-400/30 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <Eye className="w-8 h-8 text-blue-300 group-hover:text-blue-200 transition-colors duration-300" />
              </div>
            </div>
          </div>

          {/* Open Claims */}
          <div className="group relative overflow-hidden bg-gradient-to-r from-slate-800/90 via-slate-700/80 to-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:scale-[1.02] hover:border-orange-500/30 flex-1 min-w-[250px]">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 via-transparent to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-400 text-sm font-medium tracking-wide uppercase mb-2">Open Claims</p>
                <p className="text-4xl font-black text-white mb-1 tracking-tight">
                  {filteredClaims.filter(claim => claim.status === 'open').length}
                </p>
                <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"></div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 via-orange-400/15 to-amber-500/20 rounded-2xl flex items-center justify-center border border-orange-400/30 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-orange-300 group-hover:text-orange-200 transition-colors duration-300" />
              </div>
            </div>
          </div>

          {/* Closed Claims */}
          <div className="group relative overflow-hidden bg-gradient-to-r from-slate-800/90 via-slate-700/80 to-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 shadow-2xl hover:shadow-green-500/10 transition-all duration-500 hover:scale-[1.02] hover:border-green-500/30 flex-1 min-w-[250px]">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 via-transparent to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-400 text-sm font-medium tracking-wide uppercase mb-2">Closed Claims</p>
                <p className="text-4xl font-black text-white mb-1 tracking-tight">
                  {filteredClaims.filter(claim => claim.status === 'closed').length}
                </p>
                <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 via-green-400/15 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-green-400/30 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-8 h-8 text-green-300 group-hover:text-green-200 transition-colors duration-300" />
              </div>
            </div>
          </div>

          {/* Average TAT */}
          <div className="group relative overflow-hidden bg-gradient-to-r from-slate-800/90 via-slate-700/80 to-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 flex-1 min-w-[250px]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-400 text-sm font-medium tracking-wide uppercase mb-2">Avg TAT (Hours)</p>
                <p className="text-4xl font-black text-white mb-1 tracking-tight">{calculateAverageTAT()}</p>
                <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full"></div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 via-purple-400/15 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-400/30 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-8 h-8 text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Claims Overview</h2>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </button>
          </div>

          {filteredClaims.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg font-medium">No claims found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm || statusFilter !== 'all' || startDate || endDate
                  ? 'Try adjusting your search filters'
                  : 'Create your first claim to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Claim #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Patient Mobile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hospital Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600/30">
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-700/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{claim.claim_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-200">{claim.patient_mobile}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-200">
                            {claim.hospital_city}, {claim.hospital_state}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(claim.status)}
                          <span className={`text-sm font-medium ${
                            claim.status === 'closed' ? 'text-green-400' : 
                            claim.status === 'open' ? 'text-blue-400' : 'text-gray-400'
                          }`}>
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(claim.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleGenerateMeetingLink(claim)}
                            className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-xs font-medium"
                          >
                            <Link className="w-3 h-3" />
                            <span>Meeting</span>
                          </button>
                          <button
                            onClick={() => navigate(`/multi-step-form/${claim.id}`)}
                            className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-xs font-medium"
                          >
                            <Video className="w-3 h-3" />
                            <span>Start Action</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      {/* Join Meeting Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="join-meeting-title">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeJoinModal} />
          <div className="relative w-full max-w-md mx-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <h3 id="join-meeting-title" className="text-xl font-bold text-white mb-1">Join a Meeting</h3>
            <p className="text-sm text-slate-300 mb-5">Enter a Jitsi room name or paste a full meeting URL.</p>

            <label className="block text-sm text-slate-300 mb-2">Room name</label>
            <input
              type="text"
              value={joinRoomName}
              onChange={(e) => { setJoinRoomName(e.target.value); setJoinError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitJoinMeeting(); } }}
              autoFocus
              placeholder="e.g. verifycall-demo or https://meet.jit.si/moderated/..."
              className="w-full px-4 py-3 bg-slate-700/60 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            {joinError && (
              <div className="mt-2 text-sm text-red-400">{joinError}</div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeJoinModal}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitJoinMeeting}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-700 text-white hover:from-cyan-700 hover:to-cyan-800 shadow-md hover:shadow-lg transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      <JaasMeetingModal
        isOpen={isJaaSModalOpen}
        onClose={() => setIsJaaSModalOpen(false)}
        roomName={jaasRoomName}
        setRoomName={setJaasRoomName}
        onSubmit={handleJoinJaaSMeeting}
      />

      {/* JaaS Meeting Wrapper */}
      {showJaaSMeeting && (
        <div className="z-50">
          <JaaSMeetingWrapper
            roomName={`meeting-${Date.now()}`}
            onMeetingEnd={() => setShowJaaSMeeting(false)}
          />
        </div>
      )}

      {/* Simple Meeting Wrapper */}
      {showSimpleMeeting && (
        <div className="fixed inset-0 z-50">
          <SimpleMeetingWrapper
            roomName={`simple-meeting-${Date.now()}`}
            onMeetingEnd={() => setShowSimpleMeeting(false)}
          />
        </div>
      )}
      
    </div>
  );
};

export default Dashboard;
