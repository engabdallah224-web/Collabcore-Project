import { motion } from 'framer-motion';
import { Users, Clock, Tag, Heart, Bookmark, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCategory, formatStatus } from '../../utils/helpers';

const ProjectCard = ({ project }) => {
  const {
    id,
    title,
    description,
    owner,
    required_skills = [],
    team_size_limit,
    current_team_size = 0,
    status,
    created_at,
    tags = []
  } = project;

  const spotsLeft = team_size_limit - current_team_size;

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Status Badge */}
      <div className="bg-red-600 px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          {status === 'recruiting' ? '🚀 ' : '✅ '}{formatStatus(status)}
        </span>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-white/80 hover:text-white"
          >
            <Heart className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-white/80 hover:text-white"
          >
            <Bookmark className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="p-6">
        {/* Title */}
        <Link to={`/projects/${id}`}>
          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-red-600 transition-all cursor-pointer">
            {title}
          </h3>
        </Link>

        {/* Owner */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-semibold">
            {owner?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{owner?.full_name || 'Unknown'}</p>
            <p className="text-xs text-gray-500">{owner?.university || 'University'}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {description}
        </p>

        {/* Skills Required */}
        {required_skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {required_skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200"
                >
                  {skill}
                </span>
              ))}
              {required_skills.length > 4 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  +{required_skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="font-medium">
                {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <Link to={`/projects/${id}`}>
            <motion.button
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700  transition-all"
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              View Details
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;

