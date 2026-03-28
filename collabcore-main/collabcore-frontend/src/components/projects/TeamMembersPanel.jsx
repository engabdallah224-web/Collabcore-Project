import { useQuery } from '@tanstack/react-query';
import { getProjectMembers } from '../../services/collabcoreService';

const TeamMembersPanel = ({ projectId }) => {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Team Members</h3>

      {isLoading ? (
        <p className="text-gray-500">Loading members...</p>
      ) : members.length === 0 ? (
        <p className="text-gray-500">No members yet.</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 border rounded-xl px-4 py-3">
              <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                {member.user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{member.user?.full_name}</p>
                <p className="text-sm text-gray-500">{member.user?.university}</p>
              </div>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm capitalize">{member.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamMembersPanel;