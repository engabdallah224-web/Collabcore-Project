import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Users, MessageSquare, FileText, Grid, List, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCategory, formatStatus } from '../utils/helpers';

const MyProjectsPage = () => {
  const [activeTab, setActiveTab] = useState('leading');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'name', 'progress'

  // Fetch leading projects
  const { data: leadingData, isLoading: leadingLoading, error: leadingError } = useQuery({
    queryKey: ['my-leading-projects'],
    queryFn: async () => {
      const response = await projectAPI.getMyLeadingProjects();
      return response.data;
    },
  });

  // Fetch collaborating projects
  const { data: collaboratingData, isLoading: collaboratingLoading, error: collaboratingError } = useQuery({
    queryKey: ['my-collaborating-projects'],
    queryFn: async () => {
      const response = await projectAPI.getMyCollaboratingProjects();
      return response.data;
    },
  });

  const leadingProjects = leadingData?.projects || [];
  const collaboratingProjects = collaboratingData?.projects || [];

  const isLoading = activeTab === 'leading' ? leadingLoading : collaboratingLoading;
  const error = activeTab === 'leading' ? leadingError : collaboratingError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-800 text-sm">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Modern Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Header with Title and Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                My Projects
              </h1>
              <p className="text-gray-600">
                Manage your projects and collaborations
              </p>
            </div>
            <Link to="/projects/create">
              <motion.button
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:bg-red-700 transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="h-5 w-5" />
                New Project
              </motion.button>
            </Link>
          </div>

          {/* Modern Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {leadingProjects.length}
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    Leading
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {collaboratingProjects.length}
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    Collaborating
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {leadingProjects.reduce((sum, p) => sum + (p.pending_applications || 0), 0)}
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    Pending
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {leadingProjects.filter(p => p.status === 'completed').length}
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    Completed
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Modern Tabs and Controls */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header with Tabs */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setActiveTab('leading')}
                  className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-all ${
                    activeTab === 'leading'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } border`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Briefcase className="h-4 w-4" />
                  Leading
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === 'leading'
                      ? 'bg-white text-red-600'
                      : 'bg-red-600 text-white'
                  }`}>
                    {leadingProjects.length}
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => setActiveTab('collaborating')}
                  className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-all ${
                    activeTab === 'collaborating'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } border`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Users className="h-4 w-4" />
                  Collaborating
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === 'collaborating'
                      ? 'bg-white text-red-600'
                      : 'bg-red-600 text-white'
                  }`}>
                    {collaboratingProjects.length}
                  </span>
                </motion.button>
              </div>

              {/* Modern View Controls */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <motion.button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Grid className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <List className="h-4 w-4" />
                  </motion.button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
                >
                  <option value="recent">📅 Recent</option>
                  <option value="name">🔤 Name</option>
                  <option value="status">📊 Status</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Failed to load projects</h3>
                <p className="text-gray-600">
                  {error.response?.data?.detail || 'Something went wrong. Please try again.'}
                </p>
              </div>
            )}

            {activeTab === 'leading' && !error && (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {leadingProjects.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">No projects yet</h3>
                    <p className="mb-6 text-gray-600">
                      Create your first project and start collaborating!
                    </p>
                    <Link to="/projects/create">
                      <motion.button
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:bg-red-700 transition-all"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Create Project
                      </motion.button>
                    </Link>
                  </div>
                ) : (
                  leadingProjects.map((project, index) => {
                    const pendingApps = project.pending_applications || 0;

                    return (
                      <motion.div
                        key={project.id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                        whileHover={{ scale: 1.02, y: -4 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {/* Modern Header */}
                        <div className="p-5 border-b border-gray-100">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                              {project.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              project.status === 'recruiting'
                                ? 'bg-red-100 text-red-700'
                                : project.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {formatStatus(project.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {project.description}
                          </p>
                        </div>

                        <div className="p-5">
                          {/* Modern Stats */}
                          <div className="flex items-center justify-between text-sm mb-4">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-gray-600">
                                <Users className="h-4 w-4 text-red-600" />
                                <span className="font-medium">{project.current_team_size || 0}/{project.team_size_limit}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-600">
                                <FileText className="h-4 w-4 text-red-600" />
                                <span className="font-medium">{pendingApps} apps</span>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                              {formatCategory(project.category)}
                            </span>
                          </div>

                          {/* Modern Skills */}
                          {project.required_skills && project.required_skills.length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-2">
                                {project.required_skills.slice(0, 3).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {project.required_skills.length > 3 && (
                                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md font-medium">
                                    +{project.required_skills.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Modern Action Buttons */}
                          <div className="flex gap-3">
                            <Link to={`/projects/${project.id}/workspace`} className="flex-1">
                              <motion.button
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <MessageSquare className="h-4 w-4" />
                                Workspace
                              </motion.button>
                            </Link>
                            <Link to={`/projects/${project.id}/applications`} className="flex-1">
                              <motion.button
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all relative ${
                                  pendingApps > 0
                                    ? 'bg-gray-800 text-white hover:bg-gray-900'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <FileText className="h-4 w-4" />
                                Apps
                                {pendingApps > 0 && (
                                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-600 text-white rounded-full text-xs font-bold min-w-[20px] h-5 flex items-center justify-center">
                                    {pendingApps}
                                  </span>
                                )}
                              </motion.button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'collaborating' && !error && (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {collaboratingProjects.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">🤝</div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">No collaborations yet</h3>
                    <p className="mb-6 text-gray-600">
                      Explore projects and apply to join teams!
                    </p>
                    <Link to="/discovery">
                      <motion.button
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:bg-red-700 transition-all"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Discover Projects
                      </motion.button>
                    </Link>
                  </div>
                ) : (
                  collaboratingProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                      whileHover={{ scale: 1.02, y: -4 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {/* Modern Header */}
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                            {project.title}
                          </h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            Member
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {project.description}
                        </p>
                      </div>

                      <div className="p-5">
                        {/* Modern Info */}
                        <div className="flex items-center justify-between text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users className="h-4 w-4 text-red-600" />
                              <span className="font-medium">{project.current_team_size || 0} members</span>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                            {formatStatus(project.status)}
                          </span>
                        </div>

                        {/* Modern Action Button */}
                        <Link to={`/projects/${project.id}/workspace`} className="w-full">
                          <motion.button
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <MessageSquare className="h-4 w-4" />
                            Open Workspace
                          </motion.button>
                        </Link>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProjectsPage;
