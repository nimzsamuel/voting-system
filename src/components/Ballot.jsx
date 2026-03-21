import { useState, useEffect } from 'react'
import {
  getCandidates,
  saveCandidates,
  getVotes,
  saveVotes,
  getStudents,
  saveStudents,
  clearSession
} from '../utils/storage'

const POSITIONS = ['President', 'Vice President', 'Secretary General', 'Financial Secretary']

function Ballot({ currentUser, setPage, setCurrentUser }) {
  const [candidates, setCandidates] = useState([])
  const [selections, setSelections] = useState({})
  const [step, setStep] = useState('vote')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [electionClosed, setElectionClosed] = useState(false)

  useEffect(() => {
    setCandidates(getCandidates())
    const votes = getVotes()
    if (votes.electionStatus === 'closed') setElectionClosed(true)
    if (currentUser?.hasVoted) setStep('alreadyVoted')
  }, [])

  const handleSelect = (position, candidateId) => {
    setSelections(prev => ({ ...prev, [position]: candidateId }))
    setError('')
  }

  const handleProceedToConfirm = () => {
    const unvoted = POSITIONS.filter(pos => !selections[pos])
    if (unvoted.length > 0) {
      setError(`Please select a candidate for: ${unvoted.join(', ')}`)
      return
    }
    setStep('confirm')
  }

  const handleSubmitVote = () => {
    setLoading(true)

    setTimeout(() => {
      try {
        const votes = getVotes()
        const now = new Date().toISOString()

        // Add vote records
        POSITIONS.forEach(position => {
          votes.records.push({
            studentId: currentUser.id,
            candidateId: selections[position],
            position,
            timestamp: now
          })
        })

        // Update candidate vote counts
        const updatedCandidates = getCandidates().map(candidate => {
          const isSelected = Object.values(selections).includes(candidate.id)
          return isSelected ? { ...candidate, votes: candidate.votes + 1 } : candidate
        })

        // Mark student as voted
        const updatedStudents = getStudents().map(s =>
          s.id === currentUser.id ? { ...s, hasVoted: true } : s
        )

        votes.totalVotesCast = (votes.totalVotesCast || 0) + 1

        // Save all at once
        saveVotes(votes)
        saveCandidates(updatedCandidates)
        saveStudents(updatedStudents)

        setLoading(false)
        setStep('success')
      } catch (err) {
        console.error('Vote submission error:', err)
        setLoading(false)
        setError('Something went wrong. Please try again.')
        setStep('confirm')
      }
    }, 1200)
  }

  const handleLogout = () => {
    clearSession()
    setCurrentUser(null)
    setPage('login')
  }

  const getCandidateById = (id) => candidates.find(c => c.id === id)

  // ─── Already Voted ───────────────────────────────────────────────────────────
  if (step === 'alreadyVoted') {
    return (
      <div className="ballot-page">
        <BallotHeader currentUser={currentUser} onLogout={handleLogout} />
        <main className="ballot-body">
          <div className="voted-card">
            <div className="voted-icon">✅</div>
            <h2>You Have Already Voted</h2>
            <p>Your vote has been recorded. You cannot vote more than once.</p>
            <p className="voted-sub">Results will be available once the admin closes the election.</p>
            <button className="btn btn-outline" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </main>
      </div>
    )
  }

  // ─── Election Closed ─────────────────────────────────────────────────────────
  if (electionClosed) {
    return (
      <div className="ballot-page">
        <BallotHeader currentUser={currentUser} onLogout={handleLogout} />
        <main className="ballot-body">
          <div className="voted-card">
            <div className="voted-icon">🔒</div>
            <h2>Voting is Closed</h2>
            <p>The election has been closed by the administrator.</p>
            <button className="btn btn-primary" onClick={() => setPage('results')} style={{ marginBottom: '12px' }}>
              📊 View Results
            </button>
            <button className="btn btn-outline" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </main>
      </div>
    )
  }

  // ─── Success ─────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="ballot-page">
        <BallotHeader currentUser={currentUser} onLogout={handleLogout} />
        <main className="ballot-body">
          <div className="voted-card success-card">
            <div className="voted-icon">🎉</div>
            <h2>Vote Submitted Successfully!</h2>
            <p>Thank you, <strong>{currentUser?.fullName}</strong>. Your vote has been recorded securely.</p>
            <div className="vote-summary">
              <h4>Your Selections:</h4>
              {POSITIONS.map(pos => {
                const candidate = getCandidateById(selections[pos])
                return (
                  <div key={pos} className="summary-row">
                    <span className="summary-position">{pos}</span>
                    <span className="summary-name">→ {candidate?.fullName}</span>
                  </div>
                )
              })}
            </div>
            <p className="voted-sub">Results will be published after the election closes.</p>
            <button className="btn btn-outline" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </main>
      </div>
    )
  }

  // ─── Confirm ─────────────────────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="ballot-page">
        <BallotHeader currentUser={currentUser} onLogout={handleLogout} />
        <main className="ballot-body">
          <div className="confirm-card">
            <div className="confirm-header">
              <div className="confirm-icon">🧾</div>
              <h2>Review Your Selections</h2>
              <p>Please confirm your choices before submitting. This action cannot be undone.</p>
            </div>

            {error && (
              <div className="alert alert-error">⚠️ {error}</div>
            )}

            <div className="confirm-list">
              {POSITIONS.map(pos => {
                const candidate = getCandidateById(selections[pos])
                return (
                  <div key={pos} className="confirm-item">
                    <div className="confirm-position">{pos}</div>
                    <div className="confirm-candidate">
                      <img
                        src={candidate?.photo}
                        alt={candidate?.fullName}
                        className="confirm-avatar"
                      />
                      <div>
                        <div className="confirm-name">{candidate?.fullName}</div>
                        <div className="confirm-dept">{candidate?.department} • {candidate?.level}L</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="confirm-actions">
              <button
                className="btn btn-outline"
                onClick={() => setStep('vote')}
                disabled={loading}
                style={{ flex: 1 }}
              >
                ✏️ Edit Selections
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitVote}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? <><span className="spinner"></span> Submitting...</> : '🗳️ Submit My Vote'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─── Main Ballot ─────────────────────────────────────────────────────────────
  return (
    <div className="ballot-page">
      <BallotHeader currentUser={currentUser} onLogout={handleLogout} />

      <main className="ballot-body">
        <div className="ballot-intro">
          <h2>🗳️ Cast Your Vote</h2>
          <p>Select one candidate per position. You must vote for all positions to proceed.</p>
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill"
              style={{ width: `${(Object.keys(selections).length / POSITIONS.length) * 100}%` }}
            />
          </div>
          <p className="progress-text">
            {Object.keys(selections).length} of {POSITIONS.length} positions selected
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ maxWidth: '800px', margin: '0 auto 20px' }}>
            ⚠️ {error}
          </div>
        )}

        {POSITIONS.map(position => (
          <section key={position} className="position-section">
            <div className="position-label">
              <span className="position-badge">{position}</span>
              {selections[position] && <span className="selected-tick">✅ Selected</span>}
            </div>
            <div className="candidates-grid">
              {candidates
                .filter(c => c.position === position)
                .map(candidate => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={selections[position] === candidate.id}
                    onSelect={() => handleSelect(position, candidate.id)}
                  />
                ))}
            </div>
          </section>
        ))}

        <div className="ballot-submit-wrap">
          <button className="btn btn-accent ballot-submit-btn" onClick={handleProceedToConfirm}>
            🧾 Review &amp; Confirm Selections →
          </button>
        </div>
      </main>

      <footer className="auth-page-footer">
        © 2024 University Student Union. All rights reserved. Powered by UniVote.
      </footer>
    </div>
  )
}

