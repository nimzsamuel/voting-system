import studentsData from '../data/students.json'
import candidatesData from '../data/candidates.json'
import votesData from '../data/votes.json'
import adminData from '../data/admin.json'

// ─── Initialize localStorage ──────────────────────────────────────────────────
export const initializeStorage = () => {
  // Force refresh when data version changes
  const dataVersion = '3.0'
  if (localStorage.getItem('dataVersion') !== dataVersion) {
    localStorage.removeItem('students')
    localStorage.setItem('dataVersion', dataVersion)
  }

  // Candidates, Votes, Admin — only set if missing
  if (!localStorage.getItem('candidates')) {
    localStorage.setItem('candidates', JSON.stringify(candidatesData))
  }
  if (!localStorage.getItem('votes')) {
    localStorage.setItem('votes', JSON.stringify(votesData))
  }
  if (!localStorage.getItem('admin')) {
    localStorage.setItem('admin', JSON.stringify(adminData))
  }
  if (!localStorage.getItem('loginAttempts')) {
    localStorage.setItem('loginAttempts', JSON.stringify({}))
  }

  // Students — merge JSON into localStorage so new entries are never missed
  const existing = JSON.parse(localStorage.getItem('students')) || []
  const existingIds = existing.map(s => s.id)
  const merged = [...existing]
  studentsData.forEach(s => {
    if (!existingIds.includes(s.id)) merged.push(s)
  })
  localStorage.setItem('students', JSON.stringify(merged))
}

// ─── Students ─────────────────────────────────────────────────────────────────
export const getStudents = () => JSON.parse(localStorage.getItem('students')) || []
export const saveStudents = (s) => localStorage.setItem('students', JSON.stringify(s))

// ─── Candidates ───────────────────────────────────────────────────────────────
export const getCandidates = () => JSON.parse(localStorage.getItem('candidates')) || []
export const saveCandidates = (c) => localStorage.setItem('candidates', JSON.stringify(c))

// ─── Votes ────────────────────────────────────────────────────────────────────
export const getVotes = () => JSON.parse(localStorage.getItem('votes')) || votesData
export const saveVotes = (v) => localStorage.setItem('votes', JSON.stringify(v))

// ─── Admin ────────────────────────────────────────────────────────────────────
export const getAdmin = () => JSON.parse(localStorage.getItem('admin'))

// ─── Session ──────────────────────────────────────────────────────────────────
export const setSession = (user) => sessionStorage.setItem('currentUser', JSON.stringify(user))
export const getSession = () => JSON.parse(sessionStorage.getItem('currentUser'))
export const clearSession = () => sessionStorage.removeItem('currentUser')

// ─── Rate Limiting ────────────────────────────────────────────────────────────
export const getLoginAttempts = () => JSON.parse(localStorage.getItem('loginAttempts')) || {}
export const saveLoginAttempts = (a) => localStorage.setItem('loginAttempts', JSON.stringify(a))

export const recordFailedAttempt = (identifier) => {
  const attempts = getLoginAttempts()
  if (!attempts[identifier]) attempts[identifier] = { count: 0, locked: false }
  attempts[identifier].count += 1
  if (attempts[identifier].count >= 3) attempts[identifier].locked = true
  saveLoginAttempts(attempts)
  return attempts[identifier]
}

export const isAccountLocked = (identifier) => {
  const attempts = getLoginAttempts()
  return attempts[identifier]?.locked || false
}

export const getRemainingAttempts = (identifier) => {
  const attempts = getLoginAttempts()
  const count = attempts[identifier]?.count || 0
  return Math.max(0, 3 - count)
}

export const unlockAccount = (identifier) => {
  const attempts = getLoginAttempts()
  delete attempts[identifier]
  saveLoginAttempts(attempts)
}

export const resetLoginAttempts = (identifier) => {
  const attempts = getLoginAttempts()
  delete attempts[identifier]
  saveLoginAttempts(attempts)
}

export const getLockedAccounts = () => {
  const attempts = getLoginAttempts()
  return Object.entries(attempts)
    .filter(([_, data]) => data.locked)
    .map(([identifier]) => identifier)
}

// ─── OTP ──────────────────────────────────────────────────────────────────────
export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

export const saveOTP = (otp, matricNumber) => {
  sessionStorage.setItem('otp_data', JSON.stringify({
    otp,
    matricNumber,
    expiresAt: Date.now() + 5 * 60 * 1000
  }))
}

export const verifyOTP = (inputOTP) => {
  const data = JSON.parse(sessionStorage.getItem('otp_data'))
  if (!data) return { valid: false, reason: 'No OTP found. Please login again.' }
  if (Date.now() > data.expiresAt) {
    sessionStorage.removeItem('otp_data')
    return { valid: false, reason: 'OTP has expired. Please login again.' }
  }
  if (data.otp !== inputOTP) return { valid: false, reason: 'Incorrect OTP. Please try again.' }
  sessionStorage.removeItem('otp_data')
  return { valid: true }
}

export const clearOTP = () => sessionStorage.removeItem('otp_data')
export const getOTPData = () => JSON.parse(sessionStorage.getItem('otp_data'))