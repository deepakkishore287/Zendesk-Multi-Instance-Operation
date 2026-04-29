import React, { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import { api } from '../api/client'

export default function OptionsEditor({ field }) {
  const { businessArea, environment, jiraTicket } = useApp()
  const [opts, setOpts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Simple form for adding/updating an option
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [position, setPosition] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!field?.id) {
        setError('This field has no id yet. Please save it first.')
        return
      }
      setLoading(true); setError('')
      try {
        const data = await api.listFieldOptions(businessArea, environment, field.id)
        if (!cancelled) {
          // Shape can be { custom_field_options: [...] } or [...]
          const list = Array.isArray(data) ? data : (data.custom_field_options || [])
          setOpts(list)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [businessArea, environment, field?.id])

  async function onAddOrUpdate() {
    try {
      if (!field?.id) throw new Error('Field id missing')
      await api.upsertFieldOption(
        businessArea,
        environment,
        jiraTicket,
        field.id,
        {
          // id? for update, but we’ll handle only create here for brevity
          name,
          value,
          default: isDefault,
          position: position ? Number(position) : undefined
        }
      )
      // refresh list
      const data = await api.listFieldOptions(businessArea, environment, field.id)
      console.log(data)
      const list = Array.isArray(data) ? data : (data.custom_field_options || [])
      setOpts(list)
      setName(''); setValue(''); setIsDefault(false); setPosition('')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="panel" style={{"background-color": "#92a8d1"}}>
      <h4 style={{marginTop: 0}}>Options</h4>
      {loading && <div>Loading options…</div>}
      {error && <div className="note error">{error}</div>}

      {!loading && !error && (
        <>
          <table className="table" style={{marginTop: 8}}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Tag</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {opts.map((o, idx) => (
                <tr key={o.id || `${o.value}-${idx}`}>
                  <td>{o.name}</td>
                  <td>{o.value}</td>
                  <td>{o.position ?? ''}</td>
                </tr>
              ))}
              {opts.length === 0 && (
                <tr><td colSpan={4} className="muted">No options yet.</td></tr>
              )}
            </tbody>
          </table>

          <div className="row" style={{marginTop: 10}}>
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <input placeholder="Value" value={value} onChange={e => setValue(e.target.value)} />
            <label className="inline">
              <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
              {' '}Default
            </label>
            <input
              placeholder="Position (optional)"
              value={position}
              onChange={e => setPosition(e.target.value)}
              style={{maxWidth: 160}}
            />
            <button
              onClick={onAddOrUpdate}
              disabled={!name || !value}
            >
              Add option
            </button>
          </div>
        </>
      )}
    </div>
  )
}