// ─── Candidate Card ───────────────────────────────────────────────────────────
function CandidateCard({ candidate, isSelected, onSelect }) {
  return (
    <div
      className={`candidate-card ${isSelected ? 'candidate-card--selected' : ''}`}
      onClick={onSelect}
    >
      {isSelected && <div className="selected-badge">✔ Your Choice</div>}
      <img src={candidate.photo} alt={candidate.fullName} className="candidate-avatar" />
      <h3 className="candidate-name">{candidate.fullName}</h3>
      <p className="candidate-meta">{candidate.department} • {candidate.level}L</p>
      <p className="candidate-manifesto">"{candidate.manifesto}"</p>
      <div className={`vote-btn ${isSelected ? 'vote-btn--selected' : ''}`}>
        {isSelected ? '✅ Selected' : 'Select Candidate'}
      </div>
    </div>
  )
}

// ─── Ballot Header ────────────────────────────────────────────────────────────
function BallotHeader({ currentUser, onLogout }) {
  return (
    <header className="ballot-header">
      <div className="ballot-header-left">
        <span className="logo-icon">🎓</span>
        <div>
          <h1>University Student Union</h1>
          <p>Online Voting System — 2024/2025 Elections</p>
        </div>
      </div>
      <div className="ballot-header-right">
        <div className="user-badge">
          <span>👤</span>
          <div>
            <div className="user-name">{currentUser?.fullName}</div>
            <div className="user-matric">{currentUser?.matricNumber}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>🚪 Logout</button>
      </div>
    </header>
  )
}

export default Ballot