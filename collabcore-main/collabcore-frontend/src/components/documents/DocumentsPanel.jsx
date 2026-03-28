import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../services/api';
import { FileText, Plus, Trash2, Edit, Folder, FolderPlus, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentsPanel({ projectId }) {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', projectId, currentFolder],
    queryFn: async () => {
      const response = await documentAPI.getDocuments(projectId, currentFolder);
      return response.data;
    },
  });

  // Fetch folders
  const { data: foldersData } = useQuery({
    queryKey: ['folders', projectId],
    queryFn: async () => {
      const response = await documentAPI.getFolders(projectId);
      return response.data;
    },
  });

  const documents = documentsData?.documents || [];
  const folders = foldersData?.folders || [];

  if (selectedDocument) {
    return (
      <DocumentEditor
        documentId={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        projectId={projectId}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Collaborate on documents with your team
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Folder</span>
          </button>
          <button
            onClick={() => setShowNewDocModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {currentFolder && (
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => setCurrentFolder(null)}
            className="text-red-600 hover:text-red-700"
          >
            All Documents
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 dark:text-white">
            {folders.find(f => f.id === currentFolder)?.name}
          </span>
        </div>
      )}

      {/* Folders */}
      {!currentFolder && folders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.filter(f => !f.parent_id).map((folder) => (
            <motion.button
              key={folder.id}
              onClick={() => setCurrentFolder(folder.id)}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Folder className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {folder.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(folder.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Documents */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        {documentsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Documents Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first document to get started
            </p>
            <button
              onClick={() => setShowNewDocModal(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Document</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                document={doc}
                onClick={() => setSelectedDocument(doc.id)}
                onDelete={() => {
                  queryClient.invalidateQueries(['documents', projectId]);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewDocModal && (
        <NewDocumentModal
          projectId={projectId}
          folderId={currentFolder}
          onClose={() => setShowNewDocModal(false)}
          onSuccess={(docId) => {
            setShowNewDocModal(false);
            queryClient.invalidateQueries(['documents', projectId]);
            setSelectedDocument(docId);
          }}
        />
      )}

      {showNewFolderModal && (
        <NewFolderModal
          projectId={projectId}
          onClose={() => setShowNewFolderModal(false)}
          onSuccess={() => {
            setShowNewFolderModal(false);
            queryClient.invalidateQueries(['folders', projectId]);
          }}
        />
      )}
    </div>
  );
}

// Document Item Component
function DocumentItem({ document, onClick, onDelete }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => documentAPI.deleteDocument(document.id),
    onSuccess: () => {
      onDelete();
    },
  });

  return (
    <motion.div
      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
      onClick={onClick}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {document.title}
            </h3>
            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
              <span>
                By {document.creator?.full_name || 'Unknown'}
              </span>
              <span>•</span>
              <span>
                Modified {new Date(document.updated_at).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>v{document.version}</span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this document?')) {
              deleteMutation.mutate();
            }
          }}
          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Document Editor Component
function DocumentEditor({ documentId, onClose, projectId }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch document
  const { data: docData, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const response = await documentAPI.getDocument(documentId);
      return response.data;
    },
  });

  // Update state when document data loads
  useEffect(() => {
    if (docData?.document) {
      setContent(docData.document.content || '');
      setTitle(docData.document.title || '');
      setHasChanges(false);
    }
  }, [docData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data) => documentAPI.updateDocument(documentId, data),
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries(['document', documentId]);
      queryClient.invalidateQueries(['documents', projectId]);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ title, content });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasChanges(true);
            }}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white flex-1"
            placeholder="Untitled Document"
          />
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saveMutation.isPending ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-800">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setHasChanges(true);
          }}
          className="w-full h-full p-6 bg-white dark:bg-gray-800 border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white resize-none text-sm leading-relaxed"
          placeholder="Start writing..."
          style={{ minHeight: '100%' }}
        />
      </div>

      {/* Editor Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Version {docData?.document?.version}</span>
        <span>
          Last edited by {docData?.document?.creator?.full_name} on{' '}
          {new Date(docData?.document?.updated_at).toLocaleString()}
        </span>
        <span>{content.length} characters</span>
      </div>
    </div>
  );
}

// New Document Modal
function NewDocumentModal({ projectId, folderId, onClose, onSuccess }) {
  const [title, setTitle] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => documentAPI.createDocument(projectId, data),
    onSuccess: (response) => {
      onSuccess(response.data.document.id);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      content: '',
      folder_id: folderId,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          New Document
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Document"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
              autoFocus
            />
          </div>

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
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// New Folder Modal
function NewFolderModal({ projectId, onClose, onSuccess }) {
  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => documentAPI.createFolder(projectId, data),
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ name });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          New Folder
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Folder"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
              autoFocus
            />
          </div>

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
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

