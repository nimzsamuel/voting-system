import studentsData from '../data/students.json'
import candidatesData from '../data/candidates.json'
import votesData from '../data/votes.json'
import adminData from '../data/admin.json'

// ─── Initialize localStorage with JSON data on first load ────────────────────
export const initializeStorage = () => {
  if (!localStorage.getItem('students')) {
    localStorage.setItem('students', JSON.stringify(studentsData))
  }
  if (!localStorage.getItem('candidates')) {
    localStorage.setItem('candidates', JSON.stringify(candidatesData))
  }
  if (!localStorage.getItem('votes')) {
    localStorage.setItem('votes', JSON.stringify(votesData))
  }
  if (!localStorage.getItem('admin')) {
    localStorage.setItem('admin', JSON.stringify(adminData))
  }
}

// ─── Students ─────────────────────────────────────────────────────────────────
export const getStudents = () => JSON.parse(localStorage.getItem('students')) || []
export const saveStudents = (students) => localStorage.setItem('students', JSON.stringify(students))

// ─── Candidates ───────────────────────────────────────────────────────────────
export const getCandidates = () => JSON.parse(localStorage.getItem('candidates')) || []
export const saveCandidates = (candidates) => localStorage.setItem('candidates', JSON.stringify(candidates))

// ─── Votes ────────────────────────────────────────────────────────────────────
export const getVotes = () => JSON.parse(localStorage.getItem('votes')) || votesData
export const saveVotes = (votes) => localStorage.setItem('votes', JSON.stringify(votes))

// ─── Admin ────────────────────────────────────────────────────────────────────
export const getAdmin = () => JSON.parse(localStorage.getItem('admin'))

// ─── Session (current logged-in user) ─────────────────────────────────────────
export const setSession = (user) => sessionStorage.setItem('currentUser', JSON.stringify(user))
export const getSession = () => JSON.parse(sessionStorage.getItem('currentUser'))
export const clearSession = () => sessionStorage.removeItem('currentUser')