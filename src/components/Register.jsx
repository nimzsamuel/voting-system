import { useState } from 'react'
import { getStudents, saveStudents } from '../utils/storage'

const FACULTY_MAP = {
  FNAS: 'Faculty of Natural & Applied Sciences',
  FET:  'Faculty of Engineering & Technology',
  FMS:  'Faculty of Management Sciences',
  FLA:  'Faculty of Law & Arts',
  FSS:  'Faculty of Social Sciences',
  FED:  'Faculty of Education',
}

function Register({ setPage }) {
  const [matricNumber, setMatricNumber] = useState('')
  const [foundStudent, setFoundStudent] = useState(null)
  const [matricError, setMatricError] = useState('')
  const [searching, setSearching] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // ── Step 1: Search matric ─────────────────────────────────────────────────
  const handleMatricSearch = () => {
    setMatricError('')
    setFoundStudent(null)

    if (!matricNumber.trim()) {
      setMatricError('Please enter your matriculation number.')
      return
    }

    // Validate PLASU format
    const plasuFormat = /^PLASU\/\d{4}\/[A-Z]+\/\d+$/i
    if (!plasuFormat.test(matricNumber.trim())) {
      setMatricError('❌ Invalid format. Matric number must follow the format: PLASU/YEAR/FACULTY/NUMBER  e.g. PLASU/2022/FNAS/001')
      return
    }

    setSearching(true)

    setTimeout(() => {
      const students = getStudents()
      const student = students.find(
        s => s.matricNumber.toUpperCase() === matricNumber.trim().toUpperCase()
      )

      if (!student) {
        setMatricError('❌ Matric number not found in our enrollment database. Only enrolled PLASU students can register. Contact your admin if you believe this is a mistake.')
        setSearching(false)
        return
      }

      if (student.isRegistered && student.password) {
        setMatricError('✅ This matric number is already registered. Please login instead.')
        setSearching(false)
        return
      }

      setFoundStudent(student)
      setSearching(false)
    }, 700)
  }

  // ── Step 2: Set password ──────────────────────────────────────────────────
  const handleRegister = () => {
    const newErrors = {}
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    setTimeout(() => {
      const students = getStudents()
      const updatedStudents = students.map(s =>
        s.matricNumber.toUpperCase() === foundStudent.matricNumber.toUpperCase()
          ? { ...s, password, isRegistered: true }
          : s
      )
      saveStudents(updatedStudents)
      setLoading(false)
      setSuccess(true)
    }, 900)
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="auth-page">
        <AuthHeader />
        <main className="auth-body">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: 'var(--success)', marginBottom: '10px' }}>Registration Successful!</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '6px' }}>
              Welcome, <strong>{foundStudent?.fullName}</strong>!
            </p>
            <p style={{ color: 'var(--gray-600)', marginBottom: '28px', fontSize: '0.88rem' }}>
              Your account has been activated. You can now log in and cast your vote.
            </p>
            <button className="btn btn-primary" onClick={() => setPage('login')}>
              🔐 Proceed to Login
            </button>
          </div>
        </main>
        <AuthFooter />
      </div>
    )
  }

  return (
    <div className="auth-page">
      <AuthHeader />

      <main className="auth-body">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="card-icon">📝</div>
            <h2>Student Registration</h2>
            <p>Enter your PLASU matric number to verify your enrollment</p>
          </div>

          {/* ── Step 1: Matric Search ── */}
          {!foundStudent && (
            <>
              <div className="alert alert-info">
                🔒 Only enrolled PLASU students can register. Your matric number must be in the system.
              </div>

              <div className="form-group">
                <label>Matriculation Number <span>*</span></label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="e.g. PLASU/2022/FNAS/001"
                    value={matricNumber}
                    onChange={e => {
                      setMatricNumber(e.target.value.toUpperCase())
                      setMatricError('')
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleMatricSearch()}
                    className={matricError ? 'error' : ''}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ width: 'auto', padding: '0 20px', whiteSpace: 'nowrap' }}
                    onClick={handleMatricSearch}
                    disabled={searching}
                  >
                    {searching ? <span className="spinner"></span> : '🔍 Search'}
                  </button>
                </div>

                {/* Format hint */}
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '6px' }}>
                  Format: <strong>PLASU / YEAR / FACULTY / NUMBER</strong> — e.g. PLASU/2022/FNAS/001
                </p>

                {matricError && (
                  <div style={{ marginTop: '10px' }}>
                    <p className="field-error">{matricError}</p>
                    {matricError.includes('already registered') && (
                      <button
                        onClick={() => setPage('login')}
                        style={{ marginTop: '6px', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem' }}
                      >
                        Go to Login →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Faculty legend */}
              <div className="faculty-legend">
                <div className="faculty-legend-title">📚 Faculty Codes</div>
                <div className="faculty-legend-grid">
                  {Object.entries(FACULTY_MAP).map(([code, name]) => (
                    <div key={code} className="faculty-legend-item">
                      <span className="faculty-code">{code}</span>
                      <span className="faculty-name">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Auto-filled Info + Password ── */}
          {foundStudent && (
            <>
              <div className="found-student-card">
                <div className="found-student-check">✅</div>
                <div className="found-student-info">
                  <div className="found-student-name">{foundStudent.fullName}</div>
                  <div className="found-student-meta">
                    {foundStudent.matricNumber}
                  </div>
                  <div className="found-student-meta">
                    {FACULTY_MAP[foundStudent.faculty] || foundStudent.faculty} · {foundStudent.department} · {foundStudent.level}L
                  </div>
                </div>
                <button
                  className="found-student-change"
                  onClick={() => {
                    setFoundStudent(null)
                    setMatricNumber('')
                    setErrors({})
                  }}
                >
                  ✖ Change
                </button>
              </div>

              <div className="alert alert-success">
                🎓 Enrollment verified! Please set a password to activate your account.
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Set Password <span>*</span></label>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <p className="field-error">{errors.password}</p>}
                </div>

                <div className="form-group">
                  <label>Confirm Password <span>*</span></label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: '' })) }}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner"></span> Activating account...</>
                  : '✅ Activate My Account'}
              </button>
            </>
          )}

          <div className="auth-footer-text">
            Already have an account?{' '}
            <button onClick={() => setPage('login')}>Login here</button>
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  )
}

function AuthHeader() {
  return (
    <header className="auth-header">
      <div className="logo-icon">🎓</div>
      <div className="logo-text">
        <h1>Plateau State University — Student Union</h1>
        <p>Online Voting System — 2024/2025 Elections</p>
      </div>
    </header>
  )
}

function AuthFooter() {
  return (
    <footer className="auth-page-footer">
      © 2024 Plateau State University Student Union. All rights reserved.
    </footer>
  )
}

export default Register