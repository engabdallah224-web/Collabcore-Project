import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Briefcase, Filter, MapPin, X, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { projectAPI, userAPI, searchAPI, staticAPI } from '../services/api';
import { formatStatus } from '../utils/helpers';

const SearchPage = () => {

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('projects');
  const [sortBy, setSortBy] = useState('relevance');

  const [filters, setFilters] = useState({
    skills: [],
    university: '',
    status: 'all',
    teamSize: 'all',
    experience: 'all'
  });

  const [recentSearches] = useState([
    'Machine Learning',
    'Web Development',
    'Mobile Apps'
  ]);

  const loadMoreRef = useRef(null);

  /* ---------------- PROJECT SEARCH ---------------- */

  const {
    data: projectsData,
    fetchNextPage: fetchNextProjects,
    hasNextPage: hasNextProjects,
    isFetchingNextPage: isFetchingNextProjects
  } = useInfiniteQuery({

    queryKey: ['search-projects', searchQuery, filters],

    queryFn: async ({ pageParam = null }) => {

      try {

        if (searchQuery) {

          const params = { limit: 20 };
          if (pageParam) params.cursor = pageParam;

          const res = await searchAPI.searchProjects(searchQuery, params);
          return res.data;

        } else {

          const params = { limit: 20 };
          if (filters.status !== 'all') params.status = filters.status;
          if (pageParam) params.cursor = pageParam;

          const res = await projectAPI.getProjects(params);
          return res.data;
        }

      } catch (err) {

        console.error("Project search error:", err);

        return {
          projects: [],
          next_cursor: null
        };
      }

    },

    getNextPageParam: (lastPage) => lastPage?.next_cursor || undefined,
    enabled: searchType === 'projects'
  });

  /* ---------------- USER SEARCH ---------------- */

  const { data: usersData } = useQuery({

    queryKey: ['search-users', searchQuery],

    queryFn: async () => {

      try {

        if (searchQuery) {
          const res = await searchAPI.searchUsers(searchQuery);
          return res.data;
        }

        const res = await userAPI.getUsers();
        return res.data;

      } catch (err) {

        console.error("User search error:", err);

        return { users: [] };
      }

    },

    enabled: searchType === 'users'
  });

  /* ---------------- FILTER DATA ---------------- */

  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      try {
        const res = await staticAPI.getSkills();
        return res.data;
      } catch {
        return { skills: [] };
      }
    }
  });

  const { data: universitiesData } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      try {
        const res = await staticAPI.getUniversities();
        return res.data;
      } catch {
        return { universities: [] };
      }
    }
  });

  const projectResults =
    projectsData?.pages?.flatMap(page => page.projects) || [];

  const userResults =
    usersData?.users || [];

  const popularSkills =
    skillsData?.skills?.slice(0, 6) || [];

  const universities =
    universitiesData?.universities?.slice(0, 5) || [];

  /* ---------------- INFINITE SCROLL ---------------- */

  useEffect(() => {

    if (searchType !== 'projects') return;

    const observer = new IntersectionObserver(

      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextProjects &&
          !isFetchingNextProjects
        ) {
          fetchNextProjects();
        }
      },

      { threshold: 0.1 }

    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };

  }, [searchType, hasNextProjects, isFetchingNextProjects]);

  /* ---------------- FILTER COUNT ---------------- */

  const activeFiltersCount =
    filters.skills.length +
    (filters.university !== '' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0);

  /* ---------------- PAGE ---------------- */

  return (

    <div className="min-h-screen bg-[#f3f3f3]">

      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* HEADER */}

        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Search & Discover
        </h1>

        {/* SEARCH BAR */}

        <div className="bg-white rounded-2xl shadow-md border p-6 mb-6">

          <div className="flex gap-3">

            <div className="flex-1 relative">

              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>

              <input
                value={searchQuery}
                onChange={(e)=>setSearchQuery(e.target.value)}
                placeholder="Search projects or people..."
                className="w-full pl-12 pr-4 py-3 border rounded-xl"
              />

            </div>

            <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold">
              Search
            </button>

          </div>

        </div>

        {/* RESULTS */}

        {searchType === "projects" && (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {projectResults.map(project => (

              <div
                key={project.id}
                className="bg-white rounded-xl shadow border p-5"
              >

                <Link to={`/projects/${project.id}`}>

                  <h3 className="text-xl font-semibold hover:text-red-600">
                    {project.title}
                  </h3>

                </Link>

                <p className="text-sm text-gray-600 mb-3">
                  {project.description}
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-500">

                  <Users className="h-4 w-4"/>

                  {project.current_team_size}/{project.team_size_limit}

                </div>

              </div>

            ))}

          </div>

        )}

        {/* LOAD MORE */}

        <div ref={loadMoreRef} className="py-8 text-center">

          {isFetchingNextProjects && (

            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="h-6 w-6 animate-spin text-red-600"/>
              Loading more projects...
            </div>

          )}

        </div>

      </div>

    </div>

  );

};

export default SearchPage;