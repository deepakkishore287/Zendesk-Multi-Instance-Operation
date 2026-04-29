// src/components/EnvBar.jsx
import React, { useEffect, useRef } from 'react'
import { useApp } from '../state/AppContext'
import { api } from '../api/client'

const AREAS = ['technology', 'colleague', 'security', 'customer', 'supplier']
const ENVS = ['ppe', 'prod']

export default function EnvBar() {
  const {
    businessArea, setBusinessArea,
    environment, setEnvironment,
    jiraTicket, setJiraTicket,
    jiraStatus, setJiraStatus,
    jiraLoading, setJiraLoading,
    jiraError, setJiraError
  } = useApp()

  const debounceRef = useRef(null)

  // Debounced checker: whenever jiraTicket changes, trigger a check after user stops typing.
  useEffect(() => {
    // Reset status when ticket cleared
    if (!jiraTicket) {
      setJiraStatus('')
      setJiraError('')
      setJiraLoading(false)
      return
    }

    // Debounce to avoid spamming the backend while typing
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        setJiraLoading(true)
        setJiraError('')
        setJiraStatus('')

        const data = await api.jiraStatus(jiraTicket) // calls GET /jira?jiraTicket=
        if (data && !data.error) {
          setJiraStatus(data.statusName || '')
        } else {
          setJiraStatus('')
          setJiraError(data?.details || data?.error || 'Validation failed')
        }
      } catch (e) {
        setJiraStatus('')
        setJiraError(e.message || 'Failed to check Jira status')
      } finally {
        setJiraLoading(false)
      }
    }, 350) // 350ms feels responsive

    return () => clearTimeout(debounceRef.current)
  }, [jiraTicket, setJiraStatus, setJiraError, setJiraLoading])

  const statusChip = (
    <>
      {jiraLoading && <span className="note" style={{ padding: '6px 8px' }}>Checking…</span>}
      {!jiraLoading && jiraStatus && (
        <span
          className={`note ${jiraStatus === 'Change Approved' ? 'success' : 'warning'}`}
          style={{ padding: '6px 8px' }}
        >
          Status: <strong>{jiraStatus}</strong>
        </span>
      )}
      {!jiraLoading && jiraError && (
        <span className="note error" style={{ padding: '6px 8px' }}>
          {jiraError}
        </span>
      )}
    </>
  )

  return (
    <div className="envbar">
      <div className="envbar-row">
        <label>
          Business Area
          <select value={businessArea} onChange={e => setBusinessArea(e.target.value)}>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label>
          Environment
          <select value={environment} onChange={e => setEnvironment(e.target.value)}>
            {ENVS.map(e1 => <option key={e1} value={e1}>{e1}</option>)}
          </select>
        </label>
        <label className="jira">
          Jira Ticket (required for prod)
          <input
            value={jiraTicket}
            onChange={e => setJiraTicket(e.target.value)}
            placeholder="TES-1234"
          />
        </label>

        {/* Live status chip */}
        {statusChip}
      </div>

      {environment === 'prod' && !jiraTicket && (
        <div className="note warning">Jira ticket is required for PROD operations.</div>
      )}
    </div>
  )
}