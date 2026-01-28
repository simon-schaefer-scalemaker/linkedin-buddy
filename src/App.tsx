import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/AppLayout'

// Pages
import { Dashboard } from '@/components/dashboard/Dashboard'
import { CalendarPage } from '@/pages/calendar/CalendarPage'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import { Settings } from '@/components/settings/Settings'

// Boards
import { BoardsPage } from '@/pages/boards/BoardsPage'
import { PostEditor } from '@/pages/boards/PostEditor'

// Brainstorming (Tracking)
import { BrainstormingPage, BrainstormingProfileDetail } from '@/pages/tracking/BrainstormingPage'

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Boards - Unified platform boards */}
            <Route path="/boards" element={<BoardsPage />} />
            <Route path="/boards/:platform/:id" element={<PostEditor />} />
            
            {/* Legacy board routes - redirect to new boards page */}
            <Route path="/linkedin" element={<Navigate to="/boards?platform=linkedin" replace />} />
            <Route path="/youtube" element={<Navigate to="/boards?platform=youtube" replace />} />
            <Route path="/instagram" element={<Navigate to="/boards?platform=instagram" replace />} />
            <Route path="/skool" element={<Navigate to="/boards?platform=skool" replace />} />
            
            {/* Brainstorming (Tracking) */}
            <Route path="/brainstorming" element={<BrainstormingPage />} />
            <Route path="/brainstorming/:platform/:id" element={<BrainstormingProfileDetail />} />
            
            {/* Legacy tracking routes - redirect to new brainstorming page */}
            <Route path="/tracking/youtube" element={<Navigate to="/brainstorming?platform=youtube" replace />} />
            <Route path="/tracking/instagram" element={<Navigate to="/brainstorming?platform=instagram" replace />} />
            <Route path="/tracking/linkedin" element={<Navigate to="/brainstorming?platform=linkedin" replace />} />
            
            {/* Calendar */}
            <Route path="/calendar" element={<CalendarPage />} />
            
            {/* Analytics */}
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/analytics/:platform" element={<AnalyticsPage />} />
            
            {/* Settings */}
            <Route path="/settings" element={<Settings />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  )
}

export default App
