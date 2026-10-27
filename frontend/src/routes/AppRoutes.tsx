import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { DataReviewPage } from '@/pages/DataReview/DataReviewPage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { RegisterPage } from '@/pages/Register/RegisterPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/data-review" element={<DataReviewPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
