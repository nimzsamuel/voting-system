import { useState } from 'react'
import { getStudents, getAdmin, setSession } from '../utils/storage'

function Login({ setPage, setCurrentUser }) {
  const [matricNumber, setMatricNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setError('')

    if (!matricNumber.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)

    setTimeout(() => {
      // Check admin login
      const admin = getAdmin()
      if (matricNumber === admin.username && password === admin.password) {
        const adminUser = { role: 'admin', username: admin.username }
        setSession(adminUser)
        setCurrentUser(adminUser)
        setPage('admin')
        setLoading(false)
        return
      }

      // Check student login
      const students = getStudents()
      const student = students.find(
        (s) => s.matricNumber === matricNumber.trim() && s.password === password
      )

      if (!student) {
        // Check if matric exists but wrong password
        const matricExists = students.find(s => s.matricNumber === matricNumber.trim())
        if (matricExists) {
          setError('Incorrect password. Please try again.')
        } else {
          setError('Student record not found. Please register to continue.')
        }
        setLoading(false)
        return
      }

      // Successful student login
      const sessionUser = { ...student, role: 'student' }
      setSession(sessionUser)
      setCurrentUser(sessionUser)
      setPage('ballot')
      setLoading(false)
    }, 800)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="auth-page">
      {/* Header */}
      <header className="auth-header">
        <div className="logo-icon">🎓</div>
        <div className="logo-text">
          <h1>PLASU Student Union</h1>
          <p>Online Voting System — 2025/2026 Elections</p>
        </div>
      </header>

      {/* Body */}
      <main className="auth-body">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="card-icon">🔐</div>
            <h2>Student Login</h2>
            <p>Enter your matriculation number and password to access the ballot</p>
          </div>

          {error && (
            <div className="alert alert-error">
              ⚠️ {error}
              {error.includes('register') && (
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                  onClick={() => setPage('register')}
                >
                  Register Now
                </button>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Matriculation Number <span>*</span></label>
            <input
              type="text"
              placeholder="e.g. PLASU/2025/FNAS/0000"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              onKeyDown={handleKeyDown}
              className={error && !matricNumber ? 'error' : ''}
            />
          </div>

          <div className="form-group">
            <label>Password <span>*</span></label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className={error && !password ? 'error' : ''}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <><span className="spinner"></span> Verifying...</> : '🗳️ Proceed to Vote'}
          </button>

          <div className="divider">or</div>

          <div className="alert alert-info">
            🆕 New student? Your record may not be in the system yet.
          </div>

          <button
            className="btn btn-outline"
            onClick={() => setPage('register')}
          >
            📝 Register as New Student
          </button>

          <div className="auth-footer-text" style={{ marginTop: '20px' }}>
            Admin access? Use your superuser credentials above.
          </div>
        </div>
      </main>

      <footer className="auth-page-footer">
        © 2026 Plateau State University Student Union. All rights reserved. Powered by UniVote.
      </footer>
    </div>
  )
}

export default Login