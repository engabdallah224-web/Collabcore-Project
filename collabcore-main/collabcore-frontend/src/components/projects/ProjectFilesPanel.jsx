import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProjectFiles, uploadProjectFile } from '../../services/collabcoreService';

const ProjectFilesPanel = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: () => getProjectFiles(projectId),
    enabled: !!projectId,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Select a file first');
      return uploadProjectFile(projectId, file);
    },
    onSuccess: () => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
    },
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Project Files</h3>

      <div className="flex gap-3 mb-5">
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="flex-1 border rounded-xl px-4 py-3" />
        <button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !file} className="px-5 py-3 bg-red-600 text-white rounded-xl font-semibold disabled:opacity-50">
          {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading files...</p>
      ) : files.length === 0 ? (
        <p className="text-gray-500">No files uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {files.map((item) => (
            <div key={item.id} className="flex items-center justify-between border rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{item.file_name}</p>
                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <a href={item.file_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectFilesPanel;