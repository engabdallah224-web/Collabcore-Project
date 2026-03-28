import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle, XCircle, Eye, Mail, MapPin, Code, Star, Filter, Search, ArrowLeft, Users, Clock, Award, TrendingUp, AlertCircle } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectAPI, applicationAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatStatus } from '../utils/helpers';

const ManageApplicationsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'accepted', 'rejected'
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch project details
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectAPI.getProject(projectId);
      return response.data.project;
    },
    enabled: !!projectId
  });

  // Fetch applications
  const { data: applicationsData, isLoading: applicationsLoading, error: applicationsError } = useQuery({
    queryKey: ['project-applications', projectId],
    queryFn: async () => {
      try {
        console.log('Fetching applications for project:', projectId);
        const response = await projectAPI.getProjectApplications(projectId);
        console.log('Applications response:', response.data);
        return response.data.applications || [];
      } catch (error) {
        console.error('Error fetching applications:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    enabled: !!projectId,
    retry: 1
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status }) => {
      return await applicationAPI.updateApplication(applicationId, { status });
    },
    onSuccess: () => {
      // Invalidate and refetch applications
      queryClient.invalidateQueries(['project-applications', projectId]);
      queryClient.invalidateQueries(['project', projectId]);
      setSelectedApp(null);
    },
    onError: (error) => {
      console.error('Failed to update application:', error);
    }
  });

  const filteredApplications = (applicationsData || []).filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = app.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.user?.university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.user?.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Debug logging
  React.useEffect(() => {
    console.log('ManageApplicationsPage state:', {
      projectId,
      hasProjectData: !!projectData,
      applicationsCount: applicationsData?.length,
      filteredCount: filteredApplications.length,
      filter,
      searchQuery,
      isLoading: applicationsLoading,
      hasError: !!applicationsError
    });
  }, [projectData, applicationsData, filteredApplications, filter, searchQuery, applicationsLoading, applicationsError, projectId]);

  const handleAccept = (appId) => {
    updateApplicationMutation.mutate({ applicationId: appId, status: 'accepted' });
  };

  const handleReject = (appId) => {
    updateApplicationMutation.mutate({ applicationId: appId, status: 'rejected' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (projectLoading || applicationsLoading) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (applicationsError) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Applications</h2>
          <p className="text-gray-600 mb-4">
            {applicationsError.response?.data?.detail || 'Failed to load applications. Please try again.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => navigate('/projects')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              ← Back to Projects
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/projects')}
            className="text-red-600 hover:text-red-700"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-600 rounded-full mix-blend-screen filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-red-500 rounded-full mix-blend-screen filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-red-700 rounded-full mix-blend-screen filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Applications</h1>
                <p className="text-gray-600">{projectData.title} • {projectData.current_team_size || 1}/{projectData.team_size_limit || 5} members</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl">
                <Users className="h-4 w-4" />
                <span className="text-sm font-semibold">{filteredApplications.length} Applications</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Filters and Search */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white shadow-sm"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All', count: applicationsData?.length || 0 },
                  { key: 'pending', label: 'Pending', count: applicationsData?.filter(app => app.status === 'pending').length || 0 },
                  { key: 'accepted', label: 'Accepted', count: applicationsData?.filter(app => app.status === 'accepted').length || 0 },
                  { key: 'rejected', label: 'Rejected', count: applicationsData?.filter(app => app.status === 'rejected').length || 0 }
                ].map(({ key, label, count }) => (
                  <motion.button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      filter === key
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {label} ({count})
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Applications Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredApplications.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {app.user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{app.user?.full_name || 'Unknown User'}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {app.user?.university || 'Unknown University'}
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                      {getStatusIcon(app.status)}
                      {formatStatus(app.status)}
                    </div>
                  </div>

                  {/* Applied Time */}
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-semibold text-gray-900">{app.user?.rating || 'N/A'}</span>
                      </div>
                      <div className="text-xs text-gray-600">Rating</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="font-semibold text-gray-900 mb-1">{app.user?.projects_completed || 'N/A'}</div>
                      <div className="text-xs text-gray-600">Projects</div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {(app.user?.skills || []).slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-lg font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {(app.user?.skills || []).length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                          +{(app.user?.skills || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3">{app.message}</p>
                  </div>


                  {/* Actions */}
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleAccept(app.id)}
                        disabled={updateApplicationMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept
                      </motion.button>
                      <motion.button
                        onClick={() => handleReject(app.id)}
                        disabled={updateApplicationMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </motion.button>
                    </div>
                  )}

                  {app.status !== 'pending' && (
                    <motion.button
                      onClick={() => setSelectedApp(app)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {filteredApplications.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">
                  {searchQuery ? 'Try adjusting your search terms' : 'No applications match the current filter'}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedApp(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {selectedApp.user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedApp.user?.full_name || 'Unknown User'}</h2>
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {selectedApp.user?.university || 'Unknown University'}
                        </div>
                      </div>
                    </div>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Message</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{selectedApp.message}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedApp.user?.skills || []).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="text-2xl font-bold text-gray-900">{selectedApp.user?.rating || 'N/A'}</span>
                      </div>
                      <div className="text-sm text-gray-600">Rating</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900 mb-2">{selectedApp.user?.projects_completed || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Projects Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageApplicationsPage;