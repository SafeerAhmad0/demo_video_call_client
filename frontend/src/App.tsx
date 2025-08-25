import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Navbar from "./components/Navbar"
import Home from "./pages/Homepage"
import Dashboard from "./pages/Dashboard"
import InfoForm from "./pages/Inform"
import FormSubmissions from "./pages/FormSubmissions"
import MultiStepForm from "./pages/MultiStepForm"
import PreviewPage from "./pages/PreviewPage"
import VideoVerification from "./pages/VideoVerification"
import MeetingPage from "./pages/MeetingPage"
import CreateClaimForm from "./pages/CreateClaimForm"

export default function App() {
  return (
    <AuthProvider>
      <div>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-claim" 
            element={
              <ProtectedRoute>
                <CreateClaimForm onBack={() => window.history.back()} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/info-form" 
            element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main style={{ padding: 16 }}>
                    <InfoForm />
                  </main>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/preview-page" 
            element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main style={{ padding: 16 }}>
                    <PreviewPage />
                  </main>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/video-verification" 
            element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main style={{ padding: 16 }}>
                    <VideoVerification />
                  </main>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/multi-step-form" 
            element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main style={{ padding: 16 }}>
                    <MultiStepForm />
                  </main>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/submissions" 
            element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main style={{ padding: 16 }}>
                    <FormSubmissions />
                  </main>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/meeting" 
            element={
              <ProtectedRoute>
                <MeetingPage />
              </ProtectedRoute>
            } 
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
