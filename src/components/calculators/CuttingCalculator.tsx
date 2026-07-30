import React, { useState, useMemo, useEffect } from 'react';
import { Currency } from '../../types';
import { 
  Scissors, Plus, Trash2, Layers, Settings, Sparkles, Info, Ruler, 
  CheckCircle2, AlertCircle, Save, FolderOpen, X, Check, FileText, Calendar, RefreshCw
} from 'lucide-react';

interface CuttingCalculatorProps {
  currencies: Currency[];
  selectedCurrency: string;
}

export interface StockSheet {
  id: string;
  name: string;
  lengthMm: number;
  widthMm: number;
  trimmingMm: number; // Торцевание по периметру (мм)
  maxQty: number | null; // null or 0 = неограниченно
}

export interface Piece {
  id: string;
  note: string;
  widthMm: number;
  heightMm: number;
  qty: number;
}

export interface SavedCuttingCalculation {
  id: string;
  title: string;
  clientName?: string;
  createdAt: string;
  kerfMm: number;
  cuttingPricePerMeterRub: number;
  stockSheets: StockSheet[];
  pieces: Piece[];
  totalCutCostRub: number;
  totalSheetsUsed: number;
  totalPiecesCount: number;
}

const STORAGE_KEY = 'cbr_saved_cutting_calculations';

