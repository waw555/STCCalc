import React, { useState, useMemo, useEffect } from 'react';
import { Currency } from '../../types';
import { 
  Scissors, Plus, Trash2, Layers, Settings, Sparkles, Info, Ruler, 
  CheckCircle2, AlertCircle, Save, FolderOpen, X, Check, FileText, Calendar, RefreshCw,
  RotateCw, ArrowLeftRight, ArrowUpDown, Maximize2, Grid, Eye, ZoomIn, Compass, Shield
} from 'lucide-react';

interface CuttingCalculatorProps {
  currencies: Currency[];
  selectedCurrency: string;
}

export type CuttingStrategy = 'length' | 'width' | 'optimal';

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
  canRotate: boolean; // Можно поворачивать деталь при раскрое
}

export interface PlacedPiece {
  id: string;
  pieceId: string;
  pieceIndex: number;
  note: string;
  xMm: number;
  yMm: number;
  placedWidthMm: number;
  placedHeightMm: number;
  origWidthMm: number;
  origHeightMm: number;
  isRotated: boolean;
  color: string;
}

export interface SheetLayout {
  id: string;
  sheetId: string;
  sheetName: string;
  sheetNumber: number;
  lengthMm: number;
  widthMm: number;
  trimmingMm: number;
  effectiveLengthMm: number;
  effectiveWidthMm: number;
  placedPieces: PlacedPiece[];
  usedAreaM2: number;
  effectiveAreaM2: number;
  wasteAreaM2: number;
  wastePercent: number;
}

export interface SavedCuttingCalculation {
  id: string;
  title: string;
  clientName?: string;
  createdAt: string;
  kerfMm: number;
  cuttingPricePerMeterRub: number;
  strategy?: CuttingStrategy;
  stockSheets: StockSheet[];
  pieces: Piece[];
  totalCutCostRub: number;
  totalSheetsUsed: number;
  totalPiecesCount: number;
}

const STORAGE_KEY = 'cbr_saved_cutting_calculations';

const PIECE_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#db2777', // Pink
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#65a30d', // Lime
  '#4f46e5', // Indigo
  '#0d9488', // Teal
];

interface UnplacedItem {
  pieceId: string;
  pieceIndex: number;
  note: string;
  widthMm: number;
  heightMm: number;
  canRotate: boolean;
  color: string;
}

