import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CheckCrops from './pages/CheckCrops.jsx'
import DetectionMap from './pages/DetectionMap.jsx'
import MyReports from './pages/MyReports.jsx'
import NewReport from './pages/NewReport.jsx'
import Learn from './pages/Learn.jsx'
import ScanHistory from './pages/ScanHistory.jsx'
import Emergency from './pages/Emergency.jsx'
import Profile from './pages/Profile.jsx'
import AppLayout from './components/AppLayout.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-soft text-leaf-700 font-display text-2xl">Loading…</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login"    element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/check"      element={<CheckCrops />} />
        <Route path="/map"        element={<DetectionMap />} />
        <Route path="/reports"    element={<MyReports />} />
        <Route path="/reports/new" element={<NewReport />} />
        <Route path="/learn"      element={<Learn />} />
        <Route path="/history"    element={<ScanHistory />} />
        <Route path="/emergency"  element={<Emergency />} />
        <Route path="/profile"    element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
