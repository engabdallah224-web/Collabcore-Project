import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Send, X, CheckCircle, Heart, Bookmark, TrendingUp, Star, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationAPI } from '../../services/api';

const DiscoveryFeed = ({ projects }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [likedProjects, setLikedProjects] = useState(new Set());
  const [savedProjects, setSavedProjects] = useState(new Set());

  const queryClient = useQueryClient();

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data) => {
      const response = await applicationAPI.createApplication(data);
      return response.data.application;
    },
    onSuccess: () => {
      setShowApplicationModal(false);
      setApplicationMessage('');
      queryClient.invalidateQueries(['projects']);
      alert('Application submitted successfully!');
    },
    onError: (error) => {
      console.error('Failed to submit application:', error);
      alert(error.response?.data?.detail || 'Failed to submit application. Please try again.');
    }
  });

  const handleApply = (project) => {
    setSelectedProject(project);
    setShowApplicationModal(true);
  };

  const submitApplication = () => {
    if (!selectedProject || !applicationMessage.trim()) {
      alert('Please enter a message for your application');
      return;
    }
    
    createApplicationMutation.mutate({
      project_id: selectedProject.id,
      message: applicationMessage
    });
  };

  const toggleLike = (projectId) => {
    setLikedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const toggleSave = (projectId) => {
    setSavedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const getMatchScore = () => {
    // Mock match score calculation
    return Math.floor(Math.random() * 30) + 70;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project, index) => {
          const matchScore = getMatchScore();
          const isLiked = likedProjects.has(project.id);
          const isSaved = savedProjects.has(project.id);
          const spotsLeft = project.team_size_limit - project.current_team_size;

          return (
            <motion.div
              key={project.id}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              {/* Gradient Background Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-white to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Top Bar with Match Score */}
              <div className="relative bg-gradient-to-r from-gray-900 via-black to-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-white font-bold text-sm">{matchScore}% Match</span>
                  </div>
                  <motion.span
                    className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                      project.status === 'recruiting'
                        ? 'bg-emerald-400/90 text-emerald-900'
                        : 'bg-blue-400/90 text-blue-900'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {project.status === 'recruiting' ? '🚀 Recruiting' : '✅ Active'}
                  </motion.span>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => toggleLike(project.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-full transition-all backdrop-blur-sm ${
                      isLiked
                        ? 'bg-white text-red-500'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  </motion.button>
                  <motion.button
                    onClick={() => toggleSave(project.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-full transition-all backdrop-blur-sm ${
                      isSaved
                        ? 'bg-white text-amber-500'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  </motion.button>
                </div>
              </div>

              <div className="relative p-5">
                {/* Owner Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-lg font-bold shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      {project.owner?.full_name?.charAt(0) || 'U'}
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border border-white"></div>
                    </motion.div>
                    <div>
                      <p className="font-bold text-gray-900">{project.owner?.full_name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-500" />
                        {project.owner?.university}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-yellow-700 font-semibold">4.8</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">12 projects</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">
                        {Math.floor(Math.random() * 24) + 1}h ago
                      </span>
                    </div>

                    {/* Inline Stats */}
                    <div className="flex gap-2 text-xs">
                      <div className="text-center bg-blue-50 px-2 py-1 rounded">
                        <div className="font-bold text-blue-600">{spotsLeft}</div>
                        <div className="text-gray-600">Spots</div>
                      </div>
                      <div className="text-center bg-red-50 px-2 py-1 rounded">
                        <div className="font-bold text-red-600">{project.current_team_size}</div>
                        <div className="text-gray-600">Team</div>
                      </div>
                      <div className="text-center bg-purple-50 px-2 py-1 rounded">
                        <div className="font-bold text-purple-600">
                          {Math.floor(Math.random() * 20) + 5}
                        </div>
                        <div className="text-gray-600">Interest</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Title */}
                <Link to={`/projects/${project.id}`}>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 hover:text-red-600 transition-all cursor-pointer leading-tight">
                    {project.title}
                  </h2>
                </Link>

                {/* Description */}
                <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                  {project.description}
                </p>

                {/* Skills Section with Action Buttons */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                          <Filter className="h-3 w-3 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">Looking for:</h3>

                        {/* Inline Skill Tags */}
                        <div className="flex flex-wrap gap-1">
                          {project.required_skills.map((skill, idx) => (
                            <motion.span
                              key={idx}
                              className="px-2 py-1 bg-gradient-to-r from-red-50 to-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200 hover:border-red-400 transition-all cursor-pointer"
                              whileHover={{ scale: 1.05 }}
                            >
                              {skill}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stacked Action Buttons - Top Right */}
                    <div className="flex flex-col gap-2">
                      <Link to={`/projects/${project.id}`}>
                        <motion.button
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all border border-gray-200 hover:border-gray-300 text-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          View Details
                        </motion.button>
                      </Link>

                      {spotsLeft > 0 && project.status === 'recruiting' ? (
                        <motion.button
                          onClick={() => handleApply(project)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-md hover:shadow-lg transition-all text-sm"
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Send className="h-4 w-4" />
                          Apply Now
                        </motion.button>
                      ) : (
                        /* Tags when no Apply button */
                        project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Tags inline with Apply button when recruiting */}
                  {spotsLeft > 0 && project.status === 'recruiting' && project.tags && project.tags.length > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>




              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Application Modal */}
      <AnimatePresence>
        {showApplicationModal && selectedProject && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplicationModal(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white sticky top-0 rounded-t-3xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-3">Apply to Project</h2>
                      <p className="text-red-100 text-lg font-medium">{selectedProject.title}</p>
                    </div>
                    <motion.button
                      onClick={() => setShowApplicationModal(false)}
                      className="p-3 hover:bg-white/20 rounded-2xl transition-all"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Project Info */}
                  <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center text-white font-bold">
                        {selectedProject.owner?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedProject.owner?.full_name}</p>
                        <p className="text-sm text-gray-600">{selectedProject.owner?.university}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.required_skills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white text-red-700 text-xs font-semibold rounded-full border border-red-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Application Message */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Why do you want to join this project? *
                    </label>
                    <textarea
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      rows="6"
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:border-red-500 focus:outline-none transition-all resize-none placeholder:text-gray-400"
                      placeholder="Tell the project leader why you're a great fit for this project. Mention your relevant skills and experience..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Tip: Be specific about what you can contribute to the project
                    </p>
                  </div>

                  {/* Your Skills Match */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">Skills Match</span>
                    </div>
                    <p className="text-sm text-green-700">
                      You have 3 of 4 required skills! This is a great match for your profile.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowApplicationModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                    <motion.button
                      onClick={submitApplication}
                      disabled={!applicationMessage.trim() || createApplicationMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700  shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: applicationMessage.trim() && !createApplicationMutation.isPending ? 1.02 : 1 }}
                      whileTap={{ scale: applicationMessage.trim() && !createApplicationMutation.isPending ? 0.98 : 1 }}
                    >
                      <Send className="h-5 w-5" />
                      {createApplicationMutation.isPending ? 'Submitting...' : 'Submit Application'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DiscoveryFeed;