// 2D Nesting & Packing Algorithm supporting Kerf, Trimming, Rotation, and 3 Cutting Strategies
export function calculateCuttingLayout(
  stockSheets: StockSheet[],
  pieces: Piece[],
  kerfMm: number,
  strategy: CuttingStrategy
): {
  sheetLayouts: SheetLayout[];
  unplacedItems: UnplacedItem[];
  totalPiecesPlaced: number;
  totalPiecesCount: number;
  totalLinearCutMeters: number;
} {
  // 1. Flatten pieces into individual item instances
  const itemsToPlace: UnplacedItem[] = [];
  pieces.forEach((p, pIdx) => {
    const color = PIECE_COLORS[pIdx % PIECE_COLORS.length];
    for (let i = 0; i < p.qty; i++) {
      itemsToPlace.push({
        pieceId: p.id,
        pieceIndex: pIdx + 1,
        note: p.note,
        widthMm: p.widthMm,
        heightMm: p.heightMm,
        canRotate: p.canRotate !== false,
        color,
      });
    }
  });

  const totalPiecesCount = itemsToPlace.length;

  // Sort items based on selected strategy
  if (strategy === 'length') {
    // Sort primarily by height to create longitudinal rows along sheet length
    itemsToPlace.sort((a, b) => Math.max(b.widthMm, b.heightMm) - Math.max(a.widthMm, a.heightMm));
  } else if (strategy === 'width') {
    // Sort primarily by width to create transverse columns along sheet width
    itemsToPlace.sort((a, b) => Math.max(b.widthMm, b.heightMm) - Math.max(a.widthMm, a.heightMm));
  } else {
    // Optimal: Sort by area descending
    itemsToPlace.sort((a, b) => (b.widthMm * b.heightMm) - (a.widthMm * a.heightMm));
  }

  // 2. Prepare stock sheets pool and placement
  const sheetLayouts: SheetLayout[] = [];
  const remainingItems = [...itemsToPlace];
  let sheetSequence = 1;

  const usedSheetCounts: Record<string, number> = {};
  stockSheets.forEach(s => { usedSheetCounts[s.id] = 0; });

  let stockIndex = 0;

  while (remainingItems.length > 0) {
    // Pick available stock sheet definition
    let currentStockDef: StockSheet | null = null;

    for (let idx = 0; idx < stockSheets.length; idx++) {
      const s = stockSheets[(stockIndex + idx) % stockSheets.length];
      const isUnlimited = s.maxQty === null || s.maxQty === undefined || s.maxQty === 0;
      const currentUsed = usedSheetCounts[s.id] || 0;

      if (isUnlimited || currentUsed < Number(s.maxQty)) {
        currentStockDef = s;
        break;
      }
    }

    if (!currentStockDef) {
      // Inventory exhausted
      break;
    }

    usedSheetCounts[currentStockDef.id] = (usedSheetCounts[currentStockDef.id] || 0) + 1;

    const trimming = currentStockDef.trimmingMm || 0;
    const effLen = Math.max(0, currentStockDef.lengthMm - 2 * trimming);
    const effWid = Math.max(0, currentStockDef.widthMm - 2 * trimming);

    if (effLen <= 0 || effWid <= 0) {
      break;
    }

    let freeRects = [{ x: 0, y: 0, w: effLen, h: effWid }];
    const placedOnThisSheet: PlacedPiece[] = [];
    let itemsPlacedThisSheetCount = 0;

    let itemIdx = 0;
    while (itemIdx < remainingItems.length) {
      const item = remainingItems[itemIdx];

      type Orientation = { w: number; h: number; rotated: boolean };
      const orientations: Orientation[] = [];

      if (strategy === 'length') {
        // Prefer orientation where longer side aligns with sheet length (w >= h)
        if (item.canRotate && item.widthMm !== item.heightMm) {
          if (item.widthMm >= item.heightMm) {
            orientations.push({ w: item.widthMm, h: item.heightMm, rotated: false });
            orientations.push({ w: item.heightMm, h: item.widthMm, rotated: true });
          } else {
            orientations.push({ w: item.heightMm, h: item.widthMm, rotated: true });
            orientations.push({ w: item.widthMm, h: item.heightMm, rotated: false });
          }
        } else {
          orientations.push({ w: item.widthMm, h: item.heightMm, rotated: false });
        }
      } else if (strategy === 'width') {
        // Prefer orientation where longer side aligns with sheet width (h >= w)
        if (item.canRotate && item.widthMm !== item.heightMm) {
          if (item.heightMm >= item.widthMm) {
            orientations.push({ w: item.widthMm, h: item.heightMm, rotated: false });
            orientations.push({ w: item.heightMm, h: item.widthMm, rotated: true });
          } else {
            orientations.push({ w: item.heightMm, h: item.widthMm, rotated: true });
            orientations.push({ w: item.widthMm, h: item.heightMm, rotated: false });
          }
        } else {
          orientations.push({ w: item.widthMm, h: item.heightMm, rotated: false });
        }
      } else {
        // Optimal Strategy
        orientations.push({ w: item.widthMm, h: item.heightMm, rotated: false });
        if (item.canRotate && item.widthMm !== item.heightMm) {
          orientations.push({ w: item.heightMm, h: item.widthMm, rotated: true });
        }
      }

      // Find best fitting free rectangle
      let bestFit: {
        freeRectIdx: number;
        orientation: Orientation;
        score: number;
      } | null = null;

      for (let rIdx = 0; rIdx < freeRects.length; rIdx++) {
        const rect = freeRects[rIdx];
        for (const ori of orientations) {
          if (ori.w <= rect.w && ori.h <= rect.h) {
            let score = 0;
            if (strategy === 'length') {
              score = rect.y * 10000 + rect.x + Math.abs(rect.h - ori.h);
            } else if (strategy === 'width') {
              score = rect.x * 10000 + rect.y + Math.abs(rect.w - ori.w);
            } else {
              // Best Short Side Fit
              const leftoverW = rect.w - ori.w;
              const leftoverH = rect.h - ori.h;
              score = Math.min(leftoverW, leftoverH);
            }

            if (bestFit === null || score < bestFit.score) {
              bestFit = { freeRectIdx: rIdx, orientation: ori, score };
            }
          }
        }
      }

      if (bestFit) {
        const targetRect = freeRects[bestFit.freeRectIdx];
        const ori = bestFit.orientation;

        placedOnThisSheet.push({
          id: `placed-${Date.now()}-${sheetSequence}-${itemsPlacedThisSheetCount}`,
          pieceId: item.pieceId,
          pieceIndex: item.pieceIndex,
          note: item.note,
          xMm: targetRect.x,
          yMm: targetRect.y,
          placedWidthMm: ori.w,
          placedHeightMm: ori.h,
          origWidthMm: item.widthMm,
          origHeightMm: item.heightMm,
          isRotated: ori.rotated,
          color: item.color,
        });

        // Split free rectangle with kerf offset
        const usedW = ori.w + kerfMm;
        const usedH = ori.h + kerfMm;

        const newRects: Array<{ x: number; y: number; w: number; h: number }> = [];

        if (strategy === 'length') {
          // Horizontal cuts preference
          if (targetRect.w - usedW > 0) {
            newRects.push({
              x: targetRect.x + usedW,
              y: targetRect.y,
              w: targetRect.w - usedW,
              h: ori.h,
            });
          }
          if (targetRect.h - usedH > 0) {
            newRects.push({
              x: targetRect.x,
              y: targetRect.y + usedH,
              w: targetRect.w,
              h: targetRect.h - usedH,
            });
          }
        } else if (strategy === 'width') {
          // Vertical cuts preference
          if (targetRect.h - usedH > 0) {
            newRects.push({
              x: targetRect.x,
              y: targetRect.y + usedH,
              w: ori.w,
              h: targetRect.h - usedH,
            });
          }
          if (targetRect.w - usedW > 0) {
            newRects.push({
              x: targetRect.x + usedW,
              y: targetRect.y,
              w: targetRect.w - usedW,
              h: targetRect.h,
            });
          }
        } else {
          // Optimal: Smaller remnant first
          const remW = targetRect.w - usedW;
          const remH = targetRect.h - usedH;
          if (remW < remH) {
            if (remW > 0) {
              newRects.push({ x: targetRect.x + usedW, y: targetRect.y, w: remW, h: ori.h });
            }
            if (remH > 0) {
              newRects.push({ x: targetRect.x, y: targetRect.y + usedH, w: targetRect.w, h: remH });
            }
          } else {
            if (remH > 0) {
              newRects.push({ x: targetRect.x, y: targetRect.y + usedH, w: ori.w, h: remH });
            }
            if (remW > 0) {
              newRects.push({ x: targetRect.x + usedW, y: targetRect.y, w: remW, h: targetRect.h });
            }
          }
        }

        freeRects.splice(bestFit.freeRectIdx, 1, ...newRects);
        freeRects = freeRects.filter(r => r.w >= 20 && r.h >= 20);

        remainingItems.splice(itemIdx, 1);
        itemsPlacedThisSheetCount++;
      } else {
        itemIdx++;
      }
    }

    if (itemsPlacedThisSheetCount === 0) {
      break;
    }

    const effectiveAreaM2 = (effLen * effWid) / 1000000;
    const usedAreaM2 = placedOnThisSheet.reduce((acc, p) => acc + (p.placedWidthMm * p.placedHeightMm) / 1000000, 0);
    const wasteAreaM2 = Math.max(0, effectiveAreaM2 - usedAreaM2);
    const wastePercent = effectiveAreaM2 > 0 ? (wasteAreaM2 / effectiveAreaM2) * 100 : 0;

    sheetLayouts.push({
      id: `layout-${sheetSequence}`,
      sheetId: currentStockDef.id,
      sheetName: currentStockDef.name,
      sheetNumber: sheetSequence,
      lengthMm: currentStockDef.lengthMm,
      widthMm: currentStockDef.widthMm,
      trimmingMm: currentStockDef.trimmingMm,
      effectiveLengthMm: effLen,
      effectiveWidthMm: effWid,
      placedPieces: placedOnThisSheet,
      usedAreaM2,
      effectiveAreaM2,
      wasteAreaM2,
      wastePercent,
    });

    sheetSequence++;
  }

  // Linear cut length calculation
  let totalLinearCutMeters = 0;
  sheetLayouts.forEach(layout => {
    layout.placedPieces.forEach(p => {
      totalLinearCutMeters += (p.placedWidthMm + p.placedHeightMm) / 1000;
    });
    if (layout.trimmingMm > 0) {
      totalLinearCutMeters += (layout.lengthMm + layout.widthMm) * 2 / 1000;
    }
  });

  return {
    sheetLayouts,
    unplacedItems: remainingItems,
    totalPiecesPlaced: totalPiecesCount - remainingItems.length,
    totalPiecesCount,
    totalLinearCutMeters,
  };
}

