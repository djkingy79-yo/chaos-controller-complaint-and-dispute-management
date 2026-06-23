import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import Layout from '@/components/Layout';
import Welcome from '@/pages/Welcome';
import Dashboard from '@/pages/Dashboard';
import CaseList from '@/pages/CaseList';
import NewCase from '@/pages/NewCase';
import CaseDetail from '@/pages/CaseDetail';
import DeadlineWarRoom from '@/pages/DeadlineWarRoom';
import SmartChecklist from '@/pages/SmartChecklist';
import Directories from '@/pages/Directories';

import AdminDashboard from '@/pages/AdminDashboard';
import Payments from '@/pages/Payments';
import HelpGuide from '@/pages/HelpGuide';
import TemplateLibrary from '@/pages/TemplateLibrary';
import QnA from '@/pages/QnA';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import SharedCasePortal from '@/pages/SharedCasePortal';
import SamplePreviews from '@/pages/SamplePreviews';
import MerchantLogin from '@/pages/MerchantLogin';
import MerchantPortal from '@/pages/MerchantPortal';
import MerchantResponsesDashboard from '@/pages/MerchantResponsesDashboard';
import Notifications from '@/pages/Notifications';
import UserSettings from '@/pages/UserSettings';
import CaseTemplates from '@/pages/CaseTemplates';
import CalendarView from '@/pages/CalendarView';
import CalendarSync from '@/pages/CalendarSync';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<CaseList />} />
          <Route path="/new-case" element={<NewCase />} />
          <Route path="/case/:id" element={<CaseDetail />} />
          <Route path="/deadlines" element={<DeadlineWarRoom />} />
          <Route path="/checklist" element={<SmartChecklist />} />
          <Route path="/directories" element={<Directories />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/help" element={<HelpGuide />} />
          <Route path="/templates" element={<TemplateLibrary />} />
          <Route path="/qna" element={<QnA />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/sample-previews" element={<SamplePreviews />} />
          <Route path="/merchant-responses" element={<MerchantResponsesDashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/templates" element={<CaseTemplates />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/calendar-sync" element={<CalendarSync />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        {/* Public routes — completely outside auth, render immediately */}
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/shared-case/:token" element={<SharedCasePortal />} />
          <Route path="/merchant-login" element={<MerchantLogin />} />
          <Route path="/merchant-portal" element={<MerchantPortal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Auth wrapper for all protected routes */}
          <Route path="/*" element={
            <AuthProvider>
              <AuthenticatedApp />
            </AuthProvider>
          } />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  )
}

export default App