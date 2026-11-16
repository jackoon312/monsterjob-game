import { useEffect, useState, useRef } from 'react';
import * as jobsApi from '../api/jobs';
import * as assignmentsApi from '../api/assignments';

// Renders remaining time as mm:ss, floors at 0 so it never shows negative
const formatRemaining = (endTime) => {
  const ms = new Date(endTime).getTime() - Date.now();
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const JobsPanel = ({ creatures, office, onAssignmentChange }) => {
  const [selectedCreatureId, setSelectedCreatureId] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState('');
  const [busyJobId, setBusyJobId] = useState(null);
  const [, forceTick] = useState(0);
  const tickRef = useRef(null);

  // Idle creatures = not currently assigned to a job (currentJob is null)
  const idleCreatures = creatures.filter((c) => !c.currentJob);
  const atJobSlotCapacity = office && activeAssignments.length >= office.jobSlots;

  const loadActiveAssignments = async () => {
    try {
      const { assignments } = await assignmentsApi.getActiveAssignments();
      setActiveAssignments(assignments);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load active assignments.');
    }
  };

  useEffect(() => {
    loadActiveAssignments();
  }, []);

  // Re-render once a second so countdowns actually count down
  useEffect(() => {
    tickRef.current = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  useEffect(() => {
    if (!selectedCreatureId) {
      setRecommendations([]);
      return;
    }
    setLoadingRecs(true);
    setError('');
    jobsApi
      .getRecommendations(selectedCreatureId)
      .then(({ recommendations: recs }) => setRecommendations(recs))
      .catch((err) => setError(err.response?.data?.message || 'Could not load job recommendations.'))
      .finally(() => setLoadingRecs(false));
  }, [selectedCreatureId]);

  const handleAssign = async (jobId) => {
    if (atJobSlotCapacity) return;
    setBusyJobId(jobId);
    setError('');
    try {
      await assignmentsApi.createAssignment(selectedCreatureId, jobId);
      setSelectedCreatureId('');
      setRecommendations([]);
      await loadActiveAssignments();
      onAssignmentChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not assign that job.');
    } finally {
      setBusyJobId(null);
    }
  };

  const handleComplete = async (assignmentId) => {
    setError('');
    try {
      const result = await assignmentsApi.completeAssignment(assignmentId);
      await loadActiveAssignments();
      onAssignmentChange?.();
      if (result.assignment?.status === 'Completed') {
        setError(''); // could surface a success toast here later
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Job is not finished yet.');
    }
  };

  const handleCancel = async (assignmentId) => {
    setError('');
    try {
      await assignmentsApi.cancelAssignment(assignmentId);
      await loadActiveAssignments();
      onAssignmentChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel that assignment.');
    }
  };

  return (
    <div className="side-panel">
      <h2>Assign a Job</h2>
      {error && <div className="error-banner">{error}</div>}

      {atJobSlotCapacity && (
        <p className="error-banner">
          All job slots are full ({activeAssignments.length}/{office.jobSlots}). Upgrade your
          office or wait for one to finish.
        </p>
      )}

      <div className="species-picker">
        <select value={selectedCreatureId} onChange={(e) => setSelectedCreatureId(e.target.value)}>
          <option value="">Select an idle creature...</option>
          {idleCreatures.map((c) => (
            <option key={c._id} value={c._id}>
              {c.nickname} (Lv. {c.level})
            </option>
          ))}
        </select>
      </div>

      {idleCreatures.length === 0 && (
        <p className="creature-list__empty" style={{ marginTop: 10 }}>
          All your creatures are already working, or you have none yet.
        </p>
      )}

      {loadingRecs && <p style={{ fontSize: 14 }}>Finding jobs it qualifies for...</p>}

      {!loadingRecs && selectedCreatureId && recommendations.length === 0 && (
        <p className="creature-list__empty" style={{ marginTop: 10 }}>
          This creature doesn't qualify for any jobs yet - try leveling it up or equipping gear.
        </p>
      )}

      {recommendations.length > 0 && (
        <ul className="creature-list" style={{ marginTop: 10 }}>
          {recommendations.map(({ job, matchScore }) => (
            <li key={job._id} className="creature-list__item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{job.name}</strong>
                <span>💰{job.baseSalary} · {job.durationMinutes}m</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {job.difficulty} · risk {job.riskFactor}% · match +{matchScore}
                </span>
                <button
                  className="btn-primary"
                  style={
                    atJobSlotCapacity
                      ? {
                          width: 'auto',
                          padding: '6px 14px',
                          background: '#5a4a3a',
                          color: '#a89a88',
                          cursor: 'not-allowed'
                        }
                      : { width: 'auto', padding: '6px 14px' }
                  }
                  onClick={() => handleAssign(job._id)}
                  disabled={busyJobId === job._id || atJobSlotCapacity}
                  title={atJobSlotCapacity ? 'All job slots are full' : undefined}
                >
                  {busyJobId === job._id ? 'Assigning...' : atJobSlotCapacity ? 'Slots Full' : 'Assign'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ marginTop: 22 }}>Active Assignments</h2>
      <ul className="creature-list">
        {activeAssignments.length === 0 && (
          <li className="creature-list__empty">No creatures are currently working.</li>
        )}
        {activeAssignments.map((a) => {
          const ready = new Date(a.endTime).getTime() <= Date.now();
          return (
            <li key={a._id} className="creature-list__item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{a.creatureId?.nickname}</strong>
                <span>{a.jobId?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {ready ? 'Ready!' : `⏱ ${formatRemaining(a.endTime)}`}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {ready && (
                    <button
                      className="btn-primary"
                      style={{ width: 'auto', padding: '6px 10px' }}
                      onClick={() => handleComplete(a._id)}
                    >
                      Collect
                    </button>
                  )}
                  <button className="btn-link" onClick={() => handleCancel(a._id)}>
                    Cancel
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default JobsPanel;
