// src/components/Fields.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/AppContext'
import { api } from '../api/client'
import OptionsEditor from './OptionsEditor'
import Pagination from './Pagination'

export default function Fields() {
  const { businessArea, environment, jiraTicket, jiraStatus } = useApp()

  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [type, setType] = useState('text')
  const [description, setDescription] = useState('')
  const [required, setRequired] = useState(false)

  const [search, setSearch] = useState('')

  const prodBlocked = environment === 'prod' && !(jiraTicket && jiraStatus === 'Change Approved')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await api.listFields(businessArea, environment)
      setFields(data.ticket_fields || [])
      setPage(1)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [businessArea, environment])

  // ----------- SEARCH + PAGINATION PIPELINE -----------
  const filtered = useMemo(() => {
    if (!search.trim()) return fields
    const q = search.toLowerCase()
    return fields.filter(f =>
      (f.title || '').toLowerCase().includes(q) ||
      (f.type || '').toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q) ||
      String(f.id || '').includes(q) ||
      (f.required ? 'true' : 'false').includes(q) ||
      (f.removable ? 'custom field' : 'standard field').toLowerCase().includes(q)
    )
  }, [fields, search])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  async function onCreate() {
    try {
      await api.createField(businessArea, environment, jiraTicket, {
        title, type, description, required
      })
      setTitle(''); setType('text'); setDescription(''); setRequired(false)
      await load()
    } catch (e) { setError(e.message) }
  }

  async function onUpdate(id, f) {
    try {
      await api.updateField(businessArea, environment, jiraTicket, id, f)
      await load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div>
      <div className="panel">
        <h2>Fields</h2>

        {/* Search box */}
        <div className="row" style={{ marginBottom: 12 }}>
          <input
            placeholder="Search fields…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ minWidth: 260 }}
          />
        </div>

        <div className="row">
          <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="text">text</option>
            <option value="textarea">Multi-line</option>
            <option value="checkbox">Checkbox</option>
            <option value="date">Date</option>
            <option value="integer">Numeric</option>
            <option value="decimal">Decimal</option>
            <option value="regexp">Regex</option>
            <option value="partialcreditcard">partialcreditcard</option>
            <option value="multiselect">multiselect</option>
            <option value="tagger">Drop-down</option>
            <option value="lookup">lookup</option>
          </select>
          <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
          <label className="inline">
            <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />
            {' '}Required
          </label>
          <button
            onClick={onCreate}
            disabled={!title || !type || prodBlocked}
            title={prodBlocked ? 'Jira status must be "Change Approved" in PROD' : undefined}
          >
            Create
          </button>
        </div>

        {environment === 'prod' && prodBlocked && (
          <div className="note warning">In PROD, creating/updating is allowed only when Jira status is <strong>Change Approved</strong>.</div>
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
                  <th>Title</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Required</th>
                  <th>Tag</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {pagedItems.map(f => (
                  <FieldRow
                    key={f.id}
                    f={f}
                    onUpdate={onUpdate}
                    disabled={prodBlocked}
                  />
                ))}
                {pagedItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">No results found</td>
                  </tr>
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

function FieldRow({ f, onUpdate, disabled }) {
  const [title, setTitle] = useState(f.title || '')
  const [type, setType] = useState(f.type || 'unknown')
  const [description, setDescription] = useState(f.description || '')
  const [required, setRequired] = useState(!!f.required)
  const [showOptions, setShowOptions] = useState(false)

  const changed =
    title !== (f.title || '') ||
    type !== (f.type || '') ||
    description !== (f.description || '') ||
    required !== !!f.required

  const supportsOptions = type === 'tagger' || type === 'multiselect'

  return (
    <>
      <tr>
        <td>{f.id}</td>
        <td><input value={title} onChange={e => setTitle(e.target.value)} /></td>
        <td>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="text">text</option>
            <option value="textarea">Multi-line</option>
            <option value="checkbox">Checkbox</option>
            <option value="date">Date</option>
            <option value="integer">Numeric</option>
            <option value="decimal">Decimal</option>
            <option value="regexp">Regex</option>
            <option value="partialcreditcard">partialcreditcard</option>
            <option value="multiselect">multiselect</option>
            <option value="tagger">Drop-down</option>
            <option value="lookup">lookup</option>
          </select>
        </td>
        <td><input value={description} onChange={e => setDescription(e.target.value)} /></td>
        <td className="center"><input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} /></td>
        <td>{f.removable ? "Custom field" : "Standard field"}</td>
        <td>
          <button
            onClick={() => onUpdate(f.id, { title, type, description, required })}
            disabled={!changed || disabled}
            title={disabled ? 'Jira status must be "Change Approved" in PROD' : undefined}
          >
            Save
          </button>
          {' '}
          {supportsOptions && (
            <button
              onClick={() => setShowOptions(s => !s)}
              disabled={!f.id || changed}
            >
              {showOptions ? 'Hide Options' : 'Options'}
            </button>
          )}
        </td>
      </tr>

      {showOptions && supportsOptions && f.id && !changed && (
        <tr>
          <td colSpan={7}>
            <OptionsEditor field={f} />
          </td>
        </tr>
      )}
    </>
  )
}