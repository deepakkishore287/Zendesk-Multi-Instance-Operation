
import React, { useState } from 'react'
import { useApp } from '../state/AppContext'
import { api } from '../api/client'

export default function JiraStatus() {
  const { jiraTicket } = useApp()
  const [input, setInput] = useState(jiraTicket)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onCheck() {
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await api.jiraStatus(input)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="panel">
      <h2>Jira status</h2>
      <div className="row">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="TES-1234" />
        <button onClick={onCheck} disabled={!input || loading}>{loading ? 'Checking…' : 'Check'}</button>
      </div>
      {error && <div className="note error">{error}</div>}
      {result && !result.error && (
        <div className="note success">Ticket <strong>{result.key}</strong> status: <strong>{result.statusName}</strong></div>
      )}
      {result && result.error && (
        <div className="note warning">Validation failed: {result.details || result.error} {result.statusName ? `(status: ${result.statusName})` : ''}</div>
      )}
    </div>
  )
}
