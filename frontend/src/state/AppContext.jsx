// src/state/AppContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext(null)
const LS_KEY = 'tesco_zendesk_admin_ctx'

export function AppProvider({ children }) {
  const [businessArea, setBusinessArea] = useState('colleague')
  const [environment, setEnvironment] = useState('ppe')
  const [jiraTicket, setJiraTicket] = useState('')

  // NEW: Jira status state
  const [jiraStatus, setJiraStatus] = useState('')
  const [jiraLoading, setJiraLoading] = useState(false)
  const [jiraError, setJiraError] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      try {
        const v = JSON.parse(raw)
        if (v.businessArea) setBusinessArea(v.businessArea)
        if (v.environment) setEnvironment(v.environment)
        if (v.jiraTicket) setJiraTicket(v.jiraTicket)
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ businessArea, environment, jiraTicket }))
  }, [businessArea, environment, jiraTicket])

  const value = useMemo(() => ({
    businessArea, setBusinessArea,
    environment, setEnvironment,
    jiraTicket, setJiraTicket,

    // expose new Jira status fields
    jiraStatus, setJiraStatus,
    jiraLoading, setJiraLoading,
    jiraError, setJiraError,
  }), [businessArea, environment, jiraTicket, jiraStatus, jiraLoading, jiraError])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}