export const CuttingCalculator: React.FC<CuttingCalculatorProps> = ({ currencies, selectedCurrency }) => {
  // Global Cutting Parameters
  const [kerfMm, setKerfMm] = useState<number>(4.0);
  const [cuttingPricePerMeterRub, setCuttingPricePerMeterRub] = useState<number>(250);

  // Stock Sheets List
  const [stockSheets, setStockSheets] = useState<StockSheet[]>([
    {
      id: 'stock-1',
      name: 'Формат HPL 3050×1300',
      lengthMm: 3050,
      widthMm: 1300,
      trimmingMm: 10,
      maxQty: null, // Неограниченное количество
    },
    {
      id: 'stock-2',
      name: 'Остаток склада 2800×1300',
      lengthMm: 2800,
      widthMm: 1300,
      trimmingMm: 0,
      maxQty: 2, // Ограничено 2 листами
    },
  ]);

  // Pieces List
  const [pieces, setPieces] = useState<Piece[]>([
    { id: 'p1', note: 'Фасадные панели', widthMm: 600, heightMm: 1200, qty: 4 },
    { id: 'p2', note: 'Боковины шкафа', widthMm: 450, heightMm: 800, qty: 6 },
    { id: 'p3', note: 'Полки', widthMm: 350, heightMm: 600, qty: 8 },
  ]);

  // Saved calculations state
  const [savedCalcs, setSavedCalcs] = useState<SavedCuttingCalculation[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Save Modal & Toast States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveClientName, setSaveClientName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSavedList, setShowSavedList] = useState(false);

  // Sync saved calcs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCalcs));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, [savedCalcs]);

  // Currency rate conversion
  const activeCurrencyRate = useMemo(() => {
    return currencies.find(c => c.code === selectedCurrency)?.rateToRub || 1;
  }, [currencies, selectedCurrency]);

  const formatCurrency = (amountRub: number) => {
    const val = selectedCurrency === 'RUB' ? amountRub : amountRub / activeCurrencyRate;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: selectedCurrency,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Stock sheet management
  const handleAddStockSheet = () => {
    const newSheet: StockSheet = {
      id: `stock-${Date.now()}`,
      name: `Исходный лист ${stockSheets.length + 1}`,
      lengthMm: 3050,
      widthMm: 1300,
      trimmingMm: 10,
      maxQty: null,
    };
    setStockSheets(prev => [...prev, newSheet]);
  };

  const handleUpdateStockSheet = (id: string, fields: Partial<StockSheet>) => {
    setStockSheets(prev => prev.map(s => s.id === id ? { ...s, ...fields } : s));
  };

  const handleDeleteStockSheet = (id: string) => {
    if (stockSheets.length <= 1) return; // keep at least 1
    setStockSheets(prev => prev.filter(s => s.id !== id));
  };

  // Pieces management
  const handleAddPiece = () => {
    setPieces(prev => [...prev, {
      id: `p-${Date.now()}`,
      note: 'Новая деталь',
      widthMm: 500,
      heightMm: 1000,
      qty: 1,
    }]);
  };

  const handleUpdatePiece = (id: string, fields: Partial<Piece>) => {
    setPieces(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
  };

  const handleDeletePiece = (id: string) => {
    setPieces(prev => prev.filter(p => p.id !== id));
  };

  // Math Calculations: Piece area, stock allocation, linear cut length, cost
  const calculation = useMemo(() => {
    let totalPieceAreaM2 = 0;
    let totalLinearCutMeters = 0;
    let totalPiecesCount = 0;

    pieces.forEach(p => {
      const area = (p.widthMm * p.heightMm / 1000000) * p.qty;
      totalPieceAreaM2 += area;
      totalPiecesCount += p.qty;
      const perimeterM = ((p.widthMm + p.heightMm) * 2 / 1000) * p.qty;
      totalLinearCutMeters += (perimeterM / 2);
    });

    const requiredGrossAreaM2 = totalPieceAreaM2 * 1.12;
    let remainingAreaToCoverM2 = requiredGrossAreaM2;

    const sheetAllocations = stockSheets.map(sheet => {
      const trimming = sheet.trimmingMm || 0;
      const effectiveLengthMm = Math.max(0, sheet.lengthMm - 2 * trimming);
      const effectiveWidthMm = Math.max(0, sheet.widthMm - 2 * trimming);
      const effectiveAreaM2 = (effectiveLengthMm * effectiveWidthMm) / 1000000;
      const grossAreaM2 = (sheet.lengthMm * sheet.widthMm) / 1000000;

      const isUnlimited = sheet.maxQty === null || sheet.maxQty === undefined || sheet.maxQty === 0;
      const maxAvailableQty = isUnlimited ? Infinity : Math.max(0, Number(sheet.maxQty));

      let usedQty = 0;

      if (remainingAreaToCoverM2 > 0 && effectiveAreaM2 > 0 && maxAvailableQty > 0) {
        if (isUnlimited) {
          usedQty = Math.ceil(remainingAreaToCoverM2 / effectiveAreaM2);
          remainingAreaToCoverM2 = 0;
        } else {
          const neededQty = Math.ceil(remainingAreaToCoverM2 / effectiveAreaM2);
          usedQty = Math.min(neededQty, maxAvailableQty);
          remainingAreaToCoverM2 = Math.max(0, remainingAreaToCoverM2 - usedQty * effectiveAreaM2);
        }
      }

      return {
        ...sheet,
        effectiveLengthMm,
        effectiveWidthMm,
        effectiveAreaM2,
        grossAreaM2,
        isUnlimited,
        maxAvailableQty,
        usedQty,
        totalUsedEffectiveAreaM2: usedQty * effectiveAreaM2,
      };
    });

    const isFullyCovered = remainingAreaToCoverM2 <= 0.001;
    const totalSheetsUsed = sheetAllocations.reduce((acc, s) => acc + s.usedQty, 0);
    const totalCutCostRub = totalLinearCutMeters * cuttingPricePerMeterRub;

    return {
      totalPieceAreaM2,
      totalPiecesCount,
      totalLinearCutMeters,
      requiredGrossAreaM2,
      sheetAllocations,
      isFullyCovered,
      remainingUncoveredAreaM2: remainingAreaToCoverM2,
      totalSheetsUsed,
      totalCutCostRub,
    };
  }, [pieces, stockSheets, cuttingPricePerMeterRub]);

  // Handle Save Action
  const handleOpenSaveModal = () => {
    const defaultTitle = `Раскрой #${savedCalcs.length + 1} (${new Date().toLocaleDateString('ru-RU')})`;
    setSaveTitle(defaultTitle);
    setSaveClientName('');
    setIsSaveModalOpen(true);
  };

  const handleSaveCalculation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    const newSavedItem: SavedCuttingCalculation = {
      id: `calc-${Date.now()}`,
      title: saveTitle.trim(),
      clientName: saveClientName.trim() || undefined,
      createdAt: new Date().toLocaleString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      kerfMm,
      cuttingPricePerMeterRub,
      stockSheets: JSON.parse(JSON.stringify(stockSheets)),
      pieces: JSON.parse(JSON.stringify(pieces)),
      totalCutCostRub: calculation.totalCutCostRub,
      totalSheetsUsed: calculation.totalSheetsUsed,
      totalPiecesCount: calculation.totalPiecesCount,
    };

    setSavedCalcs(prev => [newSavedItem, ...prev]);
    setIsSaveModalOpen(false);
    showToast(`Раскрой «${newSavedItem.title}» успешно сохранён!`);
  };

  const handleLoadSavedCalc = (saved: SavedCuttingCalculation) => {
    setKerfMm(saved.kerfMm);
    setCuttingPricePerMeterRub(saved.cuttingPricePerMeterRub);
    setStockSheets(saved.stockSheets);
    setPieces(saved.pieces);
    showToast(`Загружен раскрой: «${saved.title}»`);
  };

  const handleDeleteSavedCalc = (id: string, title: string) => {
    setSavedCalcs(prev => prev.filter(item => item.id !== id));
    showToast(`Удален сохранённый раскрой «${title}»`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="space-y-6 relative">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5" />
                Мульти-форматный раскрой плит
              </span>
              <span className="text-xs text-slate-400">HPL и Компакт-пластик</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Калькулятор раскроя и отходов
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Гибкий расчёт с поддержкой нескольких исходных форматов плит, лимитов наличия, торцевания и общего тарифа пила.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {savedCalcs.length > 0 && (
              <button
                onClick={() => setShowSavedList(!showSavedList)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>Сохранённые ({savedCalcs.length})</span>
              </button>
            )}

            <button
              onClick={handleOpenSaveModal}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить раскрой</span>
            </button>
          </div>
        </div>
      </div>

      {/* Saved Calculations Drawer / Section */}
      {showSavedList && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Сохранённые расчеты раскроя</h2>
            </div>
            <button
              onClick={() => setShowSavedList(false)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {savedCalcs.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">Нет сохранённых расчетов раскроя.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedCalcs.map(item => (
                <div key={item.id} className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 space-y-3 relative group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                      {item.clientName && (
                        <p className="text-xs text-rose-300 font-medium">{item.clientName}</p>
                      )}
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {item.createdAt}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSavedCalc(item.id, item.title)}
                      title="Удалить расчет"
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Листов в расчёте:</span>
                      <strong className="text-white">{item.totalSheetsUsed} шт.</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Всего деталей:</span>
                      <strong className="text-white">{item.totalPiecesCount} шт.</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800">
                      <span className="text-slate-400 font-semibold">Стоимость реза:</span>
                      <strong className="text-rose-400 font-extrabold">{formatCurrency(item.totalCutCostRub)}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLoadSavedCalc(item)}
                    className="w-full flex items-center justify-center gap-1.5 bg-rose-600/90 hover:bg-rose-600 text-white font-semibold text-xs py-2 rounded-lg transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Загрузить в калькулятор</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Controls: Global Parameters & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Box 1: Global Cutting Settings */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-rose-600" />
              <span>Общие параметры раскроя</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Применяются ко всему заказу</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Пропил пилы (мм)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={kerfMm}
                  onChange={(e) => setKerfMm(Math.max(0, Number(e.target.value)))}
                  className="w-full text-sm font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
                <span className="text-xs font-semibold text-slate-500">мм</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Толщина пильного диска. Учитывается при калибровке каждого реза.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Тариф распила (₽/м.п.)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={cuttingPricePerMeterRub}
                  onChange={(e) => setCuttingPricePerMeterRub(Math.max(0, Number(e.target.value)))}
                  className="w-full text-sm font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
                <span className="text-xs font-semibold text-slate-500">₽/м.п.</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Стоимость прямого реза за 1 погонный метр для всех исходных плит.
              </p>
            </div>
          </div>
        </div>

        {/* Box 2: Summary Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-rose-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Стоимость услуг распила
            </div>
            <div className="text-3xl font-black text-white">{formatCurrency(calculation.totalCutCostRub)}</div>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
            <div className="flex justify-between items-center text-slate-300">
              <span>Итого листов в расчёте:</span>
              <strong className="text-rose-400 font-extrabold text-sm">{calculation.totalSheetsUsed} шт.</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Общая площадь деталей:</span>
              <strong className="text-white font-bold">{calculation.totalPieceAreaM2.toFixed(2)} м² ({calculation.totalPiecesCount} дет.)</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Линейный метраж пропила:</span>
              <strong className="text-white font-bold">{calculation.totalLinearCutMeters.toFixed(1)} м.п.</strong>
            </div>

            {!calculation.isFullyCovered && (
              <div className="bg-amber-950/80 border border-amber-600/50 rounded-lg p-2.5 text-amber-200 text-[11px] flex items-start gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Внимание:</strong> Не хватает запаса плит! Непокрыто {calculation.remainingUncoveredAreaM2.toFixed(2)} м². Добавьте исходные листы или снимите лимит количества.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenSaveModal}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-xl shadow transition mt-2"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить раскрой</span>
          </button>
        </div>

      </div>

      {/* Section 1: Stock Sheets Inventory */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-600" />
              <span>Исходные листы (Форматы и Запас плит)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Вы можете задать несколько форматов. Если количество не заполнено — считаем автоматический расход.
            </p>
          </div>
          <button
            onClick={handleAddStockSheet}
            className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить исходный лист</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">№</th>
                <th className="py-3 px-3">Наименование / Формат</th>
                <th className="py-3 px-3 text-center">Длина (мм)</th>
                <th className="py-3 px-3 text-center">Ширина (мм)</th>
                <th className="py-3 px-3 text-center">Торцевание (мм)</th>
                <th className="py-3 px-3 text-center">Кол-во в наличии (шт)</th>
                <th className="py-3 px-3 text-center">Полезный размер</th>
                <th className="py-3 px-3 text-center font-bold text-rose-700">Расход</th>
                <th className="py-3 px-3 text-center">Удалить</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockSheets.map((s, idx) => {
                const alloc = calculation.sheetAllocations.find(a => a.id === s.id);
                const isUnlimited = s.maxQty === null || s.maxQty === undefined || s.maxQty === 0;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => handleUpdateStockSheet(s.id, { name: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        value={s.lengthMm}
                        onChange={(e) => handleUpdateStockSheet(s.id, { lengthMm: Math.max(100, Number(e.target.value)) })}
                        className="w-24 text-center border border-slate-300 rounded-lg px-2 py-1.5 font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        value={s.widthMm}
                        onChange={(e) => handleUpdateStockSheet(s.id, { widthMm: Math.max(100, Number(e.target.value)) })}
                        className="w-24 text-center border border-slate-300 rounded-lg px-2 py-1.5 font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={s.trimmingMm}
                          placeholder="0"
                          onChange={(e) => handleUpdateStockSheet(s.id, { trimmingMm: Math.max(0, Number(e.target.value)) })}
                          className="w-20 text-center border border-slate-300 rounded-lg px-2 py-1.5 font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                        <span className="text-[10px] text-slate-400">мм</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          placeholder="Авто (без лимита)"
                          value={s.maxQty === null || s.maxQty === undefined ? '' : s.maxQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateStockSheet(s.id, { maxQty: val === '' ? null : Math.max(0, Number(val)) });
                          }}
                          className={`w-28 text-center border rounded-lg px-2 py-1.5 font-semibold text-xs outline-none focus:ring-2 focus:ring-rose-500 ${
                            isUnlimited
                              ? 'border-blue-300 bg-blue-50/50 text-blue-800 placeholder:text-blue-400'
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        />
                        <span className="text-[10px] font-medium text-slate-400">
                          {isUnlimited ? '∞ не ограничено' : `лимит: ${s.maxQty} шт.`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="text-slate-800 font-bold">
                        {alloc?.effectiveLengthMm} × {alloc?.effectiveWidthMm} мм
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({alloc?.effectiveAreaM2.toFixed(2)} м²/лист)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-1 rounded-lg font-black text-xs">
                        {alloc?.usedQty || 0} шт.
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDeleteStockSheet(s.id)}
                        disabled={stockSheets.length <= 1}
                        title="Удалить лист"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Cut Pieces List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-rose-600" />
              <span>Детали для раскроя ({pieces.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Укажите габариты получаемых деталей и необходимое количество штук.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddPiece}
              className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить деталь</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">№</th>
                <th className="py-3 px-3">Наименование / Назначение</th>
                <th className="py-3 px-3 text-center">Ширина (мм)</th>
                <th className="py-3 px-3 text-center">Длина (мм)</th>
                <th className="py-3 px-3 text-center">Кол-во (шт)</th>
                <th className="py-3 px-3 text-center">Общая площадь</th>
                <th className="py-3 px-3 text-center">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pieces.map((p, idx) => {
                const areaM2 = (p.widthMm * p.heightMm / 1000000) * p.qty;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={p.note}
                        onChange={(e) => handleUpdatePiece(p.id, { note: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        value={p.widthMm}
                        onChange={(e) => handleUpdatePiece(p.id, { widthMm: Math.max(1, Number(e.target.value)) })}
                        className="w-24 text-center border border-slate-300 rounded-lg px-2 py-1.5 font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        value={p.heightMm}
                        onChange={(e) => handleUpdatePiece(p.id, { heightMm: Math.max(1, Number(e.target.value)) })}
                        className="w-24 text-center border border-slate-300 rounded-lg px-2 py-1.5 font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={p.qty}
                        onChange={(e) => handleUpdatePiece(p.id, { qty: Math.max(1, Number(e.target.value)) })}
                        className="w-20 text-center border border-slate-300 rounded-lg px-2 py-1.5 font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {areaM2.toFixed(2)} м²
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeletePiece(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {pieces.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    Список деталей пуст. Нажмите «Добавить деталь», чтобы внести элементы для раскроя.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Action Bar Bottom */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold">Готовы сохранить результат раскроя?</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Сохранённые расчёты доступны в списке для загрузки, корректировки и печати в любой момент.
          </p>
        </div>
        <button
          onClick={handleOpenSaveModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить раскрой</span>
        </button>
      </div>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Сохранить раскрой</h3>
                  <p className="text-xs text-slate-500">Укажите наименование для быстрого поиска</p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCalculation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Наименование раскроя / Номер заказа *
                </label>
                <input
                  type="text"
                  required
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Например: Заказ №104 — Фасадные панели"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-rose-500 outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Заказчик / Клиент (необязательно)
                </label>
                <input
                  type="text"
                  value={saveClientName}
                  onChange={(e) => setSaveClientName(e.target.value)}
                  placeholder="ООО СпецСтрой / Иванов И.И."
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-rose-500 outline-none text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Исходных форматов:</span>
                  <span>{stockSheets.length} видов ({calculation.totalSheetsUsed} шт.)</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Количество деталей:</span>
                  <span>{calculation.totalPiecesCount} шт.</span>
                </div>
                <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 pt-1 mt-1">
                  <span>Итого тариф распила:</span>
                  <span>{formatCurrency(calculation.totalCutCostRub)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Сохранить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
