import { useEffect, useRef, useState } from 'react';
import * as achievementsApi from '../api/achievements';

const AchievementsPanel = ({ refreshSignal }) => {
  const [catalog, setCatalog] = useState([]);
  const [unlocked, setUnlocked] = useState([]);
  const [error, setError] = useState('');
  const [checkingId, setCheckingId] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);

  // Tracks which achievement ids were unlocked as of the last load, so we
  // can detect newly-unlocked ones on the next load and celebrate them.
  // hasLoadedOnce guards against celebrating achievements that were already
  // unlocked before this component ever mounted (e.g. from a previous
  // session) - only genuinely NEW unlocks after the first load get a toast.
  const previousUnlockedIds = useRef(new Set());
  const hasLoadedOnce = useRef(false);

  const loadAll = async () => {
    try {
      const [catalogRes, unlockedRes] = await Promise.all([
        achievementsApi.getAllAchievements(),
        achievementsApi.getMyAchievements()
      ]);
      setCatalog(catalogRes.achievements);

      const newUnlockedList = unlockedRes.achievements;
      const newIds = new Set(newUnlockedList.map((u) => u.achievementId));

      if (hasLoadedOnce.current) {
        const newlyUnlocked = newUnlockedList.filter(
          (u) => !previousUnlockedIds.current.has(u.achievementId)
        );
        if (newlyUnlocked.length > 0) {
          setToastQueue((q) => [...q, ...newlyUnlocked]);
        }
      }

      previousUnlockedIds.current = newIds;
      hasLoadedOnce.current = true;
      setUnlocked(newUnlockedList);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load achievements.');
    }
  };

  useEffect(() => {
    loadAll();
    // Re-check whenever the parent signals something changed (job completed,
    // creature caught, etc.) - achievements auto-unlock on the backend after
    // those actions, this just refreshes what we display.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  // Pull the next queued toast once the current one clears
  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      setCurrentToast(toastQueue[0]);
      setToastQueue((q) => q.slice(1));
    }
  }, [toastQueue, currentToast]);

  // Auto-dismiss the current toast after a few seconds
  useEffect(() => {
    if (!currentToast) return undefined;
    const timer = setTimeout(() => setCurrentToast(null), 3500);
    return () => clearTimeout(timer);
  }, [currentToast]);

  const isUnlocked = (achievementId) => unlocked.some((u) => u.achievementId === achievementId);

  const handleManualCheck = async (achievementId) => {
    setCheckingId(achievementId);
    setError('');
    try {
      await achievementsApi.checkAchievement(achievementId);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not check that achievement.');
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <div className="side-panel">
      {currentToast && (
        <div className="achievement-toast">
          <div className="achievement-toast__title">🏆 Achievement Unlocked!</div>
          <div className="achievement-toast__name">{currentToast.name}</div>
          {currentToast.reward?.money > 0 && (
            <div className="achievement-toast__reward">+💰{currentToast.reward.money}</div>
          )}
        </div>
      )}

      <h2>Achievements</h2>
      {error && <div className="error-banner">{error}</div>}

      <p style={{ fontSize: 12, opacity: 0.65, marginTop: -6, marginBottom: 12 }}>
        Most of these unlock automatically after catching a creature or completing a job. The
        Check button is a manual fallback if you think you qualify but it hasn't updated yet.
      </p>

      <ul className="creature-list" style={{ maxHeight: 'none' }}>
        {catalog.map((a) => {
          const unlockedEntry = isUnlocked(a.achievementId);
          return (
            <li
              key={a.achievementId}
              className="creature-list__item"
              style={{
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 4,
                opacity: unlockedEntry ? 1 : 0.6,
                border: unlockedEntry ? '1px solid var(--color-gold)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{unlockedEntry ? '🏆 ' : '🔒 '}{a.name}</strong>
                {unlockedEntry ? (
                  <span style={{ color: 'var(--color-gold)', fontSize: 12, fontWeight: 800 }}>
                    ✓ UNLOCKED
                  </span>
                ) : (
                  a.reward.money > 0 && <span>💰{a.reward.money}</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{a.description}</span>
                {!unlockedEntry && (
                  <button
                    className="btn-link"
                    onClick={() => handleManualCheck(a.achievementId)}
                    disabled={checkingId === a.achievementId}
                  >
                    {checkingId === a.achievementId ? 'Checking...' : 'Check'}
                  </button>
                )}
              </div>
              {unlockedEntry && (
                <span style={{ fontSize: 11, opacity: 0.6 }}>
                  Earned 💰{a.reward.money} - no action needed, this one's done
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AchievementsPanel;
