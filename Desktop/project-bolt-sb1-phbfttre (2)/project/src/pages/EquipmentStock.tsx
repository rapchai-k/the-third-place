import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Package, Upload as UploadIcon, RotateCcw, ArrowDownCircle, ArrowUpCircle, Calendar, Trash2, X, DollarSign, Pencil } from 'lucide-react';
import { supabase, type EquipmentItem, type EquipmentStockTransaction, type EquipmentStockLevel, type EquipmentStockWeekly, type EquipmentStockMonthly } from '../lib/supabase';
import { DataTable } from '../components/common/DataTable';
import { FileUpload } from '../components/common/FileUpload';
// import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

type TabKey = 'stock' | 'levels' | 'returns' | 'history' | 'items';

interface InboundFormState {
  supplier_name: string;
  equipment_item_id: string;
  size: string;
  quantity: number;
  delivery_date: string; // YYYY-MM-DD
  notes: string;
}

export function EquipmentStock() {
  // const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('stock');
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [levels, setLevels] = useState<EquipmentStockLevel[]>([]);
  const [transactions, setTransactions] = useState<EquipmentStockTransaction[]>([]);
  const [weekly, setWeekly] = useState<EquipmentStockWeekly[]>([]);
  const [monthly, setMonthly] = useState<EquipmentStockMonthly[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showManageEquipmentModal, setShowManageEquipmentModal] = useState(false);
  const [showEditItemsModal, setShowEditItemsModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState<{ equipment_item_id: string; item_name: string; size: string; current: number; newCount: number; notes: string; availableStock: number; totalDistributed: number }>({ equipment_item_id: '', item_name: '', size: 'N/A', current: 0, newCount: 0, notes: '', availableStock: 0, totalDistributed: 0 });

  const [form, setForm] = useState<InboundFormState>({
    supplier_name: '',
    equipment_item_id: '',
    size: '',
    quantity: 0,
    delivery_date: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  const [inboundUnitPrice, setInboundUnitPrice] = useState<string>('');

  const [txForm, setTxForm] = useState({
    equipment_item_id: '',
    size: '',
    transaction_type: 'distribution' as 'distribution' | 'return' | 'adjustment',
    quantity: 0,
    notes: '',
  });

  const [manageForm, setManageForm] = useState({
    name: '',
    category: 'general',
    sizes: 'One Size',
    current_price: '0',
    is_chargeable: false,
    is_active: true,
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    (items || []).forEach((it) => it.category && set.add(it.category));
    const arr = Array.from(set).sort();
    if (!arr.includes('general')) arr.unshift('general');
    return arr;
  }, [items]);

  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    (items || []).forEach((it) => {
      const price = typeof it.current_price === 'number' ? it.current_price : Number(it.current_price) || 0;
      map.set(it.id, price);
    });
    return map;
  }, [items]);

  useEffect(() => {
    void initialize();
  }, []);

  const initialize = async () => {
    try {
      setLoading(true);
      const [itemsRes, levelsRes, txRes, weeklyRes, monthlyRes] = await Promise.all([
        supabase.from('equipment_items').select('*').order('name'),
        supabase.from('equipment_stock_levels').select('*').order('item_name'),
        supabase.from('equipment_stock_transactions').select('*, equipment_items(name,current_price,is_chargeable)').order('created_at', { ascending: false }).limit(500),
        supabase.from('equipment_stock_weekly').select('*').order('week_start', { ascending: false }).limit(1000),
        supabase.from('equipment_stock_monthly').select('*').order('month_start', { ascending: false }).limit(1000),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (levelsRes.error) throw levelsRes.error;
      if (txRes.error) throw txRes.error;
      if (weeklyRes.error) throw weeklyRes.error;
      if (monthlyRes.error) throw monthlyRes.error;

      setItems(itemsRes.data || []);
      setLevels(levelsRes.data || []);
      const tx = (txRes.data || []).map((t: any) => ({
        ...t,
        item_name: t.equipment_items?.name,
        unit_price: typeof t.equipment_items?.current_price === 'number' ? t.equipment_items.current_price : Number(t.equipment_items?.current_price) || 0,
        is_chargeable: Boolean(t.equipment_items?.is_chargeable),
      }));
      setTransactions(tx);
      setWeekly(weeklyRes.data || []);
      setMonthly(monthlyRes.data || []);
    } catch (err) {
      console.error('Failed to load stock data', err);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleInboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.equipment_item_id) {
        toast.error('Select equipment');
        return;
      }
      if (!form.quantity || form.quantity <= 0) {
        toast.error('Quantity must be positive');
        return;
      }

      const payload: Partial<EquipmentStockTransaction> = {
        equipment_item_id: form.equipment_item_id,
        size: form.size || null,
        transaction_type: 'inbound',
        quantity: form.quantity,
        supplier_name: form.supplier_name || null,
        delivery_date: form.delivery_date || null,
        notes: form.notes || null,
        reference_type: 'manual',
      };

      const { error } = await supabase.from('equipment_stock_transactions').insert(payload as any);
      if (error) throw error;

      // Optional: update unit price on the equipment item
      const priceNum = Number(inboundUnitPrice);
      if (Number.isFinite(priceNum) && priceNum > 0) {
        const { error: priceErr } = await supabase
          .from('equipment_items')
          .update({ current_price: priceNum })
          .eq('id', form.equipment_item_id);
        if (priceErr) throw priceErr;
      }

      toast.success('Inbound stock recorded');
      setForm((f) => ({ ...f, quantity: 0, notes: '' }));
      setInboundUnitPrice('');
      setShowInboundModal(false);
      await initialize();
    } catch (err: any) {
      console.error('Failed to record inbound', err);
      toast.error(err?.message || 'Failed to record inbound');
    }
  };

  const inboundRequiredColumns = useMemo(() => [
    'supplier_name',
    'equipment_item_id',
    'size',
    'quantity',
    'delivery_date',
    'notes',
  ], []);

  const handleInboundUpload = async (rows: any[], fileName: string) => {
    try {
      if (!rows.length) return;
      // Normalize keys
      const normalized = rows.map((row) => {
        const obj: Record<string, any> = {};
        Object.entries(row).forEach(([k, v]) => {
          obj[String(k).toLowerCase().trim().replace(/\s+/g, '_')] = v;
        });
        return obj;
      });

      // Map optional item_name to equipment_item_id if provided
      const nameToId = new Map(items.map((i) => [i.name.toLowerCase(), i.id]));
      const payloads: Partial<EquipmentStockTransaction>[] = [];
      for (const r of normalized) {
        let equipment_item_id = r.equipment_item_id as string | undefined;
        if (!equipment_item_id && r.item_name) {
          const id = nameToId.get(String(r.item_name).toLowerCase());
          if (id) equipment_item_id = id;
        }
        if (!equipment_item_id) continue;

        const qty = Number(r.quantity);
        if (!Number.isFinite(qty) || qty <= 0) continue;

        payloads.push({
          equipment_item_id,
          size: r.size ? String(r.size) : null,
          transaction_type: 'inbound',
          quantity: qty,
          supplier_name: r.supplier_name ? String(r.supplier_name) : null,
          delivery_date: r.delivery_date ? String(r.delivery_date) : null,
          notes: r.notes ? String(r.notes) : null,
          reference_type: 'upload',
          reference_id: fileName,
        });
      }

      if (!payloads.length) {
        toast.error('No valid inbound rows found');
        return;
      }

      const batchSize = 200;
      for (let i = 0; i < payloads.length; i += batchSize) {
        const slice = payloads.slice(i, i + batchSize);
        const { error } = await supabase.from('equipment_stock_transactions').insert(slice as any);
        if (error) throw error;
      }

      toast.success(`Uploaded ${payloads.length} inbound rows`);
      await initialize();
    } catch (err: any) {
      console.error('Inbound upload failed', err);
      toast.error(err?.message || 'Inbound upload failed');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const ok = confirm('Delete this transaction? This cannot be undone.');
    if (!ok) return;
    try {
      const { error } = await supabase.from('equipment_stock_transactions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Transaction deleted');
      await initialize();
    } catch (err: any) {
      console.error('Failed to delete transaction', err);
      toast.error(err?.message || 'Failed to delete transaction');
    }
  };

  const handleDeleteAllHistory = async () => {
    const ok = confirm('Delete ALL stock history transactions? This will reset stock levels. This cannot be undone. Type YES to confirm.');
    if (!ok) return;
    const text = prompt('Type YES to confirm deleting ALL stock history');
    if (text !== 'YES') return;
    try {
      const { error } = await supabase.from('equipment_stock_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      toast.success('All stock history deleted');
      await initialize();
    } catch (err: any) {
      console.error('Failed to delete all history', err);
      toast.error(err?.message || 'Failed to delete all history');
    }
  };

  const handleDeleteStockLevel = async (equipment_item_id: string, sizeLabel: string) => {
    const ok = confirm(`Delete stock level for this item${sizeLabel && sizeLabel !== 'N/A' ? ` (size ${sizeLabel})` : ''}? This will delete all underlying transactions for this item${sizeLabel && sizeLabel !== 'N/A' ? ` and size ${sizeLabel}` : ''}. Type YES to confirm.`);
    if (!ok) return;
    const text = prompt('Type YES to confirm deletion');
    if (text !== 'YES') return;
    try {
      let query = supabase.from('equipment_stock_transactions').delete().eq('equipment_item_id', equipment_item_id);
      if (!sizeLabel || sizeLabel === 'N/A') {
        // @ts-ignore: .is available on query builder
        query = (query as any).is('size', null);
      } else {
        query = query.eq('size', sizeLabel);
      }
      const { error } = await query;
      if (error) throw error;
      toast.success('Stock level deleted');
      await initialize();
    } catch (err: any) {
      console.error('Failed to delete stock level', err);
      toast.error(err?.message || 'Failed to delete stock level');
    }
  };

  const transactionColumns = [
    { key: 'created_at', label: 'Date/Time', sortable: true, render: (v: string) => new Date(v).toLocaleString() },
    { key: 'item_name', label: 'Item', sortable: true },
    { key: 'size', label: 'Size', render: (v: string) => v || 'N/A' },
    { key: 'transaction_type', label: 'Type', sortable: true, render: (v: string) => (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        v === 'inbound' ? 'bg-green-100 text-green-800' : v === 'return' ? 'bg-blue-100 text-blue-800' : v === 'distribution' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {v}
      </span>
    ) },
    { key: 'quantity', label: 'Qty', sortable: true, render: (v: number) => (
      <span className={v >= 0 ? 'text-green-700' : 'text-red-700'}>{v}</span>
    ) },
    { key: 'unit_price', label: 'Unit Price', sortable: true, render: (_: any, r: any) => (
      <div className="inline-flex items-center gap-1">
        <DollarSign className="w-3 h-3 text-gray-400" />
        <span>{(r.unit_price ?? 0).toFixed(2)}</span>
      </div>
    ) },
    { key: 'total_price', label: 'Total', sortable: true, render: (_: any, r: any) => {
      const qty = Number(r.quantity) || 0;
      const unit = Number(r.unit_price) || 0;
      const totalAbs = Math.abs(qty) * unit;
      const sign = qty >= 0 ? '+' : '-';
      return (
        <div className="inline-flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-gray-400" />
          <span className={qty >= 0 ? 'text-green-700' : 'text-red-700'}>
            {sign}{totalAbs.toFixed(2)}
          </span>
        </div>
      );
    } },
    { key: 'supplier_name', label: 'Supplier', render: (v: string) => v || '-' },
    { key: 'delivery_date', label: 'Delivery Date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'notes', label: 'Notes', render: (v: string) => v || '-' },
    { key: 'actions', label: 'Actions', render: (_: any, row: any) => (
      <button onClick={() => handleDeleteTransaction(row.id)} className="text-red-600 hover:text-red-800 inline-flex items-center space-x-1">
        <Trash2 className="w-4 h-4" />
        <span>Delete</span>
      </button>
    ) },
  ];

  const itemsColumns = [
    { key: 'name', label: 'Item', sortable: true },
    { key: 'category', label: 'Category', sortable: true, render: (v: string) => v || 'general' },
    { key: 'sizes', label: 'Sizes', render: (_: any, row: any) => {
      const allSizes: string[] = Array.isArray(row.sizes) ? row.sizes : ['One Size'];
      const inactive: Set<string> = new Set(
        Array.isArray((row as any).inactive_sizes) ? (row as any).inactive_sizes : []
      );
      return (
        <div className="flex flex-wrap gap-2">
          {allSizes.map((s: string) => (
            <label key={s} className={`inline-flex items-center text-xs px-2 py-1 rounded border ${inactive.has(s) ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              <input
                type="checkbox"
                className="mr-1"
                checked={!inactive.has(s)}
                onChange={async (e) => {
                  try {
                    const makeActive = e.target.checked;
                    const currentInactive: string[] = Array.isArray((row as any).inactive_sizes) ? [...(row as any).inactive_sizes] : [];
                    const idx = currentInactive.indexOf(s);
                    if (makeActive && idx !== -1) currentInactive.splice(idx, 1);
                    if (!makeActive && idx === -1) currentInactive.push(s);
                    setItems((prev) => prev.map((p) => p.id === row.id ? ({ ...p, inactive_sizes: currentInactive }) as any : p));
                    const { error } = await supabase
                      .from('equipment_items')
                      .update({ inactive_sizes: currentInactive as any })
                      .eq('id', row.id);
                    if (error) throw error;
                    toast.success(`Size ${s} ${makeActive ? 'activated' : 'deactivated'}`);
                  } catch (err: any) {
                    console.error('Toggle size active failed', err);
                    toast.error(err?.message || 'Failed to update size status');
                    await initialize();
                  }
                }}
              />
              {s}
            </label>
          ))}
        </div>
      );
    } },
    { key: 'current_price', label: 'Unit Price', sortable: true, render: (v: any) => {
      const price = typeof v === 'number' ? v : Number(v) || 0;
      return (
        <div className="inline-flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-gray-400" />
          <span>{price.toFixed(2)}</span>
        </div>
      );
    } },
    { key: 'is_chargeable', label: 'Chargeable', render: (v: any) => v ? 'Yes' : 'No' },
    { key: 'is_active', label: 'Active', render: (_: any, row: any) => (
      <input
        type="checkbox"
        checked={row.is_active !== false}
        onChange={async (e) => {
          try {
            const val = e.target.checked;
            setItems((prev) => prev.map((p) => p.id === row.id ? ({ ...p, is_active: val }) : p));
            const { error } = await supabase
              .from('equipment_items')
              .update({ is_active: val })
              .eq('id', row.id);
            if (error) throw error;
            toast.success(`Item ${val ? 'activated' : 'deactivated'}`);
          } catch (err: any) {
            console.error('Toggle active failed', err);
            toast.error(err?.message || 'Failed to update status');
            // revert local on failure
            setItems((prev) => prev.map((p) => p.id === row.id ? ({ ...p, is_active: !(row.is_active !== false) }) : p));
          }
        }}
      />
    ) },
    { key: 'actions', label: 'Actions', render: (_: any, _row: any) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEditItemsModal(true)}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
        >
          Edit
        </button>
      </div>
    ) },
  ];

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!txForm.equipment_item_id) {
        toast.error('Select equipment');
        return;
      }
      if (!txForm.quantity || txForm.quantity <= 0) {
        toast.error('Quantity must be positive');
        return;
      }

      let signedQty = txForm.quantity;
      if (txForm.transaction_type === 'distribution') signedQty = -Math.abs(txForm.quantity);
      if (txForm.transaction_type === 'return') signedQty = Math.abs(txForm.quantity);
      if (txForm.transaction_type === 'adjustment') signedQty = txForm.quantity; // allow +/-

      const payload: Partial<EquipmentStockTransaction> = {
        equipment_item_id: txForm.equipment_item_id,
        size: txForm.size || null,
        transaction_type: txForm.transaction_type,
        quantity: signedQty,
        notes: txForm.notes || null,
        reference_type: 'manual',
      };

      const { error } = await supabase.from('equipment_stock_transactions').insert(payload as any);
      if (error) throw error;
      toast.success('Transaction recorded');
      setTxForm({ equipment_item_id: '', size: '', transaction_type: 'distribution', quantity: 0, notes: '' });
      await initialize();
    } catch (err: any) {
      console.error('Failed to record transaction', err);
      toast.error(err?.message || 'Failed to record transaction');
    }
  };

  const txRequiredColumns = useMemo(() => [
    'transaction_type (distribution | return | adjustment)',
    'equipment_item_id',
    'size',
    'quantity (positive number; distribution will be stored as negative)',
    'notes',
  ], []);

  const handleTransactionsUpload = async (rows: any[], fileName: string) => {
    try {
      if (!rows.length) return;
      const normalized = rows.map((row) => {
        const obj: Record<string, any> = {};
        Object.entries(row).forEach(([k, v]) => {
          obj[String(k).toLowerCase().trim().replace(/\s+/g, '_')] = v;
        });
        return obj;
      });

      const nameToId = new Map(items.map((i) => [i.name.toLowerCase(), i.id]));
      const payloads: Partial<EquipmentStockTransaction>[] = [];
      for (const r of normalized) {
        let equipment_item_id = r.equipment_item_id as string | undefined;
        if (!equipment_item_id && r.item_name) {
          const id = nameToId.get(String(r.item_name).toLowerCase());
          if (id) equipment_item_id = id;
        }
        if (!equipment_item_id) continue;

        const typeRaw = String(r.transaction_type || '').toLowerCase();
        if (!['distribution','return','adjustment'].includes(typeRaw)) continue;
        const qty = Number(r.quantity);
        if (!Number.isFinite(qty) || qty <= 0) continue;
        let signedQty = qty;
        if (typeRaw === 'distribution') signedQty = -Math.abs(qty);
        if (typeRaw === 'return') signedQty = Math.abs(qty);
        if (typeRaw === 'adjustment') signedQty = qty;

        payloads.push({
          equipment_item_id,
          size: r.size ? String(r.size) : null,
          transaction_type: typeRaw as any,
          quantity: signedQty,
          notes: r.notes ? String(r.notes) : null,
          reference_type: 'upload',
          reference_id: fileName,
        });
      }

      if (!payloads.length) {
        toast.error('No valid transaction rows found');
        return;
      }

      const batchSize = 200;
      for (let i = 0; i < payloads.length; i += batchSize) {
        const slice = payloads.slice(i, i + batchSize);
        const { error } = await supabase.from('equipment_stock_transactions').insert(slice as any);
        if (error) throw error;
      }

      toast.success(`Uploaded ${payloads.length} transactions`);
      await initialize();
    } catch (err: any) {
      console.error('Transactions upload failed', err);
      toast.error(err?.message || 'Transactions upload failed');
    }
  };

  const levelColumns = [
    { key: 'item_name', label: 'Item', sortable: true },
    { key: 'size', label: 'Size', render: (v: string) => v || 'N/A' },
    { key: 'total_distributed', label: 'Distributed as of Now', sortable: true, render: (_: any, row: any) => {
      // Calculate total distributed stock for this item and size
      const totalDistributed = (transactions || [])
        .filter((t: any) => 
          t.equipment_item_id === row.equipment_item_id && 
          t.transaction_type === 'distribution' &&
          (t.size === row.size || (t.size === null && row.size === 'N/A'))
        )
        .reduce((sum: number, t: any) => sum + Math.abs(Number(t.quantity) || 0), 0);
      
      return (
        <div className="text-center">
          <div className="font-semibold text-red-700">{totalDistributed}</div>
          <div className="text-xs text-gray-500">Distributed</div>
        </div>
      );
    } },
    { key: 'stock_count', label: 'Remaining Available Stock', sortable: true, render: (v: any) => (
      <div className="text-center">
        <div className="font-semibold text-green-700">{v}</div>
        <div className="text-xs text-gray-500">Available</div>
      </div>
    ) },
    { key: 'unit_price', label: 'Unit Price', render: (_: any, row: any) => (
      <div className="inline-flex items-center gap-1">
        <DollarSign className="w-3 h-3 text-gray-400" />
        <span>{(priceMap.get(row.equipment_item_id) ?? 0).toFixed(2)}</span>
      </div>
    ) },
    { key: 'stock_value', label: 'Stock Value', render: (_: any, row: any) => {
      const unit = priceMap.get(row.equipment_item_id) ?? 0;
      const total = unit * (Number(row.stock_count) || 0);
      return (
        <div className="inline-flex items-center gap-1">
          <DollarSign className="w-3 h-4" />
          <span>{total.toFixed(2)}</span>
        </div>
      );
    } },
    { key: 'last_movement_at', label: 'Updated', sortable: true, render: (v: string) => new Date(v).toLocaleString() },
    { key: 'actions', label: 'Actions', render: (_: any, row: any) => (
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setAdjustForm({
              equipment_item_id: row.equipment_item_id,
              item_name: row.item_name,
              size: row.size,
              current: Number(row.stock_count) || 0,
              newCount: Number(row.stock_count) || 0,
              notes: '',
              availableStock: Number(row.stock_count) || 0,
              totalDistributed: (transactions || [])
                .filter((t: any) => 
                  t.equipment_item_id === row.equipment_item_id && 
                  t.transaction_type === 'distribution' &&
                  (t.size === row.size || (t.size === null && row.size === 'N/A'))
                )
                .reduce((sum: number, t: any) => sum + Math.abs(Number(t.quantity) || 0), 0)
            });
            setShowAdjustModal(true);
          }}
          className="text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
        >
          <span>Edit</span>
        </button>
        <button onClick={() => handleDeleteStockLevel(row.equipment_item_id, row.size)} className="text-red-600 hover:text-red-800 inline-flex items-center space-x-1">
          <Trash2 className="w-4 h-4" />
          <span>Delete Level</span>
        </button>
      </div>
    ) },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Stock Management</h1>
          <p className="text-gray-600 mt-1">Record inbound, track transactions, and view weekly/monthly summaries</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEditItemsModal(true)} className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            <Pencil className="w-4 h-4" />
            <span>Manage Items</span>
          </button>
          <button onClick={initialize} className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            <RotateCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {([
            { key: 'stock', label: 'Stock' },
            { key: 'levels', label: 'Levels' },
            { key: 'returns', label: 'Rider Return' },
            { key: 'items', label: 'Items' },
            { key: 'history', label: 'History' },
          ] as { key: TabKey; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`${activeTab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      {activeTab === 'returns' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><ArrowUpCircle className="w-5 h-5 mr-2 text-green-600" />Record Rider Return</h2>
            <RiderReturnForm items={items} onDone={initialize} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><ArrowUpCircle className="w-5 h-5 mr-2 text-red-600" />Return History</h2>
            {(() => {
              const returnsOnly = (transactions || []).filter((t: any) => t.transaction_type === 'return' || t.reference_type === 'return' || t.reference_type === 'return_info');
              const columns = [
                { key: 'created_at', label: 'Date/Time', sortable: true, render: (v: string) => new Date(v).toLocaleString() },
                { key: 'reference_id', label: 'Rider', sortable: true, render: (_: any, r: any) => r.reference_id || '-' },
                { key: 'item_name', label: 'Item', sortable: true },
                { key: 'size', label: 'Size', render: (v: string) => v || 'N/A' },
                { key: 'restocked', label: 'Restocked', render: (_: any, r: any) => (r.transaction_type === 'return' ? 'Yes' : 'No') },
                { key: 'quantity', label: 'Qty', sortable: true, render: (v: number) => Math.abs(Number(v) || 0) },
                { key: 'notes', label: 'Notes', render: (v: string) => v || '-' },
              ];
              return returnsOnly.length > 0 ? (
                <DataTable columns={columns as any} data={returnsOnly as any} searchable pagination pageSize={15} />
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600">No returns recorded yet</div>
              );
            })()}
          </div>
        </div>
      )}
      {activeTab === 'items' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Equipment Items</h2>
              <p className="text-sm text-gray-600">Toggle Active/Inactive and manage unit prices</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowManageEquipmentModal(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>New Item</span>
              </button>
              <button onClick={() => setShowEditItemsModal(true)} className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <Pencil className="w-4 h-4" />
                <span>Bulk Edit</span>
              </button>
            </div>
          </div>
          {items.length > 0 ? (
            <DataTable columns={itemsColumns as any} data={items as any} searchable pagination pageSize={20} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
              <div className="text-gray-600 mb-2">No equipment items found</div>
              <p className="text-sm text-gray-500 mb-4">Create your first equipment item to get started.</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setShowManageEquipmentModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">New Item</button>
                <button onClick={initialize} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Refresh</button>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center"><Package className="w-5 h-5 mr-2 text-gray-700" />Current Stock</h2>
              <p className="text-sm text-gray-600">Total items by size; updated from history</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowInboundModal(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <ArrowDownCircle className="w-4 h-4" />
                <span>Add Stock</span>
              </button>
              <button
                onClick={() => {
                  // Export stock levels to XLSX by reusing a lightweight export util via dynamic import of XLSX
                  (async () => {
                    const XLSX = await import('xlsx');
                    if (!levels || levels.length === 0) { toast.error('No stock to export'); return; }
                    const exportRows = levels.map((r: any) => ({
                      Item: r.item_name,
                      Size: r.size,
                      InStock: r.stock_count,
                      UnitPrice: (priceMap.get(r.equipment_item_id) ?? 0),
                      StockValue: (priceMap.get(r.equipment_item_id) ?? 0) * (Number(r.stock_count) || 0),
                      FirstMovementAt: r.first_movement_at,
                      LastMovementAt: r.last_movement_at,
                    }));
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(exportRows);
                    XLSX.utils.book_append_sheet(wb, ws, 'Stock');
                    const ts = new Date().toISOString().slice(0,10);
                    XLSX.writeFile(wb, `stock_levels_${ts}.xlsx`);
                  })();
                }}
                className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <UploadIcon className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button onClick={initialize} className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <RotateCcw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          {levels.length > 0 ? (
            <DataTable columns={levelColumns as any} data={levels as any} searchable pagination pageSize={20} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
              <div className="text-gray-600 mb-2">No stock data found</div>
              <p className="text-sm text-gray-500 mb-4">Add your first inbound stock or upload a file to get started.</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setShowInboundModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Stock</button>
                <button onClick={initialize} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Refresh</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center"><UploadIcon className="w-4 h-4 mr-2 text-blue-600" />Bulk Upload Inbound</h3>
            <p className="text-sm text-gray-600 mb-3">Columns: supplier_name, equipment_item_id or item_name, size, quantity, delivery_date (YYYY-MM-DD), notes</p>
            <FileUpload
              title="Upload Inbound File"
              description="Upload CSV/Excel with inbound rows. You can supply either equipment_item_id or item_name to map items."
              requiredColumns={inboundRequiredColumns}
              requiredColumnsNote="Either equipment_item_id or item_name must be present. Quantity must be positive."
              onFileProcessed={handleInboundUpload}
            />
          </div>
        </div>
      )}

      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
                      <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center"><Package className="w-5 h-5 mr-2 text-gray-700" />Stock Levels</h2>
            <p className="text-sm text-gray-600 mt-1">Shows Distributed as of Now and Remaining Available Stock for each item and size</p>
          </div>
            <div className="flex items-center gap-2">
              <button onClick={initialize} className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <RotateCcw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  (async () => {
                    const XLSX = await import('xlsx');
                    if (!levels || levels.length === 0) { toast.error('No stock to export'); return; }
                    const exportRows = levels.map((r: any) => ({
                      Item: r.item_name,
                      Size: r.size,
                      InStock: r.stock_count,
                      UnitPrice: (priceMap.get(r.equipment_item_id) ?? 0),
                      StockValue: (priceMap.get(r.equipment_item_id) ?? 0) * (Number(r.stock_count) || 0),
                      FirstMovementAt: r.first_movement_at,
                      LastMovementAt: r.last_movement_at,
                    }));
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(exportRows);
                    XLSX.utils.book_append_sheet(wb, ws, 'Stock Levels');
                    const ts = new Date().toISOString().slice(0,10);
                    XLSX.writeFile(wb, `stock_levels_${ts}.xlsx`);
                  })();
                }}
                className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <UploadIcon className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          {levels.length > 0 ? (
            <DataTable columns={levelColumns as any} data={levels as any} searchable pagination pageSize={50} />
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600">No stock levels yet</div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><ArrowUpCircle className="w-5 h-5 mr-2 text-red-600" />Record Distribution/Return</h2>
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={txForm.transaction_type} onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value as any })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="distribution">Distribution (decrease)</option>
                  <option value="return">Return (increase)</option>
                  <option value="adjustment">Adjustment (+/-)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
                <div className="flex gap-2">
                  <select
                    value={txForm.equipment_item_id}
                    onChange={(e) => setTxForm({ ...txForm, equipment_item_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select item</option>
                    {items
                      .filter((it) => it.is_active !== false)
                      .map((it) => (
                        <option key={it.id} value={it.id}>{it.name} {it.category ? `(${it.category})` : ''}</option>
                      ))}
                  </select>
                  <button type="button" onClick={() => setShowManageEquipmentModal(true)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">+ New</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size (optional)</label>
                  <input value={txForm.size} onChange={(e) => setTxForm({ ...txForm, size: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="M / L / 42" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="25" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Optional" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </form>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center"><ArrowUpCircle className="w-5 h-5 mr-2 text-red-600" />Recent Transactions</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    (async () => {
                      const XLSX = await import('xlsx');
                      if (!transactions || transactions.length === 0) { toast.error('No history to export'); return; }
                      const exportRows = transactions.map((t: any) => ({
                        DateTime: new Date(t.created_at).toISOString(),
                        Item: t.item_name,
                        Size: t.size || 'N/A',
                        Type: t.transaction_type,
                        Quantity: t.quantity,
                        UnitPrice: t.unit_price ?? 0,
                        Total: Math.abs(Number(t.quantity)||0) * (Number(t.unit_price)||0),
                        Supplier: t.supplier_name || '',
                        DeliveryDate: t.delivery_date || '',
                        Notes: t.notes || '',
                        ReferenceType: t.reference_type || '',
                        ReferenceId: t.reference_id || '',
                      }));
                      const wb = XLSX.utils.book_new();
                      const ws = XLSX.utils.json_to_sheet(exportRows);
                      XLSX.utils.book_append_sheet(wb, ws, 'History');
                      const ts = new Date().toISOString().slice(0,10);
                      XLSX.writeFile(wb, `stock_history_${ts}.xlsx`);
                    })();
                  }}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <UploadIcon className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button onClick={handleDeleteAllHistory} className="flex items-center space-x-2 text-red-700 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All History</span>
                </button>
              </div>
            </div>
            {transactions.length > 0 ? (
              <DataTable columns={transactionColumns as any} data={transactions as any} searchable pagination pageSize={25} />
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600">No transactions yet</div>
            )}
              <div className="mt-8">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center"><UploadIcon className="w-4 h-4 mr-2 text-blue-600" />Bulk Upload Transactions</h3>
              <p className="text-sm text-gray-600 mb-3">Columns: transaction_type (distribution/return/adjustment), equipment_item_id or item_name, size, quantity (positive), notes. Unit price is derived automatically from the item.</p>
              <FileUpload
                title="Upload Transactions File"
                description="Upload CSV/Excel to record many distributions/returns/adjustments at once."
                requiredColumns={txRequiredColumns}
                requiredColumnsNote="Distribution quantities will be stored as negative automatically."
                onFileProcessed={handleTransactionsUpload}
              />
            </div>
          </div>
        </div>
      )}

      {showInboundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center"><ArrowDownCircle className="w-5 h-5 mr-2 text-green-600" />Record Inbound</h2>
                <button onClick={() => setShowInboundModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleInboundSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Supplier Co." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
                  <div className="flex gap-2">
                    <select
                      value={form.equipment_item_id}
                      onChange={(e) => setForm({ ...form, equipment_item_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Select item</option>
                      {items
                        .filter((it) => it.is_active !== false)
                        .map((it) => (
                          <option key={it.id} value={it.id}>{it.name} {it.category ? `(${it.category})` : ''}</option>
                        ))}
                    </select>
                    <button type="button" onClick={() => setShowManageEquipmentModal(true)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">+ New</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size (optional)</label>
                    <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="M / L / 42" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (optional)</label>
                    <input type="number" step="0.01" value={inboundUnitPrice} onChange={(e) => setInboundUnitPrice(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                    <input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Optional" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Add Inbound</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showManageEquipmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">New Equipment Item</h2>
                <button onClick={() => setShowManageEquipmentModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    if (!manageForm.name.trim()) {
                      toast.error('Enter name');
                      return;
                    }
                    const sizesArray = manageForm.sizes
                      .split(',')
                      .map((s) => s.trim())
                      .filter((s) => s.length > 0);
                    const payload: Partial<EquipmentItem> & { sizes: string[] } = {
                      name: manageForm.name.trim(),
                      category: manageForm.category.trim() || 'general',
                      sizes: sizesArray.length ? sizesArray : ['One Size'],
                      current_price: Number(manageForm.current_price) || 0,
                      is_chargeable: Boolean(manageForm.is_chargeable),
                      is_active: Boolean(manageForm.is_active),
                    } as any;
                    const { data: inserted, error } = await supabase
                      .from('equipment_items')
                      .insert(payload as any)
                      .select()
                      .single();
                    if (error) throw error;
                    toast.success('Equipment created');
                    // Preselect the newly created item in open forms
                    if (inserted && inserted.id) {
                      setForm((f) => ({ ...f, equipment_item_id: inserted.id }));
                      setTxForm((t) => ({ ...t, equipment_item_id: inserted.id }));
                    }
                    setShowManageEquipmentModal(false);
                    setManageForm({ name: '', category: 'general', sizes: 'One Size', current_price: '0', is_chargeable: false, is_active: true });
                    await initialize();
                  } catch (err: any) {
                    console.error('Create equipment failed', err);
                    toast.error(err?.message || 'Failed to create equipment');
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input value={manageForm.name} onChange={(e) => setManageForm({ ...manageForm, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Helmet" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={manageForm.category} onChange={(e) => setManageForm({ ...manageForm, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
                    <input type="number" step="0.01" value={manageForm.current_price} onChange={(e) => setManageForm({ ...manageForm, current_price: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma separated)</label>
                  <input value={manageForm.sizes} onChange={(e) => setManageForm({ ...manageForm, sizes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="S,M,L,XL" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input type="checkbox" className="mr-2" checked={manageForm.is_chargeable} onChange={(e) => setManageForm({ ...manageForm, is_chargeable: e.target.checked })} /> Chargeable
                  </label>
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input type="checkbox" className="mr-2" checked={manageForm.is_active} onChange={(e) => setManageForm({ ...manageForm, is_active: e.target.checked })} /> Active
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowManageEquipmentModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditItemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Manage Equipment Items</h2>
                <button onClick={() => setShowEditItemsModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="max-h-[60vh] overflow-auto">
                {(items || []).length === 0 ? (
                  <div className="text-gray-600">No items found</div>
                ) : (
                  <div className="space-y-3">
                    {(items || []).map((it) => (
                      <div key={it.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center border border-gray-200 rounded-lg p-3">
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium text-gray-900">{it.name}</div>
                          <div className="text-xs text-gray-500">{it.category || 'general'}</div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={typeof it.current_price === 'number' ? it.current_price : Number(it.current_price) || 0}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setItems((prev) => prev.map((p) => p.id === it.id ? ({ ...p, current_price: v }) as any : p));
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Active</label>
                          <input
                            type="checkbox"
                            checked={it.is_active !== false}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setItems((prev) => prev.map((p) => p.id === it.id ? ({ ...p, is_active: val }) as any : p));
                            }}
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('equipment_items')
                                  .update({
                                    current_price: typeof it.current_price === 'number' ? it.current_price : Number(it.current_price) || 0,
                                    is_active: it.is_active !== false,
                                  } as any)
                                  .eq('id', it.id);
                                if (error) throw error;
                                toast.success('Item saved');
                                await initialize();
                              } catch (err: any) {
                                console.error('Save item failed', err);
                                toast.error(err?.message || 'Save failed');
                              }
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Edit Stock Level</h2>
                <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-sm text-gray-700 mb-4">
                <div><strong>Item:</strong> {adjustForm.item_name}</div>
                <div><strong>Size:</strong> {adjustForm.size || 'N/A'}</div>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-800 mb-2">Current Stock Status</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Total Distributed:</strong> <span className="text-red-600">{adjustForm.totalDistributed}</span> units</div>
                    <div><strong>Current Available:</strong> <span className="text-green-600 font-semibold">{adjustForm.availableStock}</span> units</div>
                  </div>
                  <div className="border-t border-blue-300 pt-2 mt-2 text-center">
                    <div className="text-sm text-blue-700">
                      <strong>Calculation:</strong> Inbound - Distributed = Available
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <div><strong>Note:</strong> This is the current available stock after all distributions.</div>
                  <div>When you update this count, it will create an adjustment transaction.</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Available Stock Count</label>
                  <input 
                    type="number" 
                    value={adjustForm.newCount} 
                    onChange={(e) => setAdjustForm({ ...adjustForm, newCount: Number(e.target.value) })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                    placeholder={`Current: ${adjustForm.availableStock}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {adjustForm.newCount > 0 ? (
                      <span>
                        <strong>New Available Stock:</strong> {adjustForm.newCount} - {adjustForm.totalDistributed} = <span className="text-green-600 font-semibold">{adjustForm.newCount - adjustForm.totalDistributed}</span> units
                        <br />
                        <span className="text-gray-600">The API will receive <strong>{adjustForm.newCount - adjustForm.totalDistributed}</strong> units (distributed units remain unchanged)</span>
                      </span>
                    ) : (
                      "Enter the new total available stock count (this will create an adjustment transaction)"
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <input value={adjustForm.notes} onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAdjustModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                  <button
                    onClick={async () => {
                      try {
                        // Calculate the new available stock (what user entered minus distributed)
                        const newAvailableStock = Math.floor(adjustForm.newCount - adjustForm.totalDistributed);
                        const currentAvailableStock = Math.floor(adjustForm.availableStock);
                        
                        if (newAvailableStock === currentAvailableStock) {
                          setShowAdjustModal(false);
                          return;
                        }
                        
                        // Calculate the difference needed to reach the new available stock
                        const diff = newAvailableStock - currentAvailableStock;
                        
                        const { error } = await supabase.from('equipment_stock_transactions').insert({
                          equipment_item_id: adjustForm.equipment_item_id,
                          size: adjustForm.size === 'N/A' ? null : adjustForm.size,
                          transaction_type: 'adjustment',
                          quantity: diff, // positive increases, negative decreases
                          notes: adjustForm.notes || 'Manual edit',
                          reference_type: 'manual_edit',
                        } as any);
                        if (error) throw error;
                        toast.success('Stock adjusted');
                        setShowAdjustModal(false);
                        await initialize();
                      } catch (err: any) {
                        console.error('Adjustment failed', err);
                        toast.error(err?.message || 'Adjustment failed');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center"><Package className="w-5 h-5 mr-2 text-gray-700" />Current Stock Levels</h2>
            {levels.length > 0 ? (
              <DataTable columns={levelColumns as any} data={levels as any} searchable pagination pageSize={50} />
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600">No stock levels yet</div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center"><Calendar className="w-4 h-4 mr-2" />Weekly Net Movement</h3>
              <div className="max-h-80 overflow-auto">
                {weekly.map((w, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span>{w.item_name} {w.size !== 'N/A' ? `(${w.size})` : ''}</span>
                    <span>
                      {new Date(w.week_start).toLocaleDateString()}:{' '}
                      <span className={w.net_movement >= 0 ? 'text-green-700' : 'text-red-700'}>{w.net_movement}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center"><Calendar className="w-4 h-4 mr-2" />Monthly Net Movement</h3>
              <div className="max-h-80 overflow-auto">
                {monthly.map((m, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span>{m.item_name} {m.size !== 'N/A' ? `(${m.size})` : ''}</span>
                    <span>
                      {new Date(m.month_start).toLocaleDateString()}:{' '}
                      <span className={m.net_movement >= 0 ? 'text-green-700' : 'text-red-700'}>{m.net_movement}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentStock;

function RiderReturnForm({ items, onDone }: { items: any[]; onDone: () => Promise<void> | void }) {
  const [riderId, setRiderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [rider, setRider] = useState<any | null>(null);
  const [eligibleForRefund, setEligibleForRefund] = useState<boolean | null>(null);
  const [selections, setSelections] = useState<{ name: string; size: string; quantity: number }[]>([]);
  const [restock, setRestock] = useState<boolean>(true);
  const [note, setNote] = useState<string>('');
  const [collectedMap, setCollectedMap] = useState<Record<string, number>>({});

  const fetchRider = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('riders').select('*').eq('rider_id', riderId).single();
      if (error) throw error;
      setRider(data);
      const eqDate = data?.data?.equipment_completion_date || data?.data?.equipment_scheduled_date;
      if (eqDate) {
        const diffMs = Date.now() - new Date(eqDate).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        setEligibleForRefund(diffDays <= 90);
      } else {
        setEligibleForRefund(null);
      }
      // Preload selections from allocated items with positive quantities
      const allocated = Array.isArray(data?.data?.equipment_allocated_items) ? data.data.equipment_allocated_items : [];
      const rows: { name: string; size: string; quantity: number }[] = [];
      const map: Record<string, number> = {};
      allocated.forEach((item: any) => {
        Object.entries(item.sizes || {}).forEach(([size, qty]: [string, any]) => {
          const q = Number(qty) || 0;
          if (q > 0) {
            rows.push({ name: item.name, size, quantity: 0 });
            const key = `${item.name}|${size}`;
            map[key] = (map[key] || 0) + q;
          }
        });
      });
      setCollectedMap(map);
      setSelections(rows);
    } catch (err: any) {
      console.error('Fetch rider failed', err);
      toast.error(err?.message || 'Rider not found');
      setRider(null);
      setEligibleForRefund(null);
    } finally {
      setLoading(false);
    }
  };

  const submitReturn = async () => {
    try {
      if (!rider) { toast.error('Load rider first'); return; }
      const chosen = selections.filter((s) => Number(s.quantity) > 0);
      if (chosen.length === 0) { toast.error('Enter quantities to return'); return; }
      // Validate against collected quantities per item/size
      for (const s of chosen) {
        const key = `${s.name}|${s.size}`;
        const maxCollected = collectedMap[key] || 0;
        if (s.quantity > maxCollected) {
          toast.error(`Return for ${s.name} ${s.size} exceeds collected (${s.quantity} > ${maxCollected})`);
          return;
        }
      }
      // If restock, create positive transactions (returns) to increase stock
      if (restock) {
        const payloads = chosen.map((s) => {
          const itemId = items.find((i) => i.name === s.name)?.id;
          return {
            equipment_item_id: itemId,
            size: s.size === 'N/A' ? null : s.size,
            transaction_type: 'return',
            quantity: Math.abs(Number(s.quantity)),
            notes: `Return from rider ${rider.rider_id}${note ? ' - ' + note : ''}`,
            reference_type: 'return',
            reference_id: rider.rider_id,
          } as Partial<EquipmentStockTransaction>;
        }).filter((p) => p.equipment_item_id);
        if (payloads.length) {
          const batchSize = 200;
          for (let i = 0; i < payloads.length; i += batchSize) {
            const slice = payloads.slice(i, i + batchSize);
            const { error } = await supabase.from('equipment_stock_transactions').insert(slice as any);
            if (error) throw error;
          }
        }
      } else {
        // Just log as a history row without changing stock
        const payloads = chosen.map((s) => ({
          equipment_item_id: items.find((i) => i.name === s.name)?.id,
          size: s.size === 'N/A' ? null : s.size,
          transaction_type: 'adjustment',
          quantity: 0,
          notes: `Non-restock return recorded for rider ${rider.rider_id}: ${s.name} ${s.size} x${s.quantity}${note ? ' - ' + note : ''}`,
          reference_type: 'return_info',
          reference_id: rider.rider_id,
        })) as any[];
        if (payloads.length) {
          const { error } = await supabase.from('equipment_stock_transactions').insert(payloads);
          if (error) throw error;
        }
      }
      toast.success('Return recorded');
      await onDone();
      setRider(null);
      setSelections([]);
      setRiderId('');
      setNote('');
    } catch (err: any) {
      console.error('Submit return failed', err);
      toast.error(err?.message || 'Failed to record return');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rider ID</label>
        <div className="flex gap-2">
          <input value={riderId} onChange={(e) => setRiderId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Enter Rider ID" />
          <button onClick={fetchRider} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Lookup</button>
        </div>
      </div>
      {loading && <div className="text-sm text-gray-600">Looking up rider...</div>}
      {rider && (
        <div className="space-y-3">
          <div className="text-sm text-gray-700">
            <div><strong>Name:</strong> {rider.data?.rider_name || '-'} ({rider.rider_id})</div>
            <div><strong>Collected On:</strong> {rider.data?.equipment_completion_date || rider.data?.equipment_scheduled_date || '-'}</div>
            {eligibleForRefund !== null && (
              <div className={`text-sm ${eligibleForRefund ? 'text-green-700' : 'text-gray-600'}`}>
                {eligibleForRefund ? 'Refund eligible (within 3 months)' : 'No refund (over 3 months)'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Items</label>
            <div className="space-y-2">
              {selections.length === 0 && (
                <div className="text-xs text-gray-500">No allocated items found. You can still record a note using the non-restock option.</div>
              )}
              {selections.map((row, idx) => {
                const key = `${row.name}|${row.size}`;
                const maxCollected = collectedMap[key] || 0;
                return (
                  <div key={`${row.name}-${row.size}-${idx}`} className="grid grid-cols-6 gap-2 items-center">
                    <div className="col-span-2 text-sm text-gray-800">{row.name}</div>
                    <div className="text-sm text-gray-600">{row.size}</div>
                    <input type="number" min={0} max={maxCollected} value={row.quantity} onChange={(e) => {
                      const raw = Number(e.target.value);
                      const v = Math.max(0, Math.min(maxCollected, Number.isFinite(raw) ? raw : 0));
                      setSelections((prev) => prev.map((p, i) => i === idx ? { ...p, quantity: v } : p));
                    }} className="border border-gray-300 rounded px-2 py-1 w-20" />
                    <div className="text-xs text-gray-500">qty</div>
                    <div className="text-xs text-gray-500">collected: {maxCollected}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center text-sm text-gray-700">
              <input type="checkbox" className="mr-2" checked={restock} onChange={(e) => setRestock(e.target.checked)} /> Restock to inventory
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Condition, missing parts, etc." />
          </div>
          <div className="flex justify-end">
            <button onClick={submitReturn} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Record Return</button>
          </div>
        </div>
      )}
    </div>
  );
}


