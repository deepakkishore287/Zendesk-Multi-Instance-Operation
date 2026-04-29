import React, { useState } from 'react'
import EnvBar from './components/EnvBar'
import JiraStatus from './components/JiraStatus'
import XMattersGroups from './components/XMattersGroups'
import Groups from './components/Groups'
import Fields from './components/Fields'
import { api } from './api/client' // use your existing API wrapper

export default function App() {
  const [tab, setTab] = useState('groups')

  // Health check local UI state
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthResult, setHealthResult] = useState(null)
  const [healthOk, setHealthOk] = useState(null) // null = unknown

  const handleHealthCheck = async () => {
    try {
      setHealthLoading(true)
      setHealthResult(null)
      const data = await api.health()

      // Normalize a few common shapes from /health
      const ok =
        (typeof data === 'string' && data.toLowerCase().includes('ok')) ||
        data?.status?.toLowerCase?.() === 'ok' ||
        data?.ok === true

      setHealthOk(!!ok)
      setHealthResult(data)
    } catch (err) {
      setHealthOk(false)
      setHealthResult({ error: err?.message || 'Health check failed', details: err?.details })
    } finally {
      setHealthLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tesco Zendesk Admin</h1>

        {/* Right-aligned actions */}
        <div className="header-actions">
          {/* Optional status dot showing last result */}
          <span
            className={`health-dot ${healthOk === null ? 'unknown' : healthOk ? 'ok' : 'fail'
              }`}
            title={
              healthOk === null ? 'Health: Unknown' : healthOk ? 'Health: OK' : 'Health: Unhealthy'
            }
            aria-label="Health status indicator"
          />
          <button
            className="health-btn"
            onClick={handleHealthCheck}
            disabled={healthLoading}
            title="Check service health"
          >
            {healthLoading ? 'Checking…' : 'Health'}
          </button>
        </div>
      </header>

      {/* Optional banner with last result */}
      {healthResult && (
        <div className={`note ${healthResult.error ? 'error' : 'success'} health-banner`}>
          <span className="health-message">
            {healthResult.error
              ? `❌ ${healthResult.error}`
              : `✅ Health${healthResult?.status ? `: ${healthResult.status}` : ''}`}
          </span>

          <button
            className="health-close"
            onClick={() => setHealthResult(null)}
            aria-label="Dismiss"
            title="Dismiss"
          >
            ❌
          </button>
        </div>
      )}

      <EnvBar />

      <nav className="tabs">
        <button className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}>Groups</button>
        <button className={tab === 'fields' ? 'active' : ''} onClick={() => setTab('fields')}>Fields</button>
        <button className={tab === 'xmatters' ? 'active' : ''} onClick={() => setTab('xmatters')}>xMatters</button>
        <button className={tab === 'jira' ? 'active' : ''} onClick={() => setTab('jira')}>Jira</button>
      </nav>

      <main className="content">
        {tab === 'groups' && <Groups />}
        {tab === 'fields' && <Fields />}
        {tab === 'xmatters' && <XMattersGroups />}
        {tab === 'jira' && <JiraStatus />}
      </main>

      <footer className="app-footer">© Tesco (internal tools) — Support UI</footer>
    </div>
  )
}
