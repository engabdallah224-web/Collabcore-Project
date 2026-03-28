import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vcsAPI } from '../../services/api';
import { GitBranch, GitCommit, GitPullRequest, Link, Trash2, ExternalLink, Calendar, User, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RepositoryPanel({ projectId, isOwner }) {
  const [activeTab, setActiveTab] = useState('commits');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch connected repository
  const { data: repoData, isLoading: repoLoading } = useQuery({
    queryKey: ['repository', projectId],
    queryFn: async () => {
      const response = await vcsAPI.getRepository(projectId);
      return response.data;
    },
  });

  const repository = repoData?.repository;

  // Fetch commits if repository is connected
  const { data: commitsData, isLoading: commitsLoading } = useQuery({
    queryKey: ['commits', projectId],
    queryFn: async () => {
      const response = await vcsAPI.getCommits(projectId, { per_page: 20 });
      return response.data;
    },
    enabled: !!repository,
  });

  // Fetch pull requests if repository is connected
  const { data: prsData, isLoading: prsLoading } = useQuery({
    queryKey: ['pullRequests', projectId],
    queryFn: async () => {
      const response = await vcsAPI.getPullRequests(projectId, { state: 'all', per_page: 20 });
      return response.data;
    },
    enabled: !!repository,
  });

  // Disconnect repository mutation
  const disconnectMutation = useMutation({
    mutationFn: () => vcsAPI.disconnectRepository(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries(['repository', projectId]);
      queryClient.invalidateQueries(['commits', projectId]);
      queryClient.invalidateQueries(['pullRequests', projectId]);
    },
  });

  if (repoLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="text-center py-12">
        <GitBranch className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Repository Connected
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Connect a GitHub or GitLab repository to see commits and pull requests
        </p>
        {isOwner && (
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Connect Repository
          </button>
        )}
        
        {showConnectModal && (
          <ConnectRepositoryModal
            projectId={projectId}
            onClose={() => setShowConnectModal(false)}
            onSuccess={() => {
              setShowConnectModal(false);
              queryClient.invalidateQueries(['repository', projectId]);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Repository Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <GitBranch className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {repository.repo_owner}/{repository.repo_name}
                </h3>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                  {repository.provider}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Branch: <span className="font-medium">{repository.branch}</span>
              </p>
              <a
                href={repository.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-red-600 hover:text-red-700 mt-2"
              >
                View on {repository.provider === 'github' ? 'GitHub' : 'GitLab'}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Disconnect Repository"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('commits')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'commits'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <GitCommit className="h-4 w-4" />
                <span>Commits</span>
                {commitsData?.commits && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                    {commitsData.commits.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('pulls')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pulls'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <GitPullRequest className="h-4 w-4" />
                <span>Pull Requests</span>
                {prsData?.pull_requests && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                    {prsData.pull_requests.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'commits' && (
            <CommitsList
              commits={commitsData?.commits || []}
              isLoading={commitsLoading}
            />
          )}
          {activeTab === 'pulls' && (
            <PullRequestsList
              pullRequests={prsData?.pull_requests || []}
              isLoading={prsLoading}
            />
          )}
        </div>
      </div>

      {showConnectModal && (
        <ConnectRepositoryModal
          projectId={projectId}
          onClose={() => setShowConnectModal(false)}
          onSuccess={() => {
            setShowConnectModal(false);
            queryClient.invalidateQueries(['repository', projectId]);
          }}
        />
      )}
    </div>
  );
}

// Commits List Component
function CommitsList({ commits, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="text-center py-8">
        <GitCommit className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No commits found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {commits.map((commit, index) => (
        <motion.div
          key={commit.sha}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex-shrink-0">
            {commit.author.avatar_url ? (
              <img
                src={commit.author.avatar_url}
                alt={commit.author.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <User className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
              {commit.message.split('\n')[0]}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                {commit.author.name}
              </span>
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(commit.committed_at).toLocaleDateString()}
              </span>
              <span className="flex items-center font-mono">
                <Hash className="h-3 w-3 mr-1" />
                {commit.sha.substring(0, 7)}
              </span>
            </div>
          </div>
          <a
            href={commit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </motion.div>
      ))}
    </div>
  );
}

// Pull Requests List Component
function PullRequestsList({ pullRequests, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (pullRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <GitPullRequest className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No pull requests found</p>
      </div>
    );
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'merged':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {pullRequests.map((pr, index) => (
        <motion.div
          key={pr.number}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {pr.author.avatar_url ? (
                <img
                  src={pr.author.avatar_url}
                  alt={pr.author.username}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <User className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStateColor(pr.state)}`}>
                    {pr.state}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    #{pr.number}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {pr.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {pr.source_branch} → {pr.target_branch}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>{pr.author.username}</span>
                  <span>•</span>
                  <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                  {pr.comments_count > 0 && (
                    <>
                      <span>•</span>
                      <span>{pr.comments_count} comments</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Connect Repository Modal Component
function ConnectRepositoryModal({ projectId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    provider: 'github',
    repo_url: '',
    access_token: '',
    branch: 'main',
  });

  const connectMutation = useMutation({
    mutationFn: (data) => vcsAPI.connectRepository(projectId, data),
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    connectMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Connect Repository
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Provider
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="github"
                  checked={formData.provider === 'github'}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">GitHub</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="gitlab"
                  checked={formData.provider === 'gitlab'}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">GitLab</span>
              </label>
            </div>
          </div>

          {/* Repository URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repository URL
            </label>
            <input
              type="text"
              value={formData.repo_url}
              onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
              placeholder="https://github.com/owner/repo"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Branch
            </label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="main"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Access Token (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Personal Access Token (Optional)
            </label>
            <input
              type="password"
              value={formData.access_token}
              onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
              placeholder="For private repositories"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Required for private repositories. Will not be stored.
            </p>
          </div>

          {connectMutation.isError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {connectMutation.error?.response?.data?.detail || 'Failed to connect repository'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={connectMutation.isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {connectMutation.isPending ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

