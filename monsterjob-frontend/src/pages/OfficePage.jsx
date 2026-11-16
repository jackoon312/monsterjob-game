import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PhaserGame from '../game/PhaserGame';
import JobsPanel from '../components/JobsPanel';
import EquipmentPanel from '../components/EquipmentPanel';
import OfficePanel from '../components/OfficePanel';
import AchievementsPanel from '../components/AchievementsPanel';
import OfflineEarningsModal from '../components/OfflineEarningsModal';
import * as creaturesApi from '../api/creatures';
import * as officeApi from '../api/office';
import * as assignmentsApi from '../api/assignments';
import * as jobsApi from '../api/jobs';
import * as achievementsApi from '../api/achievements';

const JOB_CATEGORIES = ['Labor', 'Service', 'Creative', 'Craft', 'Combat'];

const OfficePage = () => {
  const { user, logoutUser, refreshUser } = useAuth();
  const [creatures, setCreatures] = useState([]);
  const [species, setSpecies] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [office, setOffice] = useState(null);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [totalAchievementCount, setTotalAchievementCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catching, setCatching] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const bumpRefreshSignal = () => setRefreshSignal((n) => n + 1);
  const [releasingId, setReleasingId] = useState(null);

  const loadActiveAssignments = async () => {
    try {
      const { assignments } = await assignmentsApi.getActiveAssignments();
      setActiveAssignments(assignments);
    } catch (err) {
      console.warn('Could not load active assignments for office rooms:', err.message);
    }
  };

  const loadJobs = async () => {
    try {
      const { jobs } = await jobsApi.getAllJobs();
      setAllJobs(jobs);
    } catch (err) {
      console.warn('Could not load job catalog for office rooms:', err.message);
    }
  };

  const loadAchievements = async () => {
    try {
      const [unlockedRes, catalogRes] = await Promise.all([
        achievementsApi.getMyAchievements(),
        achievementsApi.getAllAchievements()
      ]);
      setUnlockedAchievements(unlockedRes.achievements);
      setTotalAchievementCount(catalogRes.achievements.length);
    } catch (err) {
      console.warn('Could not load achievements for the office trophy shelf:', err.message);
    }
  };

  // Builds { idle: [...], byCategory: { Labor: [...], Service: [...], ... } }
  // for the Phaser scenes - idle creatures show in the Main Office, working
  // ones show only in the room matching their job's category. Memoized so
  // this only recomputes when creatures/activeAssignments actually change,
  // not on every unrelated re-render (which would otherwise restart the
  // Phaser scene constantly - e.g. every keystroke elsewhere on the page).
  const officeData = useMemo(() => {
    const categoryByCreatureId = {};
    activeAssignments.forEach((a) => {
      if (a.creatureId?._id && a.jobId?.category) {
        categoryByCreatureId[a.creatureId._id] = a.jobId.category;
      }
    });

    const byCategory = {};
    JOB_CATEGORIES.forEach((cat) => {
      byCategory[cat] = [];
    });

    const idle = [];
    creatures.forEach((c) => {
      if (!c.currentJob) {
        idle.push(c);
        return;
      }
      const category = categoryByCreatureId[c._id];
      if (category && byCategory[category]) {
        byCategory[category].push(c);
      } else {
        // Working but we couldn't resolve a category (e.g. assignment data
        // hasn't loaded yet this render) - fall back to showing it in the
        // Main Office rather than hiding it entirely.
        idle.push(c);
      }
    });

    const jobsByCategory = {};
    JOB_CATEGORIES.forEach((cat) => {
      jobsByCategory[cat] = allJobs.filter((j) => j.category === cat);
    });

    return {
      idle,
      byCategory,
      jobsByCategory,
      unlockedAchievementCount: unlockedAchievements.length,
      totalAchievementCount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatures, activeAssignments, allJobs, unlockedAchievements, totalAchievementCount]);

  const handleRelease = async (creature) => {
    if (creature.currentJob) return; // shouldn't be reachable since the button is disabled, but guard anyway
    const confirmed = window.confirm(`Release ${creature.nickname}? This can't be undone.`);
    if (!confirmed) return;

    setReleasingId(creature._id);
    setError('');
    try {
      await creaturesApi.releaseCreature(creature._id);
      const { creatures: updated } = await creaturesApi.getMyCreatures();
      setCreatures(updated);
      bumpRefreshSignal();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not release that creature.');
    } finally {
      setReleasingId(null);
    }
  };

  const loadOffice = async () => {
    try {
      const { office: officeRecord } = await officeApi.getOffice();
      setOffice(officeRecord);
    } catch (err) {
      console.warn('Could not load office capacity info:', err.message);
    }
  };

  const loadData = async () => {
    try {
      const [creaturesRes, speciesRes] = await Promise.all([
        creaturesApi.getMyCreatures(),
        creaturesApi.getAllSpecies()
      ]);
      setCreatures(creaturesRes.creatures);
      setSpecies(speciesRes.species);
      if (speciesRes.species.length > 0) {
        setSelectedSpeciesId(speciesRes.species[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load office data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadOffice();
    loadActiveAssignments();
    loadJobs();
    loadAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Achievements can unlock from actions elsewhere on the page (catching a
  // creature, completing a job) - re-fetch whenever those bump refreshSignal
  // so the trophy shelf stays in sync without a full page reload.
  useEffect(() => {
    if (refreshSignal > 0) loadAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  const atCreatureCapacity = office && creatures.length >= office.creatureCapacity;

  const handleCatch = async () => {
    if (!selectedSpeciesId || atCreatureCapacity) return;
    setCatching(true);
    setError('');
    try {
      await creaturesApi.catchCreature(selectedSpeciesId);
      const { creatures: updated } = await creaturesApi.getMyCreatures();
      setCreatures(updated);
      bumpRefreshSignal();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not catch that creature.');
    } finally {
      setCatching(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__title">MonsterJob</div>
        <div className="app-header__user">
          <span>{user?.username}</span>
          <span>💰 {user?.totalMoney ?? 0}</span>
          <button className="btn-link" onClick={logoutUser}>
            Log out
          </button>
        </div>
      </header>

      <div className="app-body">
        <div className="game-canvas-panel">
          <PhaserGame officeData={officeData} officeTier={office?.tier} />
        </div>

        <div className="side-panel">
          <h2>Your Creatures</h2>

          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <ul className="creature-list">
                {creatures.length === 0 && (
                  <li className="creature-list__empty">No creatures yet - catch one below!</li>
                )}
                {creatures.map((c) => (
                  <li key={c._id} className="creature-list__item">
                    <span>
                      {c.nickname} {c.currentJob && <span style={{ opacity: 0.6 }}>(working)</span>}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      Lv. {c.level}
                      <button
                        className="btn-link"
                        onClick={() => handleRelease(c)}
                        disabled={!!c.currentJob || releasingId === c._id}
                        title={c.currentJob ? 'Cancel or complete its job first' : 'Release this creature'}
                      >
                        {releasingId === c._id ? '...' : 'Release'}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>

              <h2>Catch a Creature</h2>
              {atCreatureCapacity ? (
                <p className="error-banner">
                  Office is at creature capacity ({creatures.length}/{office.creatureCapacity}).
                  Upgrade your office or release a creature first.
                </p>
              ) : (
                <div className="species-picker">
                  <select
                    value={selectedSpeciesId}
                    onChange={(e) => setSelectedSpeciesId(e.target.value)}
                  >
                    {species.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.rarity})
                      </option>
                    ))}
                  </select>
                  <button className="btn-primary" onClick={handleCatch} disabled={catching}>
                    {catching ? 'Catching...' : 'Catch'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <JobsPanel
          creatures={creatures}
          office={office}
          onAssignmentChange={() => {
            loadData();
            refreshUser();
            bumpRefreshSignal();
            loadActiveAssignments();
          }}
        />

        <EquipmentPanel
          creatures={creatures}
          onEquipmentChange={() => {
            loadData();
            refreshUser();
          }}
        />

        <OfficePanel
          onOfficeChange={() => {
            refreshUser();
            loadOffice();
          }}
        />

        <AchievementsPanel refreshSignal={refreshSignal} />
      </div>

      <OfflineEarningsModal
        onEarningsApplied={() => {
          loadData();
          refreshUser();
          bumpRefreshSignal();
        }}
      />
    </div>
  );
};

export default OfficePage;
