import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { ProjectEditor } from './pages/ProjectEditor'
import { ScreenshotFactory } from './pages/ScreenshotFactory'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/editor"
          element={
            <Layout>
              <ProjectEditor />
            </Layout>
          }
        />
        <Route
          path="/screenshots"
          element={
            <Layout>
              <ScreenshotFactory />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
