import { useState } from 'react'
import { getStudents, saveStudents } from '../utils/storage'

const DEPARTMENTS = [
  'Accounting', 'Architecture', 'Biology', 'Business Administration',
  'Chemical Engineering', 'Chemistry', 'Civil Engineering',
  'Computer Science', 'Economics', 'Electrical Engineering',
  'English', 'Law', 'Mass Communication', 'Mathematics',
  'Medicine', 'Nursing', 'Pharmacy', 'Physics',
  'Political Science', 'Psychology', 'Public Administration',
  'Sociology', 'Statistics'
]

const LEVELS = ['100', '200', '300', '400', '500', '600']

function Register({ setPage }) {
  const [form, setForm] = useState({
    fullName: '',
    matricNumber: '',
    email: '',
    department: '',
    level: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!form.matricNumber.trim()) newErrors.matricNumber = 'Matriculation number is required'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email address'
    if (!form.department) newErrors.department = 'Select your department'
    if (!form.level) newErrors.level = 'Select your level'
    if (!form.password) newErrors.password = 'Password is required'
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    // Check duplicate matric number
    const students = getStudents()
    const exists = students.find(s => s.matricNumber === form.matricNumber.trim())
    if (exists) newErrors.matricNumber = 'This matriculation number is already registered'

    return newErrors
  }

  const handleRegister = () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    setTimeout(() => {
      const students = getStudents()
      const newStudent = {
        id: `STU${String(students.length + 1).padStart(3, '0')}`,
        matricNumber: form.matricNumber.trim().toUpperCase(),
        fullName: form.fullName.trim(),
        department: form.department,
        level: form.level,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        hasVoted: false,
        isRegistered: true
      }

      students.push(newStudent)
      saveStudents(students)
      setSuccess(true)
      setLoading(false)
    }, 900)
  }

  if (success) {
    return (
      <div className="auth-page">
        <header className="auth-header">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">
            <h1>PLASU Student Union</h1>
            <p>Online Voting System — 2025/2026 Elections</p>
          </div>
        </header>
        <main className="auth-body">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: 'var(--success)', marginBottom: '10px' }}>Registration Successful!</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '28px' }}>
              Welcome, <strong>{form.fullName}</strong>! Your account has been created.
              You can now log in and cast your vote.
            </p>
            <button className="btn btn-primary" onClick={() => setPage('login')}>
              🔐 Proceed to Login
            </button>
          </div>
        </main>
        <footer className="auth-page-footer">
          © 2024 University Student Union. All rights reserved.
        </footer>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="logo-icon">🎓</div>
        <div className="logo-text">
          <h1>University Student Union</h1>
          <p>Online Voting System — 2024/2025 Elections</p>
        </div>
      </header>

      <main className="auth-body">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="card-icon">📝</div>
            <h2>Student Registration</h2>
            <p>Create your account to participate in the election</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Full Name <span>*</span></label>
              <input
                type="text"
                placeholder="e.g. Samuel Nimyel"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                className={errors.fullName ? 'error' : ''}
              />
              {errors.fullName && <p className="field-error">{errors.fullName}</p>}
            </div>

            <div className="form-group">
              <label>Matriculation Number <span>*</span></label>
              <input
                type="text"
                placeholder="e.g. PLASU/2025/FNAS/0000"
                value={form.matricNumber}
                onChange={(e) => update('matricNumber', e.target.value)}
                className={errors.matricNumber ? 'error' : ''}
              />
              {errors.matricNumber && <p className="field-error">{errors.matricNumber}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>Email Address <span>*</span></label>
            <input
              type="email"
              placeholder="e.g. john.doe@uni.edu.ng"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department <span>*</span></label>
              <select
                value={form.department}
                onChange={(e) => update('department', e.target.value)}
                className={errors.department ? 'error' : ''}
              >
                <option value="">-- Select Department --</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <p className="field-error">{errors.department}</p>}
            </div>

            <div className="form-group">
              <label>Level <span>*</span></label>
              <select
                value={form.level}
                onChange={(e) => update('level', e.target.value)}
                className={errors.level ? 'error' : ''}
              >
                <option value="">-- Select Level --</option>
                {LEVELS.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}L</option>
                ))}
              </select>
              {errors.level && <p className="field-error">{errors.level}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password <span>*</span></label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <div className="form-group">
              <label>Confirm Password <span>*</span></label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
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
            {loading ? <><span className="spinner"></span> Registering...</> : '✅ Create My Account'}
          </button>

          <div className="auth-footer-text">
            Already have an account?{' '}
            <button onClick={() => setPage('login')}>Login here</button>
          </div>
        </div>
      </main>

      <footer className="auth-page-footer">
        © 2026 Plateau State University Student Union. All rights reserved. Powered by UniVote.
      </footer>
    </div>
  )
}

export default Register