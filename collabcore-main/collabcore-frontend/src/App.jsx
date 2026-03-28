import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DiscoveryPage from './pages/DiscoveryPage';
import ProfilePage from './pages/ProfilePage';
import CreateProjectPage from './pages/CreateProjectPage';
import EditProfilePage from './pages/EditProfilePage';
import MyProjectsPage from './pages/MyProjectsPage';
import SearchPage from './pages/SearchPage';
import ProjectWorkspace from './pages/ProjectWorkspace';
import ManageApplicationsPage from './pages/ManageApplicationsPage';
import UserProfilePage from './pages/UserProfilePage';
import TasksPage from './pages/TasksPage';
import MeetingAnalyticsPage from './pages/MeetingAnalyticsPage';
import ProjectSettingsPage from './pages/ProjectSettingsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import LoadingScreen from "./components/LoadingScreen";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
            <div className="min-h-screen flex flex-col bg-white">
              <Header />
              <main className="flex-grow">
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes - Placeholders for now */}
                <Route
                  path="/discovery"
                  element={
                    <ProtectedRoute>
                      <DiscoveryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <MyProjectsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/edit"
                  element={
                    <ProtectedRoute>
                      <EditProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/create"
                  element={
                    <ProtectedRoute>
                      <CreateProjectPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:projectId"
                  element={
                    <ProtectedRoute>
                      <ProjectDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:projectId/workspace"
                  element={
                    <ProtectedRoute>
                      <ProjectWorkspace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:projectId/applications"
                  element={
                    <ProtectedRoute>
                      <ManageApplicationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:projectId/tasks"
                  element={
                    <ProtectedRoute>
                      <TasksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:projectId/analytics"
                  element={
                    <ProtectedRoute>
                      <MeetingAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:projectId/settings"
                  element={
                    <ProtectedRoute>
                      <ProjectSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/:userId"
                  element={
                    <ProtectedRoute>
                      <UserProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <div className="container mx-auto px-4 py-8">
                        <h1 className="text-3xl font-bold">Notifications</h1>
                        <p className="text-gray-600 mt-2">Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  }
                />
                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
