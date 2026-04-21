import { useState } from 'react'
import {
  getStudents,
  getAdmin,
  setSession,
  getVotes,
  recordFailedAttempt,
  isAccountLocked,
  resetLoginAttempts,
  generateOTP,
  saveOTP
} from '../utils/storage'

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
      // ── Admin login ──
      const admin = getAdmin()
      if (matricNumber.trim() === admin.username && password === admin.password) {
        const adminUser = { role: 'admin', username: admin.username }
        setSession(adminUser)
        setCurrentUser(adminUser)
        setPage('admin')
        setLoading(false)
        return
      }

      // ── Check lockout ──
      if (isAccountLocked(matricNumber.trim().toUpperCase())) {
        setError('🔒 This account has been permanently locked due to too many failed login attempts. Please contact the administrator.')
        setLoading(false)
        return
      }

      // ── Student login ──
      const students = getStudents()
      const student = students.find(
        s => s.matricNumber.toUpperCase() === matricNumber.trim().toUpperCase()
          && s.password === password
      )

      if (!student) {
        const matricExists = students.find(
          s => s.matricNumber.toUpperCase() === matricNumber.trim().toUpperCase()
        )

        if (matricExists && !matricExists.password) {
          setError('You have not registered yet. Please register to set your password first.')
          setLoading(false)
          return
        }

        // Record failed attempt
        const attempt = recordFailedAttempt(matricNumber.trim().toUpperCase())
        if (attempt.locked) {
          setError('🔒 Your account has been permanently locked after 3 failed attempts. Contact the administrator.')
        } else {
          const remaining = 3 - attempt.count
          if (matricExists) {
            setError(`❌ Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before your account is locked.`)
          } else {
            setError('❌ Matric number not found. Please register first or check your matric number.')
          }
        }
        setLoading(false)
        return
      }

      if (!student.isRegistered) {
        setError('Your account is not fully registered. Please complete registration first.')
        setLoading(false)
        return
      }

      // ── Success → Generate OTP ──
      resetLoginAttempts(matricNumber.trim().toUpperCase())
      const otp = generateOTP()
      saveOTP(otp, student.matricNumber)

      const sessionUser = { ...student, role: 'student' }
      setSession(sessionUser)
      setCurrentUser(sessionUser)
      setLoading(false)
      setPage('otp')
    }, 800)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="logo-icon">🎓</div>
        <div className="logo-text">
          <h1>Plateau State University — Student Union</h1>
          <p>Online Voting System — 2024/2025 Elections</p>
        </div>
      </header>

      <main className="auth-body">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="card-icon">🔐</div>
            <h2>Student Login</h2>
            <p>Enter your PLASU matric number and password to access the ballot</p>
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
              placeholder="e.g. PLASU/2020/FNAS/001"
              value={matricNumber}
              onChange={e => setMatricNumber(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="form-group">
            <label>Password <span>*</span></label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner"></span> Verifying...</>
              : '🔐 Login & Get OTP'}
          </button>

          <div className="divider">or</div>

          <div className="alert alert-info">
            🆕 First time? Enter your matric number on the registration page to get started.
          </div>

          <button className="btn btn-outline" onClick={() => setPage('register')}>
            📝 Register as New Student
          </button>

          <div className="auth-footer-text" style={{ marginTop: '20px' }}>
            Admin access? Use your superuser credentials above.
          </div>
        </div>
      </main>

      <footer className="auth-page-footer">
        © 2024 Plateau State University Student Union. All rights reserved.
      </footer>
    </div>
  )
}

export default Login