export const CuttingCalculator: React.FC<CuttingCalculatorProps> = ({ currencies, selectedCurrency }) => {
  // Global Cutting Parameters
  const [kerfMm, setKerfMm] = useState<number>(4.0);
  const [cuttingPricePerMeterRub, setCuttingPricePerMeterRub] = useState<number>(250);
  const [strategy, setStrategy] = useState<CuttingStrategy>('optimal');

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
    { id: 'p1', note: 'Фасадные панели', widthMm: 600, heightMm: 1200, qty: 4, canRotate: true },
    { id: 'p2', note: 'Боковины шкафа', widthMm: 450, heightMm: 800, qty: 6, canRotate: true },
    { id: 'p3', note: 'Полки', widthMm: 350, heightMm: 600, qty: 8, canRotate: false },
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

  // Cutting Map view mode state
  const [activeSheetTab, setActiveSheetTab] = useState<string>('all');
  const [zoomModalSheet, setZoomModalSheet] = useState<SheetLayout | null>(null);

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
    if (stockSheets.length <= 1) return;
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
      canRotate: true,
    }]);
  };

  const handleUpdatePiece = (id: string, fields: Partial<Piece>) => {
    setPieces(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
  };

  const handleDeletePiece = (id: string) => {
    setPieces(prev => prev.filter(p => p.id !== id));
  };

  // Execute 2D layout nesting calculation
  const layoutResult = useMemo(() => {
    const res = calculateCuttingLayout(stockSheets, pieces, kerfMm, strategy);
    const totalCutCostRub = res.totalLinearCutMeters * cuttingPricePerMeterRub;

    let totalPieceAreaM2 = 0;
    pieces.forEach(p => {
      totalPieceAreaM2 += (p.widthMm * p.heightMm / 1000000) * p.qty;
    });

    const totalSheetsUsed = res.sheetLayouts.length;
    const isFullyCovered = res.unplacedItems.length === 0;

    return {
      ...res,
      totalPieceAreaM2,
      totalSheetsUsed,
      totalCutCostRub,
      isFullyCovered,
    };
  }, [stockSheets, pieces, kerfMm, strategy, cuttingPricePerMeterRub]);

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
      strategy,
      stockSheets: JSON.parse(JSON.stringify(stockSheets)),
      pieces: JSON.parse(JSON.stringify(pieces)),
      totalCutCostRub: layoutResult.totalCutCostRub,
      totalSheetsUsed: layoutResult.totalSheetsUsed,
      totalPiecesCount: layoutResult.totalPiecesCount,
    };

    setSavedCalcs(prev => [newSavedItem, ...prev]);
    setIsSaveModalOpen(false);
    showToast(`Раскрой «${newSavedItem.title}» успешно сохранён!`);
  };

  const handleLoadSavedCalc = (saved: SavedCuttingCalculation) => {
    setKerfMm(saved.kerfMm);
    setCuttingPricePerMeterRub(saved.cuttingPricePerMeterRub);
    if (saved.strategy) setStrategy(saved.strategy);
    setStockSheets(saved.stockSheets);
    setPieces(saved.pieces.map(p => ({ ...p, canRotate: p.canRotate !== false })));
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

  // Helper renderer for a single sheet cutting map canvas
  const renderSheetCanvas = (sheet: SheetLayout, isZoomed: boolean = false) => {
    const scaleLen = sheet.lengthMm;
    const scaleWid = sheet.widthMm;
    const trimmingPctX = (sheet.trimmingMm / scaleLen) * 100;
    const trimmingPctY = (sheet.trimmingMm / scaleWid) * 100;
    const effPctX = (sheet.effectiveLengthMm / scaleLen) * 100;
    const effPctY = (sheet.effectiveWidthMm / scaleWid) * 100;

    return (
      <div className="space-y-3">
        {/* Sheet Card Top Specs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100 p-3 rounded-xl text-xs text-slate-700 font-semibold border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="bg-rose-600 text-white font-black px-2.5 py-1 rounded-lg">
              Лист №{sheet.sheetNumber}
            </span>
            <span className="font-bold text-slate-900">{sheet.sheetName}</span>
            <span className="text-slate-400">({sheet.lengthMm} × {sheet.widthMm} мм)</span>
            {sheet.trimmingMm > 0 && (
              <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                Торцевание: {sheet.trimmingMm} мм
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-slate-400">Использовано: </span>
              <span className="font-extrabold text-emerald-600">
                {sheet.usedAreaM2.toFixed(2)} м² ({(100 - sheet.wastePercent).toFixed(1)}%)
              </span>
            </div>
            <div>
              <span className="text-slate-400">Отходы: </span>
              <span className="font-extrabold text-rose-500">
                {sheet.wasteAreaM2.toFixed(2)} м² ({sheet.wastePercent.toFixed(1)}%)
              </span>
            </div>
            {!isZoomed && (
              <button
                type="button"
                onClick={() => setZoomModalSheet(sheet)}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition"
                title="Увеличить карту листа"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Visual Map Canvas Container */}
        <div 
          className={`relative bg-slate-900 rounded-2xl p-4 border-2 border-slate-800 overflow-hidden shadow-inner ${
            isZoomed ? 'h-[650px]' : 'h-[360px] sm:h-[420px]'
          }`}
        >
          {/* Inner Sheet Area */}
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <div 
              className="relative bg-slate-800 border-2 border-slate-600 rounded-lg shadow-2xl overflow-hidden"
              style={{
                width: '100%',
                height: '100%',
                aspectRatio: `${scaleLen} / ${scaleWid}`,
                maxHeight: '100%',
                maxWidth: '100%',
              }}
            >
              {/* Outer Dimensions Labels */}
              <div className="absolute top-1 left-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase z-20 pointer-events-none">
                Длина: {sheet.lengthMm} мм
              </div>
              <div className="absolute top-1/2 left-1 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-slate-400 tracking-wider uppercase z-20 pointer-events-none origin-left">
                Ширина: {sheet.widthMm} мм
              </div>

              {/* Trimming Frame Margin (if trimming > 0) */}
              {sheet.trimmingMm > 0 && (
                <div 
                  className="absolute border border-dashed border-rose-400/60 bg-rose-950/20 z-10 pointer-events-none flex items-center justify-center"
                  style={{
                    left: `${trimmingPctX}%`,
                    top: `${trimmingPctY}%`,
                    width: `${effPctX}%`,
                    height: `${effPctY}%`,
                  }}
                >
                  <span className="absolute bottom-1 right-2 text-[9px] font-semibold text-rose-300 opacity-75">
                    Полезная зона ({sheet.effectiveLengthMm} × {sheet.effectiveWidthMm} мм)
                  </span>
                </div>
              )}

              {/* Usable Area Box placing items */}
              <div 
                className="absolute"
                style={{
                  left: `${trimmingPctX}%`,
                  top: `${trimmingPctY}%`,
                  width: `${effPctX}%`,
                  height: `${effPctY}%`,
                }}
              >
                {sheet.placedPieces.map((p, pIndex) => {
                  const leftPct = (p.xMm / sheet.effectiveLengthMm) * 100;
                  const topPct = (p.yMm / sheet.effectiveWidthMm) * 100;
                  const widthPct = (p.placedWidthMm / sheet.effectiveLengthMm) * 100;
                  const heightPct = (p.placedHeightMm / sheet.effectiveWidthMm) * 100;

                  return (
                    <div
                      key={p.id}
                      className="absolute border border-white/90 rounded p-1 flex flex-col items-center justify-center text-center text-white transition-all hover:z-30 hover:scale-[1.02] hover:shadow-2xl overflow-hidden group"
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                        backgroundColor: p.color,
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)',
                      }}
                      title={`${p.note} (#${p.pieceIndex})\nГабариты: ${p.placedWidthMm} × ${p.placedHeightMm} мм\nОригинал: ${p.origWidthMm} × ${p.origHeightMm} мм\n${p.isRotated ? 'Повернуто 90°' : 'Исходная ориентация'}`}
                    >
                      <div className="font-extrabold text-[11px] sm:text-xs leading-tight drop-shadow truncate w-full px-1">
                        #{p.pieceIndex} {p.note}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-bold bg-black/40 px-1.5 py-0.5 rounded mt-0.5 backdrop-blur-xs">
                        {p.isRotated ? (
                          <span className="flex items-center gap-0.5 text-amber-300 font-black">
                            <RotateCw className="w-3 h-3 animate-spin-slow" /> 90°
                          </span>
                        ) : (
                          <span className="text-slate-200">
                            {p.placedWidthMm >= p.placedHeightMm ? '↔' : '↕'}
                          </span>
                        )}
                        <span>{p.placedWidthMm} × {p.placedHeightMm}</span>
                      </div>

                      {/* Hover Overlay detail view */}
                      <div className="absolute inset-0 bg-slate-900/90 text-white p-2 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-40 text-xs space-y-1">
                        <div className="font-bold text-amber-300">Деталь #{p.pieceIndex}</div>
                        <div className="font-semibold text-white">{p.note}</div>
                        <div className="text-[11px] text-slate-300">
                          {p.placedWidthMm} × {p.placedHeightMm} мм
                        </div>
                        {p.isRotated && (
                          <div className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded font-bold">
                            Повернуто на 90°
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5" />
                Интерактивная карта раскроя плит
              </span>
              <span className="text-xs text-slate-400">HPL, МДФ, Компакт-пластик</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Калькулятор и карта раскроя
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Визуализация расположения деталей на листах с контролем поворота 90°, 3 типами раскроя и учётом толщины пропила.
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

      {/* Saved Calculations Drawer */}
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
                      <span className="text-slate-400">Стратегия:</span>
                      <strong className="text-amber-300">
                        {item.strategy === 'length' ? 'По длине' : item.strategy === 'width' ? 'По ширине' : 'Оптимально'}
                      </strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
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
        
        {/* Box 1: Global Cutting Settings & 3 Strategy Modes */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-rose-600" />
              <span>Общие параметры и тип раскроя</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Алгоритм размещения деталей</span>
          </div>

          {/* Strategy Selection Buttons (3 Strategy Modes) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Тип (стратегия) раскроя *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              {/* Strategy 1: По длине */}
              <button
                type="button"
                onClick={() => setStrategy('length')}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  strategy === 'length'
                    ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-rose-600" />
                    По длине
                  </span>
                  {strategy === 'length' && (
                    <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Размещение продольными полосами вдоль длинной стороны листа.
                </p>
              </button>

              {/* Strategy 2: По ширине */}
              <button
                type="button"
                onClick={() => setStrategy('width')}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  strategy === 'width'
                    ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                    <ArrowUpDown className="w-4 h-4 text-rose-600" />
                    По ширине
                  </span>
                  {strategy === 'width' && (
                    <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Размещение поперечными полосами вдоль короткой стороны листа.
                </p>
              </button>

              {/* Strategy 3: Оптимально */}
              <button
                type="button"
                onClick={() => setStrategy('optimal')}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  strategy === 'optimal'
                    ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    Оптимально
                  </span>
                  {strategy === 'optimal' && (
                    <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Минимальные отходы (2D Bin Packing). Максимально эффективный раскрой.
                </p>
              </button>

            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Пропил пилы (толщина диска)
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
                Ширина реза между деталями.
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
                Стоимость прямого реза за 1 м.п.
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
            <div className="text-3xl font-black text-white">{formatCurrency(layoutResult.totalCutCostRub)}</div>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
            <div className="flex justify-between items-center text-slate-300">
              <span>Листов в расчёте:</span>
              <strong className="text-rose-400 font-extrabold text-sm">{layoutResult.totalSheetsUsed} шт.</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Деталей размещено:</span>
              <strong className="text-white font-bold">{layoutResult.totalPiecesPlaced} из {layoutResult.totalPiecesCount} шт.</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Общая площадь деталей:</span>
              <strong className="text-white font-bold">{layoutResult.totalPieceAreaM2.toFixed(2)} м²</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Метраж реза:</span>
              <strong className="text-white font-bold">{layoutResult.totalLinearCutMeters.toFixed(1)} м.п.</strong>
            </div>

            {!layoutResult.isFullyCovered && (
              <div className="bg-amber-950/80 border border-amber-600/50 rounded-lg p-2.5 text-amber-200 text-[11px] flex items-start gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Внимание:</strong> {layoutResult.unplacedItems.length} дет. не поместились! Добавьте исходные листы или измените габариты.
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
              Вы можете настроить несколько форматов листов и указать торцевание по периметру.
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
                <th className="py-3 px-3 text-center">В наличии (шт)</th>
                <th className="py-3 px-3 text-center">Удалить</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockSheets.map((s, idx) => {
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

      {/* Section 2: Cut Pieces List with Rotation Checkbox */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-rose-600" />
              <span>Детали для раскроя ({pieces.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Укажите габариты деталей, количество и возможность разворота на 90°.
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
                <th className="py-3 px-3 text-center bg-rose-50/70 text-rose-900">
                  <span className="flex items-center justify-center gap-1" title="Разрешить разворот детали на 90 градусов при оптимизации раскроя">
                    <RotateCw className="w-3.5 h-3.5 text-rose-600" />
                    Поворот (90°)
                  </span>
                </th>
                <th className="py-3 px-3 text-center">Площадь</th>
                <th className="py-3 px-3 text-center">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pieces.map((p, idx) => {
                const areaM2 = (p.widthMm * p.heightMm / 1000000) * p.qty;
                const pColor = PIECE_COLORS[idx % PIECE_COLORS.length];

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shadow-xs shrink-0" style={{ backgroundColor: pColor }} />
                        <span>#{idx + 1}</span>
                      </div>
                    </td>
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
                    
                    {/* Can Rotate Checkbox */}
                    <td className="py-2.5 px-3 text-center bg-rose-50/30">
                      <label className="inline-flex items-center justify-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={p.canRotate !== false}
                          onChange={(e) => handleUpdatePiece(p.id, { canRotate: e.target.checked })}
                          className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                        />
                        <span className={`font-bold text-xs ${p.canRotate !== false ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {p.canRotate !== false ? 'Да' : 'Фикс'}
                        </span>
                      </label>
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
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                    Список деталей пуст. Нажмите «Добавить деталь», чтобы внести элементы для раскроя.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Cutting Layout Map (Карта раскроя) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-slate-900">
                Карта раскроя (Схема размещения)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Графическое отображение деталей на исходных листах с габаритами и направлением.
            </p>
          </div>

          {/* Sheet Selector Tabs */}
          {layoutResult.sheetLayouts.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveSheetTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeSheetTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Все листы ({layoutResult.sheetLayouts.length})
              </button>
              {layoutResult.sheetLayouts.map((sheet) => (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => setActiveSheetTab(sheet.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    activeSheetTab === sheet.id
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Лист #{sheet.sheetNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cutting Maps List */}
        {layoutResult.sheetLayouts.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-600">Нет данных для построения карты раскроя</p>
            <p className="text-xs text-slate-400">Добавьте детали и исходные листы в таблицы выше.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {layoutResult.sheetLayouts
              .filter(s => activeSheetTab === 'all' || activeSheetTab === s.id)
              .map(sheet => (
                <div key={sheet.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                  {renderSheetCanvas(sheet)}
                </div>
              ))}

            {/* Pieces Legend Footer */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Легенда деталей на карте раскроя:
              </h4>
              <div className="flex flex-wrap gap-2">
                {pieces.map((p, idx) => {
                  const pColor = PIECE_COLORS[idx % PIECE_COLORS.length];
                  return (
                    <div 
                      key={p.id}
                      className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <span className="w-3.5 h-3.5 rounded-md shadow-xs" style={{ backgroundColor: pColor }} />
                      <span>#{idx + 1} {p.note} ({p.widthMm} × {p.heightMm} мм)</span>
                      <span className="text-slate-400 text-[11px] font-bold">— {p.qty} шт.</span>
                      {p.canRotate !== false ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                          90° OK
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded font-bold">
                          Фикс
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Action Bar Bottom */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold">Готовы сохранить результат раскроя?</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Сохранённые расчёты и карты раскроя можно повторно загружать в любой момент.
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
                  <span>{stockSheets.length} видов ({layoutResult.totalSheetsUsed} шт.)</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Тип раскроя:</span>
                  <span className="text-amber-700 font-bold">
                    {strategy === 'length' ? 'По длине' : strategy === 'width' ? 'По ширине' : 'Оптимально'}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Размещено деталей:</span>
                  <span>{layoutResult.totalPiecesPlaced} из {layoutResult.totalPiecesCount} шт.</span>
                </div>
                <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 pt-1 mt-1">
                  <span>Итого тариф распила:</span>
                  <span>{formatCurrency(layoutResult.totalCutCostRub)}</span>
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

      {/* Zoom Modal for Cutting Sheet Canvas */}
      {zoomModalSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-lg">
                  Лист №{zoomModalSheet.sheetNumber}
                </span>
                <h3 className="text-base font-bold text-white">
                  Карта раскроя: {zoomModalSheet.sheetName} ({zoomModalSheet.lengthMm} × {zoomModalSheet.widthMm} мм)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setZoomModalSheet(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {renderSheetCanvas(zoomModalSheet, true)}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div>
                Полезный размер листа после торцевания: <strong className="text-white">{zoomModalSheet.effectiveLengthMm} × {zoomModalSheet.effectiveWidthMm} мм</strong>
              </div>
              <button
                type="button"
                onClick={() => setZoomModalSheet(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl transition"
              >
                Закрыть окно
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
