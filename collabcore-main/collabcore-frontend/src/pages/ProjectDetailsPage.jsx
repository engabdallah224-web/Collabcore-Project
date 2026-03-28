import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Users, Clock, Calendar, Code, Target, 
  Send, MessageSquare, Settings, MapPin,
  CheckCircle, AlertCircle, Heart, Bookmark,
  Share2, Flag
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectAPI, applicationAPI, authAPI, userAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatStatus, formatCategory } from '../utils/helpers';

const ProjectDetailsPage = () => {

  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');

  /* ---------------- FETCH PROJECT ---------------- */

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      try {
        const res = await projectAPI.getProject(projectId);
        return res.data?.project || null;
      } catch (err) {
        console.error("Project load error:", err);
        return null;
      }
    },
    enabled: !!projectId
  });

  /* ---------------- FETCH USER ---------------- */

  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const res = await authAPI.getMe();
        return res.data?.user || null;
      } catch {
        return null;
      }
    }
  });

  /* ---------------- USER APPLICATIONS ---------------- */

  const { data: userApplications } = useQuery({
    queryKey: ['user-applications', userData?.uid],
    queryFn: async () => {
      try {
        if (!userData?.uid) return [];
        const res = await userAPI.getUserApplications(userData.uid);
        return res.data?.applications || [];
      } catch {
        return [];
      }
    },
    enabled: !!userData?.uid
  });

  /* ---------------- PROJECT APPLICATIONS ---------------- */

  const { data: projectApplications } = useQuery({
    queryKey: ['project-applications', projectId],
    queryFn: async () => {
      try {
        const res = await projectAPI.getProjectApplications(projectId);
        return res.data?.applications || [];
      } catch {
        return [];
      }
    },
    enabled: !!projectId
  });

  /* ---------------- APPLY ---------------- */

  const applyMutation = useMutation({
    mutationFn: (data) => applicationAPI.createApplication(data),

    onSuccess: () => {
      queryClient.invalidateQueries(['user-applications']);
      setShowApplyModal(false);
      setApplicationMessage('');
      alert('Application submitted successfully!');
    },

    onError: (error) => {
      alert(error.response?.data?.detail || 'Failed to submit application');
    }
  });

  const handleApply = () => {
    if (!applicationMessage.trim()) {
      alert('Please write a message');
      return;
    }

    applyMutation.mutate({
      project_id: projectId,
      message: applicationMessage
    });
  };

  /* ---------------- LOADING ---------------- */

  if (projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  /* ---------------- PROJECT NOT FOUND ---------------- */

  if (!projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <Link to="/discovery" className="text-blue-600 hover:text-blue-700">
            Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  /* ---------------- CALCULATIONS ---------------- */

  const isOwner = userData?.uid === projectData.owner_id;

  const hasApplied = userApplications?.some(
    (app) => app.project_id === projectId
  );

  const acceptedApplication = projectApplications?.find(
    (app) => app.user_id === userData?.uid && app.status === 'accepted'
  );

  const isMember = isOwner || !!acceptedApplication;

  const spotsLeft = projectData.team_size_limit - projectData.current_team_size;

  const teamMembers =
    projectApplications?.filter((app) => app.status === 'accepted') || [];

  /* ---------------- COLORS ---------------- */

  const getDifficultyColor = (difficulty) => {

    const colors = {
      beginner: 'bg-green-100 text-green-700 border-green-200',
      intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      advanced: 'bg-red-100 text-red-700 border-red-200'
    };

    return colors[difficulty] || colors.intermediate;
  };

  const getStatusColor = (status) => {

    const colors = {
      recruiting: 'bg-green-100 text-green-700',
      active: 'bg-blue-100 text-blue-700',
      completed: 'bg-purple-100 text-purple-700',
      on_hold: 'bg-gray-100 text-gray-700'
    };

    return colors[status] || colors.recruiting;
  };

  /* ---------------- PAGE ---------------- */

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO */}

      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white">

        <div className="max-w-7xl mx-auto px-4 py-8">

          <Link
            to="/discovery"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Discovery
          </Link>

          <h1 className="text-4xl font-bold mb-3">{projectData.title}</h1>

          <div className="flex items-center gap-4 text-sm">

            <span className="flex items-center gap-1">
              <Users className="h-4 w-4"/>
              {projectData.current_team_size}/{projectData.team_size_limit}
            </span>

            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4"/>
              {projectData.duration || "Flexible"}
            </span>

            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4"/>
              {new Date(projectData.created_at).toLocaleDateString()}
            </span>

          </div>

        </div>

      </div>

      {/* MAIN */}

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}

        <div className="lg:col-span-2 space-y-6">

          {/* DESCRIPTION */}

          <div className="bg-white rounded-xl shadow border p-6">

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600"/>
              About Project
            </h2>

            <p className="text-gray-700 whitespace-pre-wrap">
              {projectData.description}
            </p>

          </div>

          {/* SKILLS */}

          {projectData.required_skills?.length > 0 && (

            <div className="bg-white rounded-xl shadow border p-6">

              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Code className="h-5 w-5 text-red-600"/>
                Required Skills
              </h2>

              <div className="flex flex-wrap gap-2">

                {projectData.required_skills.map((skill,i)=>(
                  <span
                    key={i}
                    className="px-3 py-1 bg-red-50 text-red-700 rounded border border-red-200"
                  >
                    {skill}
                  </span>
                ))}

              </div>

            </div>

          )}

        </div>

        {/* SIDEBAR */}

        <div className="space-y-6">

          <div className="bg-white rounded-xl shadow border p-6">

            {isMember ? (

              <Link to={`/projects/${projectId}/workspace`}>

                <button className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700">
                  Open Workspace
                </button>

              </Link>

            ) : hasApplied ? (

              <div className="text-blue-600 bg-blue-50 p-3 rounded border">
                Application Pending
              </div>

            ) : projectData.status === "recruiting" && spotsLeft > 0 ? (

              <button
                onClick={()=>setShowApplyModal(true)}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
              >
                Apply Now
              </button>

            ) : (

              <div className="text-gray-500 text-center">
                Not accepting applications
              </div>

            )}

          </div>

        </div>

      </div>

      {/* APPLY MODAL */}

      {showApplyModal && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

          <div className="bg-white rounded-xl p-6 max-w-lg w-full">

            <h2 className="text-xl font-bold mb-4">Apply to Join</h2>

            <textarea
              value={applicationMessage}
              onChange={(e)=>setApplicationMessage(e.target.value)}
              className="w-full border rounded-lg p-3 h-32"
              placeholder="Tell the team about yourself..."
            />

            <div className="flex gap-3 mt-4">

              <button
                onClick={()=>setShowApplyModal(false)}
                className="flex-1 border rounded-lg py-2"
              >
                Cancel
              </button>

              <button
                onClick={handleApply}
                className="flex-1 bg-red-600 text-white rounded-lg py-2"
              >
                Submit
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default ProjectDetailsPage;