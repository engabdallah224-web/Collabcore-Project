import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Paperclip, Smile, Users, BarChart, Settings, Video, Phone, ArrowLeft, CheckSquare, TrendingUp, X, GitBranch, FileText, Sparkles, Crown, Clock, Image as ImageIcon, File, Download, Plus } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectAPI, authAPI, messageAPI, uploadAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { User } from '../models';
import RepositoryPanel from '../components/vcs/RepositoryPanel';
import DocumentsPanel from '../components/documents/DocumentsPanel';
import CallButtons from '../components/calls/CallButtons';
import MeetingsPanel from '../components/meetings/MeetingsPanel';
import EmojiPicker from 'emoji-picker-react';

const ProjectWorkspace = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('file');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('upload'); // 'upload' or 'url'
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Fetch project details
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectAPI.getProject(projectId);
      return response.data.project;
    },
    enabled: !!projectId
  });

  // Fetch current user
  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await authAPI.getMe();
      return response.data.user;
    }
  });

  // Fetch project applications
  const { data: applicationsData } = useQuery({
    queryKey: ['project-applications', projectId],
    queryFn: async () => {
      try {
        const response = await projectAPI.getProjectApplications(projectId);
        return response.data.applications || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!projectId,
    retry: 1
  });

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      try {
        const response = await projectAPI.getTasks(projectId);
        return response.data.tasks || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!projectId
  });

  // Fetch messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['project-messages', projectId],
    queryFn: async () => {
      const response = await messageAPI.getMessages(projectId, { limit: 100 });
      return response.data.messages;
    },
    enabled: !!projectId,
    refetchInterval: 5000
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const response = await messageAPI.sendMessage(projectId, {
        project_id: projectId,
        content: messageData.content,
        message_type: messageData.message_type || 'text',
        file_url: messageData.file_url || null,
        file_name: messageData.file_name || null
      });
      return response.data.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-messages', projectId]);
      setMessage('');
      setFileUrl('');
      setFileName('');
      setFileType('file');
      setShowFileModal(false);
    }
  });

  // Build team members
  const teamMembers = React.useMemo(() => {
    if (!projectData || !applicationsData || !userData) return [];
    
    const members = [];
    
    // Add project owner
    members.push({
      id: projectData.owner_id,
      name: projectData.owner?.full_name || 'Unknown',
      role: 'Project Leader',
      avatar: projectData.owner?.full_name?.charAt(0) || 'U',
      status: 'online',
      isOwner: true
    });
    
    // Add accepted team members
    const acceptedApplications = applicationsData.filter(app => app.status === 'accepted');
    
    acceptedApplications.forEach(app => {
      if (app.user && app.user_id !== projectData.owner_id) {
        members.push({
          id: app.user_id,
          name: app.user.full_name,
          role: 'Team Member',
          avatar: app.user.full_name?.charAt(0) || 'T',
          status: Math.random() > 0.5 ? 'online' : 'offline',
          isOwner: false
        });
      }
    });
    
    return members;
  }, [projectData, applicationsData, userData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && messagesData && !messagesLoading) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messagesData, messagesLoading]);

  // Initial scroll to bottom when messages load
  useEffect(() => {
    if (chatContainerRef.current && messagesData && messagesData.length > 0) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messagesData?.length]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate({
        content: message,
        message_type: 'text'
      });
    }
  };

  const handleSendFile = async () => {
    if (uploadMethod === 'upload' && selectedFile) {
      // Upload file to Cloudinary first
      try {
        setUploadProgress(10);
        const uploadResponse = await uploadAPI.uploadFile(selectedFile, projectId);
        setUploadProgress(80);
        
        const uploadedData = uploadResponse.data;
        
        // Then send message with uploaded file
        sendMessageMutation.mutate({
          content: uploadedData.file_name,
          message_type: uploadedData.file_type,
          file_url: uploadedData.file_url,
          file_name: uploadedData.file_name
        });
        setUploadProgress(100);
        setSelectedFile(null);
      } catch (error) {
        alert(error.response?.data?.detail || 'Failed to upload file');
        setUploadProgress(0);
      }
    } else if (uploadMethod === 'url' && fileUrl.trim() && fileName.trim()) {
      // Send with pasted URL
      sendMessageMutation.mutate({
        content: fileName,
        message_type: fileType,
        file_url: fileUrl,
        file_name: fileName
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      
      // Auto-detect file type
      if (file.type.startsWith('image/')) {
        setFileType('image');
      } else {
        setFileType('file');
      }
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-[90vh] bg-[#f3f3f3]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f3f3f3]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
          <Link to="/projects" className="text-red-600 hover:text-red-700">
            Go back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[90vh] flex flex-col bg-[#f3f3f3]">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => navigate('/projects')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </motion.button>
              
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">{projectData.title}</h1>
                  {projectData.status === 'active' && (
                    <span className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full text-xs font-semibold text-green-700">
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-1 flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{teamMembers.length} members</span>
                  <span className="mx-2">•</span>
                  <Clock className="h-4 w-4" />
                  <span className="capitalize">{projectData.category}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CallButtons projectId={projectId} teamMembers={teamMembers} />
              
              <motion.button
                onClick={() => setActiveDrawer(activeDrawer === 'settings' ? null : 'settings')}
                className={`p-3 rounded-lg transition-all ${
                  activeDrawer === 'settings'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm"
        >
          {/* Team Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Users className="h-5 w-5 text-red-600" />
                  <span>Team</span>
                </h2>
                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-semibold">
                  {teamMembers.length}
                </span>
              </div>

              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                          member.isOwner ? 'bg-red-600' : 'bg-gray-600'
                        }`}>
                          {member.avatar}
                        </div>
                        {member.isOwner && (
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                            <Crown className="h-3 w-3 text-yellow-900" />
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                          member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-6 pb-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-red-600" />
                <span>Quick Actions</span>
              </h3>
              
              <div className="space-y-2">
                {[
                  { id: 'tasks', icon: CheckSquare, label: 'Tasks', badge: tasksData?.length },
                  { id: 'meetings', icon: Video, label: 'Meetings', badge: null },
                  { id: 'repository', icon: GitBranch, label: 'Repository', badge: null },
                  { id: 'documents', icon: FileText, label: 'Documents', badge: null },
                  { id: 'stats', icon: BarChart, label: 'Statistics', badge: null }
                ].map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={() => setActiveDrawer(activeDrawer === action.id ? null : action.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all ${
                      activeDrawer === action.id
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <action.icon className="h-5 w-5" />
                      <span>{action.label}</span>
                    </div>
                    {action.badge && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        activeDrawer === action.id 
                          ? 'bg-white text-red-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {action.badge}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 bg-[#f3f3f3]"
          >
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : messagesData && messagesData.length > 0 ? (
              <div className="space-y-4">
                {[...messagesData].reverse().map((msg, index) => {
                  const isOwn = userData && msg.sender_id === userData.uid;
                  const senderInitials = msg.sender?.full_name
                    ? msg.sender.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                    : '?';
                  
                  return (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xl ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {/* Avatar */}
                        {!isOwn && (
                          <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {senderInitials}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className="group relative">
                          <div className={`rounded-2xl shadow-sm overflow-hidden ${
                            isOwn
                              ? 'bg-red-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                          }`}>
                            <div className="px-4 py-3">
                              {!isOwn && (
                                <p className="text-xs font-semibold mb-1 text-red-600">
                                  {msg.sender?.full_name || 'Unknown'}
                                </p>
                              )}
                              
                              {/* Image Message */}
                              {msg.message_type === 'image' && msg.file_url && (
                                <div className="mb-2">
                                  <img 
                                    src={msg.file_url} 
                                    alt={msg.file_name || 'Image'} 
                                    className="max-w-sm max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(msg.file_url, '_blank')}
                                  />
                                </div>
                              )}

                              {/* File Message */}
                              {msg.message_type === 'file' && msg.file_url && (
                                <a 
                                  href={msg.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center space-x-3 p-3 rounded-lg mb-2 ${
                                    isOwn ? 'bg-red-700' : 'bg-gray-100'
                                  } hover:opacity-90 transition-opacity`}
                                >
                                  <File className="h-8 w-8 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{msg.file_name || 'File'}</p>
                                    <p className={`text-xs ${isOwn ? 'text-red-100' : 'text-gray-500'}`}>
                                      Click to download
                                    </p>
                                  </div>
                                  <Download className="h-4 w-4 flex-shrink-0" />
                                </a>
                              )}

                              {/* Text Content */}
                              <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                              
                              {msg.is_edited && (
                                <span className={`text-xs italic mt-1 block ${
                                  isOwn ? 'text-red-100' : 'text-gray-500'
                                }`}>
                                  (edited)
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Timestamp */}
                          <p className={`text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isOwn ? 'text-right' : 'text-left'
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {isOwn && (
                          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {senderInitials}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
                    <MessageSquare className="h-10 w-10 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No messages yet
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Start the conversation with your team!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-gray-200 relative">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full px-4 py-3 pr-20 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500 resize-none"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                
                <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                  <motion.button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Smile className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setShowFileModal(true)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Paperclip className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={sendMessageMutation.isPending || !message.trim()}
                className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: message.trim() ? 1.05 : 1 }}
                whileTap={{ scale: message.trim() ? 0.95 : 1 }}
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </form>

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  ref={emojiPickerRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-20 right-4 z-50 shadow-2xl"
                >
                  <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* File Upload Modal */}
          <AnimatePresence>
            {showFileModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowFileModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Share File or Image</h3>
                    <button
                      onClick={() => setShowFileModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Upload Method Tabs */}
                  <div className="mb-4">
                    <div className="flex gap-2 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => setUploadMethod('upload')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                          uploadMethod === 'upload'
                            ? 'border-red-600 text-red-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        📤 Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMethod('url')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                          uploadMethod === 'url'
                            ? 'border-red-600 text-red-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        🔗 Paste URL
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {uploadMethod === 'upload' ? (
                      /* Upload File Option */
                      <>
                        {/* File Input */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select File
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-500 transition-colors">
                            <input
                              ref={fileInputRef}
                              type="file"
                              onChange={handleFileSelect}
                              className="hidden"
                              accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
                            />
                            {selectedFile ? (
                              <div className="space-y-2">
                                <div className="h-16 w-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto">
                                  {fileType === 'image' ? (
                                    <ImageIcon className="h-8 w-8 text-red-600" />
                                  ) : (
                                    <File className="h-8 w-8 text-red-600" />
                                  )}
                                </div>
                                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                                >
                                  Change file
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                                  <Plus className="h-8 w-8 text-gray-400" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                  Choose a file
                                </button>
                                <p className="text-xs text-gray-500">
                                  Max size: 10MB • Images, videos, PDFs, documents
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Preview for images */}
                        {selectedFile && fileType === 'image' && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Preview
                            </label>
                            <img 
                              src={URL.createObjectURL(selectedFile)} 
                              alt="Preview" 
                              className="w-full max-h-48 object-contain rounded-xl bg-gray-100"
                            />
                          </div>
                        )}

                        {/* Upload Progress */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Uploading...</span>
                              <span className="text-sm text-gray-600">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Paste URL Option */
                      <>
                        {/* Free Hosting Info */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-semibold text-blue-900 mb-2">💡 Free File Hosting:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                            <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="hover:underline">• Imgur (images)</a>
                            <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="hover:underline">• ImgBB (images)</a>
                            <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="hover:underline">• Google Drive</a>
                            <a href="https://www.dropbox.com" target="_blank" rel="noopener noreferrer" className="hover:underline">• Dropbox</a>
                          </div>
                        </div>

                        {/* File Type Selection */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Type
                          </label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setFileType('image')}
                              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                                fileType === 'image'
                                  ? 'border-red-600 bg-red-50 text-red-600'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                              <span className="text-sm font-medium">Image</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFileType('file')}
                              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                                fileType === 'file'
                                  ? 'border-red-600 bg-red-50 text-red-600'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <File className="h-6 w-6 mx-auto mb-1" />
                              <span className="text-sm font-medium">File</span>
                            </button>
                          </div>
                        </div>

                        {/* File Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            File Name
                          </label>
                          <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="Enter file name"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          />
                        </div>

                        {/* File URL */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {fileType === 'image' ? 'Image' : 'File'} URL *
                          </label>
                          <input
                            type="url"
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            placeholder={fileType === 'image' 
                              ? 'https://i.imgur.com/abc123.jpg' 
                              : 'https://drive.google.com/file/d/abc123/view'
                            }
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {fileType === 'image' 
                              ? 'Direct image link (must end with .jpg, .png, .gif, etc.)' 
                              : 'Direct download or shareable link'
                            }
                          </p>
                        </div>

                        {/* Preview */}
                        {fileType === 'image' && fileUrl && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Preview
                            </label>
                            <img 
                              src={fileUrl} 
                              alt="Preview" 
                              className="w-full max-h-48 object-contain rounded-xl bg-gray-100"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowFileModal(false);
                          setSelectedFile(null);
                          setFileUrl('');
                          setFileName('');
                          setUploadProgress(0);
                        }}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSendFile}
                        disabled={
                          (uploadMethod === 'upload' && !selectedFile) ||
                          (uploadMethod === 'url' && (!fileUrl.trim() || !fileName.trim())) ||
                          sendMessageMutation.isPending ||
                          uploadProgress > 0
                        }
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadProgress > 0 && uploadProgress < 100 ? 'Uploading...' : 
                         sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Drawer */}
        <AnimatePresence>
          {activeDrawer && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-[500px] bg-white border-l border-gray-200 flex flex-col shadow-lg"
            >
              {/* Drawer Header */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    {activeDrawer === 'tasks' && (
                      <>
                        <CheckSquare className="h-6 w-6 text-red-600" />
                        <span>Project Tasks</span>
                      </>
                    )}
                    {activeDrawer === 'meetings' && (
                      <>
                        <Video className="h-6 w-6 text-red-600" />
                        <span>Meetings</span>
                      </>
                    )}
                    {activeDrawer === 'repository' && (
                      <>
                        <GitBranch className="h-6 w-6 text-red-600" />
                        <span>Version Control</span>
                      </>
                    )}
                    {activeDrawer === 'documents' && (
                      <>
                        <FileText className="h-6 w-6 text-red-600" />
                        <span>Documents</span>
                      </>
                    )}
                    {activeDrawer === 'settings' && (
                      <>
                        <Settings className="h-6 w-6 text-red-600" />
                        <span>Project Settings</span>
                      </>
                    )}
                    {activeDrawer === 'stats' && (
                      <>
                        <BarChart className="h-6 w-6 text-red-600" />
                        <span>Statistics</span>
                      </>
                    )}
                  </h3>
                  <motion.button
                    onClick={() => setActiveDrawer(null)}
                    className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto bg-[#f3f3f3]">
                {activeDrawer === 'tasks' && (
                  <div className="p-6">
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
                        <CheckSquare className="h-10 w-10 text-red-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        No tasks yet
                      </h4>
                      <p className="text-gray-600 text-sm mb-6">
                        Create and manage project tasks to track progress
                      </p>
                      <motion.button
                        onClick={() => navigate(`/projects/${projectId}/tasks`)}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 hover:shadow-md transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Manage Tasks
                      </motion.button>
                    </div>
                  </div>
                )}

                {activeDrawer === 'meetings' && (
                  <MeetingsPanel projectId={projectId} teamMembers={teamMembers} />
                )}

                {activeDrawer === 'repository' && (
                  <div className="p-6">
                    <RepositoryPanel 
                      projectId={projectId} 
                      isOwner={userData && projectData && userData.uid === projectData.owner_id}
                    />
                  </div>
                )}

                {activeDrawer === 'documents' && (
                  <div className="p-6">
                    <DocumentsPanel projectId={projectId} />
                  </div>
                )}

                {activeDrawer === 'settings' && (
                  <div className="p-6 space-y-4">
                    <motion.button
                      onClick={() => navigate(`/projects/${projectId}/settings`)}
                      className="w-full p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-100 rounded-xl">
                          <Settings className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">Project Settings</div>
                          <div className="text-sm text-gray-600">Configure project details</div>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={() => navigate(`/projects/${projectId}/analytics`)}
                      className="w-full p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-100 rounded-xl">
                          <TrendingUp className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">Analytics</div>
                          <div className="text-sm text-gray-600">View detailed insights</div>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                )}

                {activeDrawer === 'stats' && (
                  <div className="p-6 space-y-4">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-gray-700">Team Size</span>
                        <span className="text-3xl font-bold text-red-600">
                          {projectData.current_team_size || 1}/{projectData.team_size_limit || 5}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                          className="bg-red-600 h-3 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${((projectData.current_team_size || 1) / (projectData.team_size_limit || 5)) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-3">
                        {projectData.team_size_limit - (projectData.current_team_size || 1)} spots remaining
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-700">Status</span>
                        <span className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl capitalize">
                          {projectData.status}
                        </span>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-700">Category</span>
                        <span className="px-4 py-2 bg-gray-100 text-gray-900 font-medium rounded-xl capitalize">
                          {projectData.category}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProjectWorkspace;
