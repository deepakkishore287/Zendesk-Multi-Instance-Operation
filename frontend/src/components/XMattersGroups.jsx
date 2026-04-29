// src/components/XMattersGroups.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/AppContext'
import { api } from '../api/client'
import Pagination from './Pagination'

export default function XMattersGroups() {
  const { businessArea, environment, jiraTicket, jiraStatus } = useApp()

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [search, setSearch] = useState('')

  // PROD‑only Jira gating — same as backend ensureJiraIfProd
  const prodBlocked = environment === 'prod' && !(jiraTicket && jiraStatus === 'Change Approved')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await api.xmListGroups(businessArea, environment)
      setGroups(data.groups || [])
      setPage(1)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [businessArea, environment])

  // ---------- SEARCH + PAGINATION ----------
  const filtered = useMemo(() => {
    if (!search.trim()) return groups
    const q = search.toLowerCase()
    return groups.filter(g =>
      (g.name || '').toLowerCase().includes(q) ||
      (g.description || '').toLowerCase().includes(q) ||
      String(g.id || '').includes(q)
    )
  }, [groups, search])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  async function onCreate() {
    try {
      await api.xmCreateGroup(businessArea, environment, jiraTicket, {
        name: newName,
        description: newDesc,
      })
      setNewName(''); setNewDesc('')
      await load()
    } catch (e) { setError(e.message) }
  }

  async function onUpdate(id, name, description) {
    try {
      await api.xmUpdateGroup(businessArea, environment, jiraTicket, id, {
        name, description
      })
      await load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div>
      <div className="panel">
        <h2>xMatters Groups</h2>

        {/* Search box */}
        <div className="row" style={{ marginBottom: 12 }}>
          <input
            placeholder="Search groups…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ minWidth: 260 }}
          />
        </div>

        <div className="row">
          <input
            placeholder="New group name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <button
            onClick={onCreate}
            disabled={!newName || prodBlocked}
            title={prodBlocked ? 'Jira status must be "Change Approved" in PROD' : undefined}
          >
            Create
          </button>
        </div>

        {environment === 'prod' && prodBlocked && (
          <div className="note warning">
            In <strong>PROD</strong>, creating/updating is allowed only when Jira status is <strong>Change Approved</strong>.
          </div>
        )}

        {error && <div className="note error">{error}</div>}
      </div>

      <div className="panel">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {pagedItems.map(g => (
                  <XGroupRow
                    key={g.id}
                    g={g}
                    onUpdate={onUpdate}
                    disabled={prodBlocked}
                  />
                ))}
                {pagedItems.length === 0 && (
                  <tr><td colSpan={4} className="muted">No results found</td></tr>
                )}
              </tbody>
            </table>

            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
            />
          </>
        )}
      </div>
    </div>
  )
}

function XGroupRow({ g, onUpdate, disabled }) {
  const [name, setName] = useState(g.targetName || '')
  const [desc, setDesc] = useState(g.description || '')

  const changed =
    name !== (g.name || '') ||
    desc !== (g.description || '')

  return (
    <tr>
      <td>{g.id}</td>
      <td><input value={name} onChange={e => setName(e.target.value)} /></td>
      <td><input value={desc} onChange={e => setDesc(e.target.value)} /></td>
      <td>
        <button
          onClick={() => onUpdate(g.id, name, desc)}
          disabled={!changed || disabled}
          title={disabled ? 'Jira status must be "Change Approved" in PROD' : undefined}
        >
          Save
        </button>
      </td>
    </tr>
  )
}