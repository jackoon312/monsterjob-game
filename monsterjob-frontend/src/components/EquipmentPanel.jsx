import { useEffect, useState } from 'react';
import * as equipmentApi from '../api/equipment';

const SLOTS = ['head', 'body', 'accessory'];
const SLOT_TYPE = { head: 'Head', body: 'Body', accessory: 'Accessory' };

const EquipmentPanel = ({ creatures, onEquipmentChange }) => {
  const [catalog, setCatalog] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedCreatureId, setSelectedCreatureId] = useState('');
  const [equipped, setEquipped] = useState({ head: null, body: null, accessory: null });
  const [slotChoices, setSlotChoices] = useState({ head: '', body: '', accessory: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadCatalog = async () => {
    try {
      const { equipment } = await equipmentApi.getAllEquipment();
      setCatalog(equipment);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the equipment shop.');
    }
  };

  const loadInventory = async () => {
    try {
      const { inventory: items } = await equipmentApi.getMyInventory();
      setInventory(items);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your inventory.');
    }
  };

  useEffect(() => {
    loadCatalog();
    loadInventory();
  }, []);

  const loadCreatureEquipment = async (creatureId) => {
    if (!creatureId) {
      setEquipped({ head: null, body: null, accessory: null });
      return;
    }
    try {
      const { equipment } = await equipmentApi.getCreatureEquipment(creatureId);
      setEquipped(equipment);
      setSlotChoices({
        head: equipment.head?._id || '',
        body: equipment.body?._id || '',
        accessory: equipment.accessory?._id || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load that creature\'s equipment.');
    }
  };

  useEffect(() => {
    loadCreatureEquipment(selectedCreatureId);
  }, [selectedCreatureId]);

  const handlePurchase = async (equipmentId) => {
    setBusy(true);
    setError('');
    try {
      await equipmentApi.purchaseEquipment(equipmentId);
      await loadInventory();
      onEquipmentChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not purchase that item.');
    } finally {
      setBusy(false);
    }
  };

  const handleEquip = async (slot) => {
    const equipmentId = slotChoices[slot];
    if (!equipmentId) return;
    setBusy(true);
    setError('');
    try {
      await equipmentApi.equipItem(selectedCreatureId, slot, equipmentId);
      await loadCreatureEquipment(selectedCreatureId);
      await loadInventory();
      onEquipmentChange?.();
    } catch (err) {
      setError(err.response?.data?.message || `Could not equip that ${slot} item.`);
    } finally {
      setBusy(false);
    }
  };

  const handleUnequip = async (slot) => {
    setBusy(true);
    setError('');
    try {
      await equipmentApi.unequipItem(selectedCreatureId, slot);
      await loadCreatureEquipment(selectedCreatureId);
      await loadInventory();
      onEquipmentChange?.();
    } catch (err) {
      setError(err.response?.data?.message || `Could not unequip ${slot}.`);
    } finally {
      setBusy(false);
    }
  };

  const ownedQuantity = (equipmentId) =>
    inventory.find((i) => i.equipment._id === equipmentId)?.quantity || 0;

  return (
    <div className="side-panel">
      <h2>Equipment Shop</h2>
      {error && <div className="error-banner">{error}</div>}

      <p style={{ fontSize: 12, opacity: 0.65, marginTop: -6, marginBottom: 12 }}>
        Buying adds an item to your inventory. You can only equip items you actually own -
        equipping consumes a copy, unequipping returns it.
      </p>

      <ul className="creature-list" style={{ maxHeight: 200 }}>
        {catalog.map((item) => {
          const owned = ownedQuantity(item._id);
          return (
            <li
              key={item._id}
              className="creature-list__item"
              style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>
                  {item.name} {owned > 0 && <span style={{ color: 'var(--color-leaf)' }}>x{owned}</span>}
                </strong>
                <span>💰{item.cost}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {item.type} · {item.rarity} · lvl {item.level}+
                </span>
                <button
                  className="btn-primary"
                  style={{ width: 'auto', padding: '5px 12px' }}
                  onClick={() => handlePurchase(item._id)}
                  disabled={busy}
                >
                  Buy
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 style={{ marginTop: 22 }}>Equip a Creature</h2>
      <div className="species-picker">
        <select value={selectedCreatureId} onChange={(e) => setSelectedCreatureId(e.target.value)}>
          <option value="">Select a creature...</option>
          {creatures.map((c) => (
            <option key={c._id} value={c._id}>
              {c.nickname} (Lv. {c.level})
            </option>
          ))}
        </select>
      </div>

      {selectedCreatureId &&
        SLOTS.map((slot) => {
          // Only items of the matching type AND that you actually own (quantity > 0)
          const options = catalog.filter(
            (item) => item.type === SLOT_TYPE[slot] && ownedQuantity(item._id) > 0
          );
          const current = equipped[slot];
          return (
            <div key={slot} style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
                {slot} {current ? `- ${current.name}` : '- empty'}
              </label>
              <div className="species-picker" style={{ marginTop: 6, flexDirection: 'row', gap: 8 }}>
                <select
                  value={slotChoices[slot]}
                  onChange={(e) => setSlotChoices((prev) => ({ ...prev, [slot]: e.target.value }))}
                  style={{ flex: 1 }}
                >
                  <option value="">
                    {options.length === 0 ? `No owned ${slot} items` : `Choose ${slot} item...`}
                  </option>
                  {options.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} (own x{ownedQuantity(item._id)})
                    </option>
                  ))}
                </select>
                <button
                  className="btn-primary"
                  style={{ width: 'auto', padding: '9px 14px' }}
                  onClick={() => handleEquip(slot)}
                  disabled={busy || !slotChoices[slot]}
                >
                  Equip
                </button>
                {current && (
                  <button className="btn-link" onClick={() => handleUnequip(slot)} disabled={busy}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default EquipmentPanel;
