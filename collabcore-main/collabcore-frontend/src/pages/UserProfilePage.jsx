import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Award, Briefcase, Code, ArrowLeft, Mail } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects');

  // Mock user data - would come from API
  const user = {
    id: userId,
    full_name: 'Alex Kumar',
    university: 'UC Berkeley',
    bio: 'Full-stack developer passionate about blockchain technology and decentralized applications. Currently working on several innovative projects.',
    profile_picture: null,
    skills: ['Blockchain', 'Solidity', 'React', 'Node.js', 'Web3', 'Smart Contracts'],
    role: 'student',
    joined_date: '2023-09-15',
    // Note: Email and other private info not shown
  };

  const publicProjects = [
    {
      id: 1,
      title: 'Blockchain Voting System',
      role: 'Project Leader',
      status: 'Active',
      team_size: 4,
      description: 'Building a secure voting platform using blockchain'
    },
    {
      id: 2,
      title: 'DeFi Education Platform',
      role: 'Smart Contract Developer',
      status: 'Completed',
      team_size: 6,
      description: 'Educational platform for learning DeFi concepts'
    },
    {
      id: 3,
      title: 'NFT Marketplace',
      role: 'Frontend Developer',
      status: 'Active',
      team_size: 5,
      description: 'Marketplace for student-created digital art'
    }
  ];

  const endorsements = [
    { skill: 'Blockchain', count: 8 },
    { skill: 'Solidity', count: 6 },
    { skill: 'React', count: 10 }
  ];

  return (
    <div className="min-h-screen bg-red-600 transition-colors">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 mb-6 transition-all"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </motion.button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6 transition-colors"
        >
          {/* Cover Image */}
          <div className="h-32 bg-red-600 relative">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="px-8 pb-8">
            {/* Profile Picture & Basic Info */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                {/* Avatar */}
                <motion.div
                  className="h-32 w-32 rounded-2xl bg-red-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  {user.full_name.charAt(0)}
                </motion.div>

                <div className="mb-4 md:mb-0">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{user.full_name}</h1>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {user.university}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since {new Date(user.joined_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 bg-red-600 text-red-700 text-sm font-semibold rounded-full border border-red-200">
                      {user.role === 'project_leader' ? '🚀 Project Leader' : '🎓 Student'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Button - Limited */}
              <Link to={`/messages/${userId}`}>
                <motion.button
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold  shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mail className="h-5 w-5" />
                  Send Message
                </motion.button>
              </Link>
            </div>

            {/* Bio */}
            <p className="text-gray-700 mb-6 max-w-3xl">{user.bio}</p>

            {/* Stats - Limited */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-600 rounded-xl">
                <div className="text-2xl font-bold text-red-700">{publicProjects.length}</div>
                <div className="text-sm text-gray-600">Projects</div>
              </div>
              <div className="text-center p-4 bg-red-600 rounded-xl">
                <div className="text-2xl font-bold text-red-700">{user.skills.length}</div>
                <div className="text-sm text-gray-600">Skills</div>
              </div>
              <div className="text-center p-4 bg-red-600 rounded-xl">
                <div className="text-2xl font-bold text-pink-700">{endorsements.length}</div>
                <div className="text-sm text-gray-600">Endorsements</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Skills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Skills */}
            <div className="bg-white rounded-2xl shadow-md p-6 transition-colors">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                <Code className="h-6 w-6 text-red-600" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <motion.span
                    key={index}
                    className="px-3 py-1.5 bg-red-600 text-red-700 text-sm font-medium rounded-full border border-red-200"
                    whileHover={{ scale: 1.1 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Endorsements - Limited */}
            <div className="bg-white rounded-2xl shadow-md p-6 transition-colors">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                <Award className="h-6 w-6 text-red-600" />
                Top Endorsements
              </h2>
              <div className="space-y-3">
                {endorsements.map((endorsement, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-600 rounded-xl"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <span className="font-semibold text-gray-900">{endorsement.skill}</span>
                    <span className="text-red-700 font-bold">{endorsement.count}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Projects */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-colors">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`flex-1 px-6 py-4 font-semibold transition-all ${
                    activeTab === 'projects'
                      ? 'bg-red-600 text-red-700 border-b-2 border-red-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Briefcase className="inline h-5 w-5 mr-2" />
                  Public Projects ({publicProjects.length})
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {publicProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      className="p-4 border-2 border-gray-100 rounded-xl hover:border-red-200 hover:bg-red-600  transition-all cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1">{project.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          project.status === 'Active' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="font-medium text-red-600">{project.role}</span>
                        <span>Team of {project.team_size}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

