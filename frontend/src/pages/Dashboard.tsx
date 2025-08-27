import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  AlertCircle
} from 'lucide-react';

const mockClaims = [
  {
    id: 1,
    claim_number: 'CLM-2024-001',
    patient_mobile: '+1-555-0123',
    hospital_city: 'New York',
    hospital_state: 'NY',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    claim_number: 'CLM-2024-002',
    patient_mobile: '+1-555-0124',
    hospital_city: 'Los Angeles',
    hospital_state: 'CA',
    status: 'completed',
    created_at: '2024-01-14T14:20:00Z'
  },
  {
    id: 3,
    claim_number: 'CLM-2024-003',
    patient_mobile: '+1-555-0125',
    hospital_city: 'Chicago',
    hospital_state: 'IL',
    status: 'pending',
    created_at: '2024-01-13T09:15:00Z'
  },
  {
    id: 4,
    claim_number: 'CLM-2024-004',
    patient_mobile: '+1-555-0126',
    hospital_city: 'Houston',
    hospital_state: 'TX',
    status: 'completed',
    created_at: '2024-01-12T16:45:00Z'
  },
  {
    id: 5,
    claim_number: 'CLM-2024-005',
    patient_mobile: '+1-555-0127',
    hospital_city: 'Phoenix',
    hospital_state: 'AZ',
    status: 'active',
    created_at: '2024-01-11T11:30:00Z'
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [claims] = useState(mockClaims);
  const [filteredClaims, setFilteredClaims] = useState(mockClaims);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Filter claims based on search term and status
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

    setFilteredClaims(filtered);
  }, [claims, searchTerm, statusFilter]);

  const handleStartVideoCall = (claim: any) => {
    alert(`Starting video call for claim: ${claim.claim_number}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCreateNewClaim = () => {
    navigate('/create-claim');
  };

  const handleDetailedDashboard = () => {
    alert('Detailed Dashboard clicked');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'active':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
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
            
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-8 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredClaims.length} of {claims.length} claims
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Claims</p>
                <p className="text-3xl font-bold text-white mt-1">{claims.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <Eye className="w-7 h-7 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Claims</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {claims.filter(claim => claim.status === 'active').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center border border-green-500/30">
                <Clock className="w-7 h-7 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {claims.filter(claim => claim.status === 'completed').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                <CheckCircle className="w-7 h-7 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {claims.filter(claim => claim.status === 'pending').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl flex items-center justify-center border border-yellow-500/30">
                <AlertCircle className="w-7 h-7 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-700/30">
            <h2 className="text-2xl font-bold text-white">Claims Overview</h2>
            <p className="text-gray-300 text-sm mt-1">Manage and track your insurance verification claims</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/40 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Claim Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Patient Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-700/30 transition-all duration-200">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-semibold text-white">{claim.claim_number}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-300">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                          <Phone className="w-4 h-4 text-purple-400" />
                        </div>
                        {claim.patient_mobile}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-300">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                          <MapPin className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div>{claim.hospital_city}</div>
                          <div className="text-xs text-gray-400">{claim.hospital_state}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(claim.status)}
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          claim.status === 'active' 
                            ? 'bg-green-100/90 text-green-800' 
                            : claim.status === 'completed'
                            ? 'bg-blue-100/90 text-blue-800'
                            : claim.status === 'pending'
                            ? 'bg-yellow-100/90 text-yellow-800'
                            : 'bg-gray-100/90 text-gray-800'
                        }`}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-300">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center mr-3">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                        </div>
                        {new Date(claim.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStartVideoCall(claim)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Start Call
                        </button>
                        <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClaims.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-3">
                {searchTerm || statusFilter !== 'all' ? 'No matching claims found' : 'No claims found'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by creating your first insurance claim verification.'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <button
                  onClick={handleCreateNewClaim}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Claim
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;