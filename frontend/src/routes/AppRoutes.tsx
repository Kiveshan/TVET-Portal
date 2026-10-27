import { Navigate, Route, Routes } from 'react-router-dom';
import { UserPreviewPage } from '@/pages/Admin/UserPreview/UserPreviewPage';
import { UsersPage } from '@/pages/Admin/Users/UsersPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { DataReviewPage } from '@/pages/DataReview/DataReviewPage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { RegisterPage } from '@/pages/Register/RegisterPage';
import { PATHS } from './paths';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={PATHS.login} replace />} />
      <Route path={PATHS.login} element={<LoginPage />} />
      <Route path={PATHS.register} element={<RegisterPage />} />
      <Route
        path={PATHS.dashboard}
        element={
          <ProtectedRoute roles={['TVET', 'DHET']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/data-review" element={<DataReviewPage />} />
      <Route path="/admin" element={<Navigate to={PATHS.adminUsers} replace />} />
      <Route
        path={PATHS.adminUsers}
        element={
          <ProtectedRoute roles={['SYSTEM_ADMIN']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:userId"
        element={
          <ProtectedRoute roles={['SYSTEM_ADMIN']}>
            <UserPreviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={PATHS.login} replace />} />
    </Routes>
  );
}
