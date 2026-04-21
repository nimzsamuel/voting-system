import { useState, useEffect } from 'react'
import {
  getStudents, saveStudents,
  getCandidates, saveCandidates,
  getVotes, saveVotes,
  clearSession,
  unlockAccount,
  isAccountLocked
} from '../utils/storage'

const POSITIONS = ['President', 'Vice President', 'Secretary General', 'Financial Secretary']

function AdminDashboard({ setPage, setCurrentUser }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [students, setStudents] = useState([])
  const [candidates, setCandidates] = useState([])
  const [votes, setVotes] = useState({})
  const [notification, setNotification] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    setStudents(getStudents())
    setCandidates(getCandidates())
    setVotes(getVotes())
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleLogout = () => {
    clearSession()
    setCurrentUser(null)
    setPage('login')
  }

  const handleToggleElection = () => {
    const updated = { ...votes }
    if (updated.electionStatus === 'open') {
      updated.electionStatus = 'closed'
      updated.votingClosedAt = new Date().toISOString()
      showNotification('Election has been closed. Results are now visible to students.', 'success')
    } else {
      updated.electionStatus = 'open'
      updated.votingOpenedAt = new Date().toISOString()
      updated.votingClosedAt = null
      showNotification('Election has been opened. Students can now vote.', 'success')
    }
    saveVotes(updated)
    setVotes(updated)
  }

  const handleResetElection = () => {
    if (!window.confirm('⚠️ Are you sure you want to reset the entire election? All votes will be cleared. This cannot be undone.')) return

    const freshVotes = {
      electionTitle: votes.electionTitle,
      electionStatus: 'open',
      votingOpenedAt: new Date().toISOString(),
      votingClosedAt: null,
      totalVotesCast: 0,
      records: []
    }

    const resetCandidates = getCandidates().map(c => ({ ...c, votes: 0 }))
    const resetStudents = getStudents().map(s => ({ ...s, hasVoted: false }))

    saveVotes(freshVotes)
    saveCandidates(resetCandidates)
    saveStudents(resetStudents)

    setVotes(freshVotes)
    setCandidates(resetCandidates)
    setStudents(resetStudents)
    showNotification('Election has been reset successfully.', 'success')
  }

  const tabs = [
    { id: 'overview',   label: 'Overview',      icon: '📊' },
    { id: 'candidates', label: 'Candidates',     icon: '🧑‍💼' },
    { id: 'students',   label: 'Students',       icon: '🎓' },
    { id: 'locked',     label: 'Locked Accounts',icon: '🔒' },
    { id: 'activity',   label: 'Vote Activity',  icon: '📋' },
  ]

  return (
    <div className="admin-page">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span>🎓</span>
          <div>
            <h2>UniVote</h2>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav className="admin-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <span>🔐</span>
            <div>
              <div className="admin-user-name">Super Admin</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="admin-main">
        {/* Top Bar */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-topbar-title">
              {tabs.find(t => t.id === activeTab)?.icon}{' '}
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="admin-topbar-sub">{votes.electionTitle}</p>
          </div>
          <div className="admin-topbar-right">
            <div className={`election-status-badge ${votes.electionStatus === 'open' ? 'status-open' : 'status-closed'}`}>
              {votes.electionStatus === 'open' ? '🟢 Election Open' : '🔴 Election Closed'}
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`admin-notification alert alert-${notification.type}`}>
            {notification.type === 'success' ? '✅' : '⚠️'} {notification.message}
          </div>
        )}

        {/* Tab Content */}
        <div className="admin-content">
          {activeTab === 'overview' && (
            <OverviewTab
              students={students}
              candidates={candidates}
              votes={votes}
              onToggleElection={handleToggleElection}
              onResetElection={handleResetElection}
              setPage={setPage}
            />
          )}
          {activeTab === 'candidates' && (
            <CandidatesTab
              candidates={candidates}
              setCandidates={setCandidates}
              showNotification={showNotification}
            />
          )}
          {activeTab === 'students' && (
            <StudentsTab
              students={students}
              setStudents={setStudents}
              showNotification={showNotification}
            />
          )}
          {activeTab === 'locked' && (
            <LockedAccountsTab
              students={students}
              showNotification={showNotification}
              reloadStudents={() => setStudents(getStudents())}
            />
          )}
          {activeTab === 'activity' && (
            <ActivityTab
              votes={votes}
              students={students}
              candidates={candidates}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW TAB
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ students, candidates, votes, onToggleElection, onResetElection, setPage }) {
  const totalStudents = students.length
  const votedStudents = students.filter(s => s.hasVoted).length
  const turnout = totalStudents > 0 ? ((votedStudents / totalStudents) * 100).toFixed(1) : 0

  const stats = [
    { label: 'Total Students',  value: totalStudents,                   icon: '🎓', color: '#1a3c6e' },
    { label: 'Votes Cast',      value: votedStudents,                   icon: '🗳️', color: '#27ae60' },
    { label: 'Yet to Vote',     value: totalStudents - votedStudents,   icon: '⏳', color: '#e8a020' },
    { label: 'Voter Turnout',   value: `${turnout}%`,                   icon: '📈', color: '#8e44ad' },
  ]

  return (
    <div className="overview-tab">
      {/* Stats */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: stat.color + '18' }}>{stat.icon}</div>
            <div>
              <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Turnout */}
      <div className="admin-card">
        <h3 className="admin-card-title">📊 Voter Turnout Progress</h3>
        <div className="turnout-bar-wrap">
          <div className="turnout-bar-fill" style={{ width: `${turnout}%` }} />
        </div>
        <div className="turnout-labels">
          <span>{votedStudents} voted</span>
          <span>{turnout}%</span>
          <span>{totalStudents - votedStudents} remaining</span>
        </div>
      </div>

      {/* Election Controls */}
      <div className="admin-card">
        <h3 className="admin-card-title">⚙️ Election Controls</h3>
        <p className="admin-card-desc">
          Current Status: <strong>{votes.electionStatus === 'open' ? '🟢 Voting is Open' : '🔴 Voting is Closed'}</strong>
        </p>
        {votes.votingOpenedAt && (
          <p className="admin-card-desc" style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>
            Opened: {new Date(votes.votingOpenedAt).toLocaleString()}
          </p>
        )}
        {votes.votingClosedAt && (
          <p className="admin-card-desc" style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>
            Closed: {new Date(votes.votingClosedAt).toLocaleString()}
          </p>
        )}
        <div className="control-actions">
          <button
            className={`btn ${votes.electionStatus === 'open' ? 'btn-danger' : 'btn-success'}`}
            onClick={onToggleElection}
          >
            {votes.electionStatus === 'open' ? '🔒 Close Election' : '🔓 Reopen Election'}
          </button>
          {votes.electionStatus === 'closed' && (
            <button className="btn btn-primary" onClick={() => setPage('results')}>
              📊 View Results
            </button>
          )}
          <button className="btn btn-danger-outline" onClick={onResetElection}>
            🔄 Reset Election
          </button>
        </div>
      </div>

      {/* Candidates Summary */}
      <div className="admin-card">
        <h3 className="admin-card-title">🧑‍💼 Candidates Summary</h3>
        <div className="position-summary-grid">
          {POSITIONS.map(pos => {
            const posCandidates = candidates.filter(c => c.position === pos)
            const totalVotes = posCandidates.reduce((sum, c) => sum + c.votes, 0)
            const leader = posCandidates.reduce((a, b) => a.votes > b.votes ? a : b, posCandidates[0] || {})
            return (
              <div key={pos} className="position-summary-card">
                <div className="position-summary-title">{pos}</div>
                <div className="position-summary-count">{posCandidates.length} candidates</div>
                <div className="position-summary-votes">{totalVotes} votes cast</div>
                {leader?.fullName && (
                  <div className="position-summary-leader">🏅 Leading: <strong>{leader.fullName}</strong></div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATES TAB
// ─────────────────────────────────────────────────────────────────────────────
function CandidatesTab({ candidates, setCandidates, showNotification }) {
  const [filterPosition, setFilterPosition] = useState('All')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCandidate, setNewCandidate] = useState({
    fullName: '', position: '', department: '', level: '', manifesto: ''
  })

  const filtered = filterPosition === 'All'
    ? candidates
    : candidates.filter(c => c.position === filterPosition)

  const handleEdit = (candidate) => {
    setEditingId(candidate.id)
    setEditForm({ ...candidate })
  }

  const handleSaveEdit = () => {
    const updated = candidates.map(c => c.id === editingId ? { ...editForm } : c)
    saveCandidates(updated)
    setCandidates(updated)
    setEditingId(null)
    showNotification('Candidate updated successfully.')
  }

  const handleDelete = (id) => {
    if (!window.confirm('Remove this candidate?')) return
    const updated = candidates.filter(c => c.id !== id)
    saveCandidates(updated)
    setCandidates(updated)
    showNotification('Candidate removed.')
  }

  const handleAddCandidate = () => {
    if (!newCandidate.fullName || !newCandidate.position || !newCandidate.department || !newCandidate.level) {
      showNotification('Please fill in all required fields.', 'error')
      return
    }
    const candidate = {
      id: `CAN${String(candidates.length + 1).padStart(3, '0')}`,
      ...newCandidate,
      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newCandidate.fullName.replace(/\s/g, '')}`,
      votes: 0
    }
    const updated = [...candidates, candidate]
    saveCandidates(updated)
    setCandidates(updated)
    setNewCandidate({ fullName: '', position: '', department: '', level: '', manifesto: '' })
    setShowAddForm(false)
    showNotification('Candidate added successfully.')
  }

  return (
    <div className="candidates-tab">
      {/* Toolbar */}
      <div className="tab-toolbar">
        <div className="filter-group">
          {['All', ...POSITIONS].map(pos => (
            <button
              key={pos}
              className={`filter-btn ${filterPosition === pos ? 'active' : ''}`}
              onClick={() => setFilterPosition(pos)}
            >
              {pos}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✖ Cancel' : '➕ Add Candidate'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="admin-card add-form-card">
          <h3 className="admin-card-title">➕ Add New Candidate</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name <span>*</span></label>
              <input
                type="text"
                placeholder="Candidate full name"
                value={newCandidate.fullName}
                onChange={e => setNewCandidate(p => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Position <span>*</span></label>
              <select
                value={newCandidate.position}
                onChange={e => setNewCandidate(p => ({ ...p, position: e.target.value }))}
              >
                <option value="">-- Select Position --</option>
                {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department <span>*</span></label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={newCandidate.department}
                onChange={e => setNewCandidate(p => ({ ...p, department: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Level <span>*</span></label>
              <select
                value={newCandidate.level}
                onChange={e => setNewCandidate(p => ({ ...p, level: e.target.value }))}
              >
                <option value="">-- Level --</option>
                {['100','200','300','400','500','600'].map(l => (
                  <option key={l} value={l}>{l}L</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Manifesto</label>
            <input
              type="text"
              placeholder="Brief manifesto statement"
              value={newCandidate.manifesto}
              onChange={e => setNewCandidate(p => ({ ...p, manifesto: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary" style={{ maxWidth: '200px' }} onClick={handleAddCandidate}>
            ✅ Add Candidate
          </button>
        </div>
      )}

      {/* Table */}
      <div className="admin-card">
        <h3 className="admin-card-title">
          Showing {filtered.length} candidate{filtered.length !== 1 ? 's' : ''}
          {filterPosition !== 'All' ? ` for ${filterPosition}` : ''}
        </h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Position</th>
                <th>Department</th>
                <th>Level</th>
                <th>Votes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(candidate => (
                editingId === candidate.id ? (
                  <tr key={candidate.id} className="editing-row">
                    <td>
                      <input
                        className="table-input"
                        value={editForm.fullName}
                        onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))}
                      />
                    </td>
                    <td>
                      <select
                        className="table-input"
                        value={editForm.position}
                        onChange={e => setEditForm(p => ({ ...p, position: e.target.value }))}
                      >
                        {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        className="table-input"
                        value={editForm.department}
                        onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        className="table-input"
                        value={editForm.level}
                        onChange={e => setEditForm(p => ({ ...p, level: e.target.value }))}
                      />
                    </td>
                    <td>{candidate.votes}</td>
                    <td>
                      <div className="table-actions">
                        <button className="tbl-btn tbl-btn-save" onClick={handleSaveEdit}>💾 Save</button>
                        <button className="tbl-btn tbl-btn-cancel" onClick={() => setEditingId(null)}>✖</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={candidate.id}>
                    <td>
                      <div className="table-candidate">
                        <img src={candidate.photo} alt={candidate.fullName} className="table-avatar" />
                        <span>{candidate.fullName}</span>
                      </div>
                    </td>
                    <td><span className="position-pill">{candidate.position}</span></td>
                    <td>{candidate.department}</td>
                    <td>{candidate.level}L</td>
                    <td><strong>{candidate.votes}</strong></td>
                    <td>
                      <div className="table-actions">
                        <button className="tbl-btn tbl-btn-edit" onClick={() => handleEdit(candidate)}>✏️ Edit</button>
                        <button className="tbl-btn tbl-btn-delete" onClick={() => handleDelete(candidate.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function StudentsTab({ students, setStudents, showNotification }) {
  const [search, setSearch] = useState('')
  const [filterVoted, setFilterVoted] = useState('All')

  const filtered = students.filter(s => {
    const matchSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.matricNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
    const matchVoted =
      filterVoted === 'All'    ? true :
      filterVoted === 'Voted'  ? s.hasVoted :
      !s.hasVoted
    return matchSearch && matchVoted
  })

  const handleRemoveStudent = (id) => {
    if (!window.confirm('Remove this student from the system?')) return
    const updated = students.filter(s => s.id !== id)
    saveStudents(updated)
    setStudents(updated)
    showNotification('Student removed successfully.')
  }

  const handleResetVote = (id) => {
    if (!window.confirm("Reset this student's vote? They will be able to vote again.")) return
    const updated = students.map(s => s.id === id ? { ...s, hasVoted: false } : s)
    saveStudents(updated)
    setStudents(updated)
    showNotification('Student vote reset successfully.')
  }

  return (
    <div className="students-tab">
      <div className="tab-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by name, matric or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-group">
          {['All', 'Voted', 'Not Voted'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filterVoted === f ? 'active' : ''}`}
              onClick={() => setFilterVoted(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">
          {filtered.length} student{filtered.length !== 1 ? 's' : ''} found
        </h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Matric No.</th>
                <th>Department</th>
                <th>Level</th>
                <th>Registered</th>
                <th>Vote Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => (
                <tr key={student.id}>
                  <td>
                    <div className="table-student">
                      <div className="student-initials">
                        {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="student-name">{student.fullName}</div>
                        <div className="student-email">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><code>{student.matricNumber}</code></td>
                  <td>{student.department}</td>
                  <td>{student.level}L</td>
                  <td>
                    <span className={`voted-pill ${student.isRegistered ? 'voted-yes' : 'voted-no'}`}>
                      {student.isRegistered ? '✅ Yes' : '⏳ No'}
                    </span>
                  </td>
                  <td>
                    <span className={`voted-pill ${student.hasVoted ? 'voted-yes' : 'voted-no'}`}>
                      {student.hasVoted ? '✅ Voted' : '⏳ Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {student.hasVoted && (
                        <button className="tbl-btn tbl-btn-edit" onClick={() => handleResetVote(student.id)}>
                          🔄 Reset
                        </button>
                      )}
                      <button className="tbl-btn tbl-btn-delete" onClick={() => handleRemoveStudent(student.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-400)' }}>
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCKED ACCOUNTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function LockedAccountsTab({ students, showNotification, reloadStudents }) {
  const [lockedList, setLockedList] = useState([])

  useEffect(() => { loadLocked() }, [])

  const loadLocked = () => {
    const attempts = JSON.parse(localStorage.getItem('loginAttempts')) || {}
    const locked = Object.entries(attempts)
      .filter(([_, data]) => data.locked)
      .map(([matricNumber, data]) => ({
        matricNumber,
        attempts: data.count,
        student: students.find(s => s.matricNumber === matricNumber)
      }))
    setLockedList(locked)
  }

  const handleUnlock = (matricNumber) => {
    if (!window.confirm(`Unlock account for ${matricNumber}?`)) return
    unlockAccount(matricNumber)
    loadLocked()
    showNotification(`Account ${matricNumber} has been unlocked successfully.`)
  }

  const handleUnlockAll = () => {
    if (!window.confirm('Unlock ALL locked accounts?')) return
    const attempts = JSON.parse(localStorage.getItem('loginAttempts')) || {}
    Object.keys(attempts).forEach(key => delete attempts[key])
    localStorage.setItem('loginAttempts', JSON.stringify(attempts))
    loadLocked()
    showNotification('All locked accounts have been unlocked.')
  }

  return (
    <div className="locked-tab">
      <div className="tab-toolbar">
        <div className="alert alert-info" style={{ flex: 1, marginBottom: 0 }}>
          🔒 Students are locked after <strong>3 failed login attempts</strong>. Only an admin can unlock them.
        </div>
        {lockedList.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleUnlockAll}>
            🔓 Unlock All
          </button>
        )}
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">
          🔒 {lockedList.length} Locked Account{lockedList.length !== 1 ? 's' : ''}
        </h3>

        {lockedList.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>✅</div>
            <p>No locked accounts. All students can log in normally.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Matric No.</th>
                  <th>Department</th>
                  <th>Failed Attempts</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lockedList.map(({ matricNumber, attempts, student }) => (
                  <tr key={matricNumber}>
                    <td>
                      {student ? (
                        <div className="table-student">
                          <div className="student-initials">
                            {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="student-name">{student.fullName}</div>
                            <div className="student-email">{student.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>Unknown student</span>
                      )}
                    </td>
                    <td><code>{matricNumber}</code></td>
                    <td>{student?.department || '—'}</td>
                    <td>
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                        {attempts} / 3
                      </span>
                    </td>
                    <td>
                      <span className="voted-pill" style={{ background: '#fdecea', color: 'var(--danger)' }}>
                        🔒 Locked
                      </span>
                    </td>
                    <td>
                      <button
                        className="tbl-btn"
                        style={{ background: '#eafaf1', color: 'var(--success)', fontWeight: 700 }}
                        onClick={() => handleUnlock(matricNumber)}
                      >
                        🔓 Unlock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY TAB
// ─────────────────────────────────────────────────────────────────────────────
function ActivityTab({ votes, students, candidates }) {
  const records = votes.records || []

  const getStudentById  = (id) => students.find(s => s.id === id)
  const getCandidateById = (id) => candidates.find(c => c.id === id)

  return (
    <div className="activity-tab">
      <div className="admin-card">
        <h3 className="admin-card-title">📋 Vote Records — {records.length} total entries</h3>
        {records.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🗳️</div>
            <p>No votes have been cast yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Position</th>
                  <th>Voted For</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => {
                  const student   = getStudentById(record.studentId)
                  const candidate = getCandidateById(record.candidateId)
                  return (
                    <tr key={index}>
                      <td style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>{index + 1}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>{student?.fullName || record.studentId}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>{student?.matricNumber}</div>
                        </div>
                      </td>
                      <td><span className="position-pill">{record.position}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{candidate?.fullName || record.candidateId}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>{candidate?.department}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                        {new Date(record.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard