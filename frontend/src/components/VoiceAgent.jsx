import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mic, MicOff, X, Volume2 } from 'lucide-react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

/**
 * VoiceAgent — A premium floating voice assistant for the attendance system.
 *
 * Capabilities:
 *  1. Mark attendance in bulk ("mark everyone present / absent / late")
 *  2. Navigate anywhere ("go to dashboard", "show defaulters", etc.)
 *  3. Answer contextual questions ("how many defaulters", "what subjects do I teach")
 *  4. Utility commands ("sign out", "refresh")
 */
export default function VoiceAgent({
  profile,
  subjects,
  stats,
  defaulters,
  attendanceEntries,
  setAttendanceEntries,
  onMarkAllStatus,
  onGenerateDefaultersPDF,
  onSignOut,
  showToast,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [agentResponse, setAgentResponse] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [history, setHistory] = useState([])

  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const timeoutRef = useRef(null)

  // ─── Speak a response aloud ───────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.volume = 0.9
    // Prefer a clear English voice
    const voices = synthRef.current.getVoices()
    const preferred = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft')),
    )
    if (preferred) utterance.voice = preferred
    synthRef.current.speak(utterance)
  }, [])

  // ─── Process the voice command ────────────────────────────────────────────
  const processCommand = useCallback(
    (raw) => {
      const text = raw.toLowerCase().trim()
      let response = ''

      // ── Attendance bulk commands ──────────────────────────────────────────
      if (
        text.includes('mark everyone present') ||
        text.includes('mark all present') ||
        text.includes('mark all students present') ||
        text.includes('everyone present')
      ) {
        if (location.pathname !== '/teacher/attendance') {
          navigate('/teacher/attendance')
          response = 'Navigating to attendance studio. Say the command again once there.'
        } else if (!attendanceEntries || attendanceEntries.length === 0) {
          response = 'No students are loaded yet. Please select a subject first.'
        } else {
          onMarkAllStatus('present')
          response = `Done! Marked all ${attendanceEntries.length} students as present.`
        }
      } else if (
        text.includes('mark everyone absent') ||
        text.includes('mark all absent') ||
        text.includes('mark all students absent') ||
        text.includes('everyone absent')
      ) {
        if (location.pathname !== '/teacher/attendance') {
          navigate('/teacher/attendance')
          response = 'Navigating to attendance studio. Say the command again once there.'
        } else if (!attendanceEntries || attendanceEntries.length === 0) {
          response = 'No students loaded. Select a subject first.'
        } else {
          onMarkAllStatus('absent')
          response = `Marked all ${attendanceEntries.length} students as absent.`
        }
      } else if (
        text.includes('mark everyone late') ||
        text.includes('mark all late') ||
        text.includes('mark all students late') ||
        text.includes('everyone late')
      ) {
        if (location.pathname !== '/teacher/attendance') {
          navigate('/teacher/attendance')
          response = 'Navigating to attendance studio first.'
        } else if (!attendanceEntries || attendanceEntries.length === 0) {
          response = 'No students loaded. Select a subject first.'
        } else {
          onMarkAllStatus('late')
          response = `Marked all ${attendanceEntries.length} students as late.`
        }
      }

      // ── PDF / Export commands ──────────────────────────────────────────────
      else if (
        text.includes('generate defaulter') ||
        text.includes('download defaulter') ||
        text.includes('export defaulter') ||
        text.includes('defaulters list') ||
        text.includes('defaulters pdf') ||
        text.includes('defaulters report') ||
        text.includes('generate report') ||
        text.includes('download report') ||
        text.includes('export report')
      ) {
        if (!defaulters || defaulters.length === 0) {
          response = 'There are no defaulters to export. The list is empty.'
        } else {
          onGenerateDefaultersPDF?.()
          response = `Generating PDF report with ${defaulters.length} defaulter entries. The download should start shortly.`
          // Navigate to defaulters page so user can see the data
          if (profile?.role === 'teacher' && location.pathname !== '/teacher/defaulters') {
            navigate('/teacher/defaulters')
          } else if (profile?.role === 'admin' && location.pathname !== '/admin/defaulters') {
            navigate('/admin/defaulters')
          }
        }
      }

      // ── Navigation commands ───────────────────────────────────────────────
      else if (
        text.includes('go to dashboard') ||
        text.includes('open dashboard') ||
        text.includes('show dashboard') ||
        text.includes('show overview') ||
        text.includes('go to overview')
      ) {
        navigate('/dashboard')
        response = 'Opening the dashboard overview.'
      } else if (
        text.includes('go to attendance') ||
        text.includes('open attendance') ||
        text.includes('show attendance') ||
        text.includes('attendance studio') ||
        text.includes('take attendance') ||
        text.includes('mark attendance')
      ) {
        if (profile?.role === 'teacher') {
          navigate('/teacher/attendance')
          response = 'Opening the Attendance Studio.'
        } else if (profile?.role === 'student') {
          navigate('/student/attendance')
          response = 'Opening your attendance summary.'
        } else {
          response = "Attendance pages are available for teachers and students."
        }
      } else if (
        text.includes('go to defaulter') ||
        text.includes('open defaulter') ||
        text.includes('show defaulter') ||
        text.includes('defaulter radar') ||
        text.includes('defaulters')
      ) {
        if (profile?.role === 'teacher') {
          navigate('/teacher/defaulters')
          response = 'Opening the Defaulters Radar.'
        } else if (profile?.role === 'admin') {
          navigate('/admin/defaulters')
          response = 'Opening global defaulters view.'
        } else {
          response = "Defaulter views are available for teachers and admins."
        }
      } else if (
        text.includes('go to users') ||
        text.includes('manage users') ||
        text.includes('show users') ||
        text.includes('role control') ||
        text.includes('open users')
      ) {
        if (profile?.role === 'admin') {
          navigate('/admin/users')
          response = 'Opening Role Control panel.'
        } else {
          response = 'User management is only available for admins.'
        }
      }

      // ── Contextual questions ──────────────────────────────────────────────
      else if (
        text.includes('how many defaulter') ||
        text.includes('total defaulter') ||
        text.includes('number of defaulter')
      ) {
        const count = defaulters?.length || 0
        if (count === 0) {
          response = 'Great news! There are currently no defaulters.'
        } else {
          const names = defaulters
            .slice(0, 3)
            .map((d) => d.student_name)
            .join(', ')
          response = `There are ${count} defaulter entries. Including ${names}${count > 3 ? ' and more' : ''}.`
        }
      } else if (
        text.includes('who are the defaulter') ||
        text.includes('list defaulter') ||
        text.includes('show me defaulter')
      ) {
        if (!defaulters || defaulters.length === 0) {
          response = 'No defaulters found. All students are above 75% attendance.'
        } else {
          const summaries = defaulters.slice(0, 5).map(
            (d) => `${d.student_name} in ${d.subject_name} at ${d.attendance_percentage}%`,
          )
          response = `Defaulters: ${summaries.join('. ')}${defaulters.length > 5 ? '. And more.' : '.'}`
        }
        if (profile?.role === 'teacher') {
          navigate('/teacher/defaulters')
        } else if (profile?.role === 'admin') {
          navigate('/admin/defaulters')
        }
      } else if (
        text.includes('how many student') ||
        text.includes('total student') ||
        text.includes('number of student')
      ) {
        const count = attendanceEntries?.length || stats?.total_students || 0
        response = `There are ${count} students currently loaded.`
      } else if (
        text.includes('how many subject') ||
        text.includes('total subject') ||
        text.includes('what subject') ||
        text.includes('my subject') ||
        text.includes('list subject')
      ) {
        if (subjects && subjects.length > 0) {
          const names = subjects.map((s) => s.name).join(', ')
          response = `You have ${subjects.length} subjects: ${names}.`
        } else {
          response = 'No subjects found.'
        }
      } else if (text.includes('what is my role') || text.includes('who am i')) {
        response = `You are logged in as ${profile?.full_name || 'unknown'}, with the role of ${profile?.role || 'unknown'}.`
      } else if (
        text.includes('what page') ||
        text.includes('where am i') ||
        text.includes('current page')
      ) {
        const pageNames = {
          '/dashboard': 'Dashboard Overview',
          '/teacher/attendance': 'Attendance Studio',
          '/teacher/defaulters': 'Defaulters Radar',
          '/student/attendance': 'My Attendance',
          '/admin/users': 'Role Control',
          '/admin/defaulters': 'Global Defaulters',
          '/auth': 'Login Page',
        }
        response = `You are on the ${pageNames[location.pathname] || location.pathname} page.`
      }

      // ── Utility commands ──────────────────────────────────────────────────
      else if (
        text.includes('sign out') ||
        text.includes('log out') ||
        text.includes('logout') ||
        text.includes('sign off')
      ) {
        response = 'Signing you out. Goodbye!'
        setTimeout(() => onSignOut(), 1500)
      } else if (text.includes('help') || text.includes('what can you do')) {
        response =
          'I can mark attendance for you. Say "mark everyone present" or "mark everyone absent". ' +
          'I can navigate the app — try "go to dashboard" or "show defaulters". ' +
          'Say "generate defaulters list" to download a PDF report. ' +
          'Ask me questions like "how many defaulters" or "what subjects do I teach".'
      } else if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
        response = `Hello ${profile?.full_name || 'there'}! How can I help you today?`
      } else if (text.includes('thank')) {
        response = "You're welcome! Let me know if you need anything else."
      }

      // ── Fallback ──────────────────────────────────────────────────────────
      else {
        response = `I heard "${raw}". I'm not sure how to help with that. Say "help" to see what I can do.`
      }

      return response
    },
    [
      attendanceEntries,
      defaulters,
      location.pathname,
      navigate,
      onGenerateDefaultersPDF,
      onMarkAllStatus,
      onSignOut,
      profile,
      stats,
      subjects,
    ],
  )

  // ─── Initialize speech recognition ────────────────────────────────────────
  useEffect(() => {
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += t
        } else {
          interim += t
        }
      }

      setTranscript(final || interim)

      if (final) {
        clearTimeout(timeoutRef.current)
        const response = processCommand(final)
        setAgentResponse(response)
        speak(response)
        setHistory((prev) => [
          { type: 'user', text: final },
          { type: 'agent', text: response },
          ...prev,
        ].slice(0, 20))

        // Auto-stop after processing
        setTimeout(() => {
          setListening(false)
          setTranscript('')
        }, 300)
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.warn('Speech recognition error:', event.error)
      }
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      clearTimeout(timeoutRef.current)
    }
  }, [processCommand, speak])

  // ─── Toggle listening ─────────────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    if (!SpeechRecognition) {
      showToast?.('error', 'Speech recognition is not supported in this browser.')
      return
    }

    if (listening) {
      recognitionRef.current?.abort()
      setListening(false)
      setTranscript('')
    } else {
      setTranscript('')
      setAgentResponse('')
      try {
        recognitionRef.current?.start()
        setListening(true)
        setShowPanel(true)
      } catch (err) {
        console.warn('Could not start recognition:', err)
      }
    }
  }, [listening, showToast])

  // Don't render if Speech API is not available
  if (!SpeechRecognition) return null

  return (
    <>
      {/* ── Floating Mic Button ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={toggleListening}
        className={`voice-agent-fab ${listening ? 'voice-agent-fab--active' : ''}`}
        aria-label={listening ? 'Stop listening' : 'Start voice assistant'}
        title="Voice Assistant"
      >
        {listening ? (
          <MicOff className="voice-agent-fab__icon" />
        ) : (
          <Mic className="voice-agent-fab__icon" />
        )}
        {listening && (
          <>
            <span className="voice-agent-pulse voice-agent-pulse--1" />
            <span className="voice-agent-pulse voice-agent-pulse--2" />
            <span className="voice-agent-pulse voice-agent-pulse--3" />
          </>
        )}
      </button>

      {/* ── Panel / Overlay ──────────────────────────────────────────────── */}
      {showPanel && (
        <div className="voice-agent-panel">
          <div className="voice-agent-panel__header">
            <div className="voice-agent-panel__title">
              <Volume2 className="h-4 w-4" />
              <span>Voice Assistant</span>
            </div>
            <button
              type="button"
              onClick={() => { setShowPanel(false); setListening(false); recognitionRef.current?.abort() }}
              className="voice-agent-panel__close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="voice-agent-panel__body">
            {/* Live transcript */}
            {listening && (
              <div className="voice-agent-listening">
                <div className="voice-agent-wave">
                  <span /><span /><span /><span /><span />
                </div>
                <p className="voice-agent-listening__label">Listening…</p>
              </div>
            )}

            {transcript && (
              <div className="voice-agent-bubble voice-agent-bubble--user">
                <p>{transcript}</p>
              </div>
            )}

            {agentResponse && !listening && (
              <div className="voice-agent-bubble voice-agent-bubble--agent">
                <p>{agentResponse}</p>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="voice-agent-history">
                <p className="voice-agent-history__divider">Recent</p>
                {history.map((entry, i) => (
                  <div
                    key={i}
                    className={`voice-agent-bubble voice-agent-bubble--${entry.type} voice-agent-bubble--small`}
                  >
                    <p>{entry.text}</p>
                  </div>
                ))}
              </div>
            )}

            {!listening && !agentResponse && history.length === 0 && (
              <div className="voice-agent-empty">
                <Mic className="h-8 w-8 text-slate-400" />
                <p>Tap the mic and speak a command</p>
                <div className="voice-agent-hints">
                  <span>"Mark everyone present"</span>
                  <span>"Show defaulters"</span>
                  <span>"Go to dashboard"</span>
                  <span>"Generate defaulters list"</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick action bar */}
          <div className="voice-agent-panel__footer">
            <button
              type="button"
              onClick={toggleListening}
              className={`voice-agent-mic-btn ${listening ? 'voice-agent-mic-btn--active' : ''}`}
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              <span>{listening ? 'Stop' : 'Speak'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
