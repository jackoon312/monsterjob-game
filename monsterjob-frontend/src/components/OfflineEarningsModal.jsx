import { useEffect, useState } from 'react';
import * as offlineApi from '../api/offline';

// Checks offline earnings ONCE when this component mounts (i.e. once per
// login/page load, not on every render or every panel refresh - repeatedly
// calling this would just keep resolving to "nothing new" since the backend
// resets lastLoginTime after each successful calculation). Only shows a
// modal if something was actually earned - silently does nothing otherwise,
// since there's no reason to interrupt the player with an empty summary.
const OfflineEarningsModal = ({ onEarningsApplied }) => {
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (checked) return;
    setChecked(true);
    offlineApi
      .calculateOfflineEarnings()
      .then((data) => {
        if (data.breakdown && data.breakdown.length > 0) {
          setResult(data);
        }
      })
      .catch((err) => {
        console.warn('Could not check offline earnings:', err.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setResult(null);
    onEarningsApplied?.();
  };

  if (!result) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h2>Welcome back!</h2>
        <p className="modal-panel__subtitle">
          Your creatures kept working while you were away ({result.offlineHoursApplied}h applied
          {result.offlineHoursApplied >= 8 ? ' - hit the 8h cap' : ''}).
        </p>

        <div className="modal-summary">
          <div className="modal-summary__stat">
            <div className="modal-summary__stat-value">💰{result.totalMoneyEarned}</div>
            <div className="modal-summary__stat-label">Money earned</div>
          </div>
          <div className="modal-summary__stat">
            <div className="modal-summary__stat-value">✨{result.totalXPEarned}</div>
            <div className="modal-summary__stat-label">XP earned</div>
          </div>
        </div>

        <ul className="creature-list" style={{ marginBottom: 18 }}>
          {result.breakdown.map((entry) => (
            <li key={entry.creatureId} className="creature-list__item">
              <span>{entry.jobName}</span>
              <span>
                x{entry.cyclesCompleted} · 💰{entry.moneyEarned}
              </span>
            </li>
          ))}
        </ul>

        <button className="btn-primary" onClick={handleClose}>
          Nice!
        </button>
      </div>
    </div>
  );
};

export default OfflineEarningsModal;
