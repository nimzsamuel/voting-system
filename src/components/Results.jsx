import { useState, useEffect } from 'react'
import { getCandidates, getVotes, getStudents, clearSession } from '../utils/storage'

const POSITIONS = ['President', 'Vice President', 'Secretary General', 'Financial Secretary']

const POSITION_ICONS = {
  'President': '👑',
  'Vice President': '🥈',
  'Secretary General': '📝',
  'Financial Secretary': '💰'
}

function Results({ currentUser, setPage, setCurrentUser }) {
  const [candidates, setCandidates] = useState([])
  const [votes, setVotes] = useState({})
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePosition, setActivePosition] = useState('All')

  useEffect(() => {
    setTimeout(() => {
      setCandidates(getCandidates())
      setVotes(getVotes())
      setStudents(getStudents())
      setLoading(false)
    }, 800)
  }, [])

  const handleLogout = () => {
    clearSession()
    setCurrentUser(null)
    setPage('login')
  }

  const isAdmin = currentUser?.role === 'admin'

  // ─── If election still open and user is student ──────────────────────────────
  if (!loading && votes.electionStatus === 'open' && !isAdmin) {
    return (
      <div className="results-page">
        <ResultsHeader
          currentUser={currentUser}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          setPage={setPage}
        />
        <main className="results-body">
          <div className="results-locked-card">
            <div className="results-locked-icon">🔒</div>
            <h2>Results Not Yet Available</h2>
            <p>The election is still ongoing. Results will be published once the administrator closes the voting.</p>
            {currentUser?.hasVoted
              ? <p className="results-locked-sub">✅ Your vote has been recorded. Thank you for participating!</p>
              : <p className="results-locked-sub">⏳ You have not voted yet.</p>
            }
            <button className="btn btn-outline" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </main>
      </div>
    )
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="results-page">
        <ResultsHeader
          currentUser={currentUser}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          setPage={setPage}
        />
        <main className="results-body">
          <div className="results-locked-card">
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
            <h2>Loading Results...</h2>
            <p>Please wait while we tally the votes.</p>
          </div>
        </main>
      </div>
    )
  }

  // ─── Compute Stats ───────────────────────────────────────────────────────────
  const totalStudents = students.length
  const totalVotesCast = votes.totalVotesCast || 0
  const turnout = totalStudents > 0 ? ((totalVotesCast / totalStudents) * 100).toFixed(1) : 0

  const getCandidatesByPosition = (position) => {
    const positionCandidates = candidates.filter(c => c.position === position)
    const totalForPosition = positionCandidates.reduce((sum, c) => sum + c.votes, 0)
    return positionCandidates
      .map(c => ({
        ...c,
        percentage: totalForPosition > 0 ? ((c.votes / totalForPosition) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.votes - a.votes)
  }

  const getWinner = (position) => {
    const sorted = getCandidatesByPosition(position)
    return sorted[0] || null
  }

  const displayPositions = activePosition === 'All' ? POSITIONS : [activePosition]

  // ─── Main Results ─────────────────────────────────────────────────────────────
  return (
    <div className="results-page">
      <ResultsHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        setPage={setPage}
      />

      <main className="results-body">

        {/* Election Closed Banner */}
        <div className="results-banner">
          <div className="results-banner-left">
            <div className="results-banner-icon">🏆</div>
            <div>
              <h2>{votes.electionTitle}</h2>
              <p>
                {votes.electionStatus === 'closed'
                  ? `Election closed on ${new Date(votes.votingClosedAt).toLocaleString()}`
                  : '🟢 Election is currently open — Live preview'}
              </p>
            </div>
          </div>
          <div className="results-banner-right">
            <div className="results-stat">
              <div className="results-stat-value">{totalVotesCast}</div>
              <div className="results-stat-label">Total Votes</div>
            </div>
            <div className="results-stat">
              <div className="results-stat-value">{turnout}%</div>
              <div className="results-stat-label">Turnout</div>
            </div>
            <div className="results-stat">
              <div className="results-stat-value">{totalStudents}</div>
              <div className="results-stat-label">Registered</div>
            </div>
          </div>
        </div>

        {/* Winners Summary Row */}
        <div className="winners-row">
          {POSITIONS.map(pos => {
            const winner = getWinner(pos)
            return (
              <div key={pos} className="winner-card">
                <div className="winner-position-icon">{POSITION_ICONS[pos]}</div>
                <div className="winner-position-label">{pos}</div>
                {winner && winner.votes > 0 ? (
                  <>
                    <img src={winner.photo} alt={winner.fullName} className="winner-avatar" />
                    <div className="winner-name">{winner.fullName}</div>
                    <div className="winner-votes">{winner.votes} votes · {winner.percentage}%</div>
                  </>
                ) : (
                  <div className="winner-empty">No votes yet</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Position Filter */}
        <div className="results-filter-wrap">
          <div className="filter-group">
            {['All', ...POSITIONS].map(pos => (
              <button
                key={pos}
                className={`filter-btn ${activePosition === pos ? 'active' : ''}`}
                onClick={() => setActivePosition(pos)}
              >
                {POSITION_ICONS[pos] || '📋'} {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Results Per Position */}
        {displayPositions.map(position => {
          const positionCandidates = getCandidatesByPosition(position)
          const winner = positionCandidates[0]
          const totalForPosition = positionCandidates.reduce((sum, c) => sum + Number(c.votes), 0)

          return (
            <div key={position} className="results-position-card">
              <div className="results-position-header">
                <div className="results-position-title">
                  <span>{POSITION_ICONS[position]}</span>
                  <h3>{position}</h3>
                </div>
                <div className="results-position-meta">
                  {totalForPosition} vote{totalForPosition !== 1 ? 's' : ''} cast
                </div>
              </div>

              <div className="results-candidates-list">
                {positionCandidates.map((candidate, index) => {
                  const isWinner = index === 0 && candidate.votes > 0
                  const isTie = index === 1 && candidate.votes === winner?.votes && candidate.votes > 0

                  return (
                    <div
                      key={candidate.id}
                      className={`result-candidate-row ${isWinner ? 'result-winner-row' : ''}`}
                    >
                      {/* Rank */}
                      <div className="result-rank">
                        {isWinner ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>

                      {/* Avatar */}
                      <img
                        src={candidate.photo}
                        alt={candidate.fullName}
                        className="result-avatar"
                      />

                      {/* Info */}
                      <div className="result-info">
                        <div className="result-name">
                          {candidate.fullName}
                          {isWinner && candidate.votes > 0 && (
                            <span className="result-winner-tag">
                              {votes.electionStatus === 'closed' ? '🏆 Winner' : '📈 Leading'}
                            </span>
                          )}
                          {isTie && <span className="result-tie-tag">🤝 Tied</span>}
                        </div>
                        <div className="result-meta">
                          {candidate.department} · {candidate.level}L
                        </div>
                      </div>

                      {/* Bar + Count */}
                      <div className="result-bar-wrap">
                        <div className="result-bar-track">
                          <div
                            className={`result-bar-fill ${isWinner ? 'result-bar-winner' : 'result-bar-default'}`}
                            style={{ width: `${candidate.percentage}%` }}
                          />
                        </div>
                        <div className="result-bar-labels">
                          <span>{candidate.percentage}%</span>
                          <span>{candidate.votes} vote{candidate.votes !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {totalForPosition === 0 && (
                  <div className="result-empty">
                    🗳️ No votes have been cast for this position yet.
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Footer Note */}
        <div className="results-footer-note">
          {votes.electionStatus === 'closed'
            ? '✅ This election has been officially closed. The results above are final.'
            : '⚠️ The election is still open. These results update in real time as votes are cast.'}
        </div>
      </main>

      <footer className="auth-page-footer">
        © 2024 University Student Union. All rights reserved. Powered by UniVote.
      </footer>
    </div>
  )
}

// ─── Results Header ───────────────────────────────────────────────────────────
function ResultsHeader({ currentUser, onLogout, isAdmin, setPage }) {
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
        {isAdmin ? (
          <button className="logout-btn" onClick={() => setPage('admin')}>
            ← Back to Dashboard
          </button>
        ) : (
          <div className="user-badge">
            <span>👤</span>
            <div>
              <div className="user-name">{currentUser?.fullName}</div>
              <div className="user-matric">{currentUser?.matricNumber}</div>
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={onLogout}>🚪 Logout</button>
      </div>
    </header>
  )
}

export default Results