import { useState } from 'react'
import { getSession } from './utils/storage'
import Login from './components/Login'
import Register from './components/Register'
import Ballot from './components/Ballot'
import AdminDashboard from './components/AdminDashboard'
import Results from './components/Results'

function App() {
  const [page, setPage] = useState('login')
  const [currentUser, setCurrentUser] = useState(getSession())

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <Login setPage={setPage} setCurrentUser={setCurrentUser} />
      case 'register':
        return <Register setPage={setPage} />
      case 'ballot':
        return <Ballot currentUser={currentUser} setPage={setPage} setCurrentUser={setCurrentUser} />
      case 'admin':
        return <AdminDashboard setPage={setPage} setCurrentUser={setCurrentUser} />
      case 'results':
        return <Results currentUser={currentUser} setPage={setPage} setCurrentUser={setCurrentUser} />
      default:
        return <Login setPage={setPage} setCurrentUser={setCurrentUser} />
    }
  }

  return (
    <div className="app">
      {renderPage()}
    </div>
  )
}

export default App