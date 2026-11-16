import { useEffect, useState } from 'react';
import * as officeApi from '../api/office';

const formatRemaining = (endTime) => {
  const ms = new Date(endTime).getTime() - Date.now();
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const OfficePanel = ({ onOfficeChange }) => {
  const [office, setOffice] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [, forceTick] = useState(0);

  const loadOffice = async () => {
    try {
      const { office: officeData } = await officeApi.getOffice();
      setOffice(officeData);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load office data.');
    }
  };

  useEffect(() => {
    loadOffice();
  }, []);

  // Re-render once a second so the upgrade countdown actually counts down
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const ready =
    office?.upgradeInProgress && new Date(office.upgradeEndTime).getTime() <= Date.now();

  const handleUpgradeOrFinalize = async () => {
    setBusy(true);
    setError('');
    try {
      const { office: updated } = await officeApi.startOrFinalizeUpgrade();
      setOffice(updated);
      onOfficeChange?.();
    } catch (err) {
      const data = err.response?.data;
      if (data?.required !== undefined) {
        setError(`Not enough money - need ${data.required}, you have ${data.current}.`);
      } else {
        setError(data?.message || 'Could not upgrade the office right now.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    setError('');
    try {
      const { office: updated } = await officeApi.cancelUpgrade();
      setOffice(updated);
      onOfficeChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel the upgrade.');
    } finally {
      setBusy(false);
    }
  };

  if (!office) {
    return (
      <div className="side-panel">
        <h2>Office</h2>
        {error && <div className="error-banner">{error}</div>}
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="side-panel">
      <h2>Office - Tier {office.tier}</h2>
      {error && <div className="error-banner">{error}</div>}

      <ul className="creature-list" style={{ marginBottom: 16 }}>
        <li className="creature-list__item">
          <span>Creature Capacity</span>
          <span>{office.creatureCapacity}</span>
        </li>
        <li className="creature-list__item">
          <span>Job Slots</span>
          <span>{office.jobSlots}</span>
        </li>
        <li className="creature-list__item">
          <span>Equipment Slots</span>
          <span>{office.equipmentSlots}</span>
        </li>
      </ul>

      {office.unlockedFeatures?.length > 0 && (
        <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
          Unlocked: {office.unlockedFeatures.join(', ')}
        </p>
      )}

      {office.upgradeInProgress ? (
        <>
          <p style={{ fontSize: 14, marginBottom: 10 }}>
            {ready ? (
              <strong style={{ color: 'var(--color-gold)' }}>Upgrade ready to finalize!</strong>
            ) : (
              <>Upgrading to Tier {office.upgradeTargetTier} - ⏱ {formatRemaining(office.upgradeEndTime)}</>
            )}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-primary"
              onClick={handleUpgradeOrFinalize}
              disabled={busy || !ready}
            >
              {ready ? 'Finalize Upgrade' : 'Not ready yet'}
            </button>
            <button className="btn-link" onClick={handleCancel} disabled={busy}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <button className="btn-primary" onClick={handleUpgradeOrFinalize} disabled={busy}>
          {busy ? 'Starting...' : `Upgrade to Tier ${office.tier + 1}`}
        </button>
      )}
    </div>
  );
};

export default OfficePanel;
