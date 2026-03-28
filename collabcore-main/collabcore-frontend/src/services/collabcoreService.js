import { supabase } from '../config/supabase';

export const getCurrentProfile = async () => {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error) throw error;
  return data;
};

export const createProject = async (payload) => {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('You must be logged in');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...payload,
      owner_id: profile.id,
      current_team_size: 1,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('project_members').insert({
    project_id: data.id,
    user_id: profile.id,
    role: 'owner',
  });

  return data;
};

export const listProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(id, full_name, university)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getProjectById = async (projectId) => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(id, full_name, university, bio, skills)
    `)
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
};

export const applyToProject = async ({ projectId, message }) => {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('You must be logged in');

  const { data, error } = await supabase
    .from('project_applications')
    .insert({
      project_id: projectId,
      user_id: profile.id,
      message,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getProjectApplications = async (projectId) => {
  const { data, error } = await supabase
    .from('project_applications')
    .select(`
      *,
      user:profiles(id, full_name, university, bio, skills)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const acceptApplication = async (application) => {
  const { error: updateError } = await supabase
    .from('project_applications')
    .update({ status: 'accepted' })
    .eq('id', application.id);

  if (updateError) throw updateError;

  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: application.project_id,
      user_id: application.user_id,
      role: 'member',
    });

  if (memberError) throw memberError;

  const { data: project } = await supabase
    .from('projects')
    .select('current_team_size')
    .eq('id', application.project_id)
    .single();

  await supabase
    .from('projects')
    .update({ current_team_size: (project?.current_team_size || 0) + 1 })
    .eq('id', application.project_id);
};

export const getProjectMembers = async (projectId) => {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      user:profiles(id, full_name, university, bio, skills, avatar_url)
    `)
    .eq('project_id', projectId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const uploadProjectFile = async (projectId, file) => {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('You must be logged in');

  const filePath = `${projectId}/${Date.now()}-${file.name}`;

  const { error: storageError } = await supabase.storage
    .from('project-files')
    .upload(filePath, file, { upsert: false });

  if (storageError) throw storageError;

  const { data: publicData } = supabase.storage
    .from('project-files')
    .getPublicUrl(filePath);

};