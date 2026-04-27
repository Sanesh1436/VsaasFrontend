import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TicketProvider } from './context/TicketContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import AgentDashboardV2 from './pages/monitoring_agent/AgentDashboardV2';
import TeamLeadDashboardV2 from './pages/team_lead/TeamLeadDashboardV2';
import ContractWorkerDashboard from './pages/contract_worker/ContractWorkerDashboard';
import AllTickets from './pages/common/AllTickets';
import Settings from './pages/common/Settings';
import AnalyticsDashboard from './pages/team_lead/AnalyticsDashboard';
import AgentManagement from './pages/team_lead/AgentManagement';
import TicketAssignment from './pages/team_lead/TicketAssignment';
import Layout from './components/Layout';
import NotificationToast from './components/NotificationToast';
import LandingPage from './pages/common/LandingPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-main)' }}>
            <div className="text-center">
                <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}></div>
                <p style={{ color: 'var(--text-muted)' }} className="font-medium">Initializing WatchTower...</p>
            </div>
        </div>
    );
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
    return children;
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <TicketProvider>
                <Router>
                    <NotificationToast />
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login expectedRole="AGENT" />} />
                        <Route path="/login/admin" element={<Login expectedRole="TEAM_LEAD" />} />
                        <Route path="/login/agent" element={<Login expectedRole="AGENT" />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />

                        <Route path="/dashboard/agent" element={
                            <ProtectedRoute allowedRoles={['MONITORING_AGENT']}>
                                <Layout><AgentDashboardV2 /></Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard/worker" element={
                            <ProtectedRoute allowedRoles={['CONTRACT_WORKER']}>
                                <Layout><ContractWorkerDashboard /></Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard/tl" element={
                            <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                                <Layout><TeamLeadDashboardV2 /></Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="/analytics" element={
                            <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                                <Layout><AnalyticsDashboard /></Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="/agent-management" element={
                            <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                                <Layout><AgentManagement /></Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="/ticket-assignment" element={
                            <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                                <Layout><TicketAssignment /></Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="/tickets" element={
                            <ProtectedRoute>
                                <Layout><AllTickets /></Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="/settings" element={
                            <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                                <Layout><Settings /></Layout>
                            </ProtectedRoute>
                        } />
                    </Routes>
                </Router>
                </TicketProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
