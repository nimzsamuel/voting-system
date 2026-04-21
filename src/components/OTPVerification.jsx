import { useState, useEffect } from 'react'
import {
  verifyOTP,
  getOTPData,
  getVotes,
  clearSession,
  generateOTP,
  saveOTP
} from '../utils/storage'

function OTPVerification({ currentUser, setPage, setCurrentUser }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [expired, setExpired] = useState(false)
  const [showOTP, setShowOTP] = useState(false)

  const otpData = getOTPData()

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!otpData) {
      setPage('login')
      return
    }

    const remaining = Math.floor((otpData.expiresAt - Date.now()) / 1000)
    setTimeLeft(Math.max(0, remaining))

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ── OTP input handling ────────────────────────────────────────────────────
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')

    // Auto-focus next box
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
    if (e.key === 'Enter') handleVerify()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      document.getElementById('otp-5')?.focus()
    }
    e.preventDefault()
  }

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerify = () => {
    const inputOTP = otp.join('')
    if (inputOTP.length < 6) {
      setError('Please enter all 6 digits.')
      return
    }

    setLoading(true)

    setTimeout(() => {
      const result = verifyOTP(inputOTP)

      if (!result.valid) {
        setError(result.reason)
        setLoading(false)
        if (result.reason.includes('expired') || result.reason.includes('login again')) {
          setTimeout(() => {
            clearSession()
            setCurrentUser(null)
            setPage('login')
          }, 2000)
        }
        return
      }

      // OTP verified — route to ballot or results
      const votes = getVotes()
      setLoading(false)
      if (votes.electionStatus === 'closed') {
        setPage('results')
      } else {
        setPage('ballot')
      }
    }, 800)
  }

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = () => {
    const newOTP = generateOTP()
    saveOTP(newOTP, currentUser?.matricNumber)
    setOtp(['', '', '', '', '', ''])
    setError('')
    setExpired(false)
    setShowOTP(false)
    setTimeLeft(300)
    document.getElementById('otp-0')?.focus()
  }

  const handleLogout = () => {
    clearSession()
    setCurrentUser(null)
    setPage('login')
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
        <div className="auth-card" style={{ maxWidth: '440px' }}>
          <div className="auth-card-header">
            <div className="card-icon">📱</div>
            <h2>OTP Verification</h2>
            <p>
              A 6-digit verification code has been generated for{' '}
              <strong>{currentUser?.fullName}</strong>
            </p>
          </div>

          {/* Simulated OTP Display */}
          <div className="otp-reveal-card">
            <div className="otp-reveal-label">🔐 Your One-Time Password</div>
            {showOTP ? (
              <div className="otp-reveal-code">{otpData?.otp}</div>
            ) : (
              <button className="otp-reveal-btn" onClick={() => setShowOTP(true)}>
                👁 Click to reveal your OTP
              </button>
            )}
            <div className="otp-reveal-note">
              In a real system, this would be sent to your email: <strong>{currentUser?.email}</strong>
            </div>
          </div>

          {/* Timer */}
          {!expired ? (
            <div className={`otp-timer ${timeLeft <= 60 ? 'otp-timer-danger' : ''}`}>
              ⏱ Code expires in: <strong>{formatTime(timeLeft)}</strong>
            </div>
          ) : (
            <div className="alert alert-error">⚠️ Your OTP has expired. Please request a new one.</div>
          )}

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          {/* OTP Input Boxes */}
          {!expired && (
            <>
              <div className="otp-input-group" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className={`otp-box ${digit ? 'otp-box-filled' : ''} ${error ? 'otp-box-error' : ''}`}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button
                className="btn btn-primary"
                onClick={handleVerify}
                disabled={loading || otp.join('').length < 6}
                style={{ marginTop: '8px' }}
              >
                {loading ? <><span className="spinner"></span> Verifying...</> : '✅ Verify & Proceed'}
              </button>
            </>
          )}

          {/* Resend */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              className="btn btn-outline"
              onClick={handleResend}
              style={{ marginBottom: '12px' }}
            >
              🔄 Generate New OTP
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--gray-600)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </main>

      <footer className="auth-page-footer">
        © 2024 University Student Union. All rights reserved. Powered by UniVote.
      </footer>
    </div>
  )
}

export default OTPVerification