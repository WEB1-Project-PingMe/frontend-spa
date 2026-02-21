import './App.css'
import ChatLayoutGrid from './components/chat-layout'
import ChatWindow from './components/chat-window'
import { ThemeProvider } from './components/theme-provider'
import Login from './components/login'
import ProtectedRoute from './components/protected-route'
import ExploreComp from './components/explore'
import Register from './components/register'
import GroupsChat from './components/groups-chat'
import { Toaster } from './components/ui/sonner'
import { BrowserRouter } from 'react-router'
import { Route, Routes } from 'react-router-dom'
import { useState } from 'react'

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  const handleAuthentication = (status: boolean) => {
    setAuthenticated(status);
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Login tryAuth={handleAuthentication} />} />
          <Route path="/login" element={<Login tryAuth={handleAuthentication} />} />
          <Route path="/register" element={<Register />} />
          test12345
          <Route element={<ProtectedRoute isAuthenticated={authenticated} />}>
            <Route path="chats" element={<ChatLayoutGrid />}>
              <Route path=":uuid" element={<ChatWindow />} />
            </Route>
            <Route path="explore" element={<ChatLayoutGrid />}>
              <Route path=":uuid" element={<ExploreComp />} />
            </Route>
            <Route path="groups" element={<ChatLayoutGrid />}>
              <Route path=":uuid" element={<GroupsChat />} />
            </Route>
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
