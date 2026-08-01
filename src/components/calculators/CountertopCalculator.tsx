import React, { useState, useEffect, useMemo } from 'react';
import { 
  Manufacturer, 
  PanelFormat, 
  Embossing, 
  PanelSize, 
  PanelThickness, 
  Currency, 
  CountertopSettings, 
  ProductType, 
  CountertopItem, 
  SavedCountertopCalc 
} from '../../types';
import { Plus, Trash2, Save, FolderOpen, Check, Calculator, Sparkles, RefreshCw, FileText } from 'lucide-react';
import { subscribeToCalculatorData, saveCalculatorStateToFirestore } from '../../lib/firebase';

interface CountertopCalculatorProps {
  manufacturers: Manufacturer[];
  decors: PanelFormat[];
  embossings: Embossing[];
  panelSizes: PanelSize[];
  thicknesses: PanelThickness[];
  currencies: Currency[];
  settings: CountertopSettings;
  productTypes: ProductType[];
  selectedCurrency: string;
}

export const CountertopCalculator: React.FC<CountertopCalculatorProps> = ({
  manufacturers,
  decors,
  embossings,
  panelSizes,
  thicknesses,
  currencies,
  settings,
  productTypes,
  selectedCurrency,
}) => {
  // Filter States
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<number | 'all'>('all');
  const [selectedDecorId, setSelectedDecorId] = useState<number>(decors[0]?.id || 1);
  const [selectedEmbossingId, setSelectedEmbossingId] = useState<number | 'all'>('all');
  const [selectedSizeId, setSelectedSizeId] = useState<number | 'all'>('all');
  const [selectedThicknessId, setSelectedThicknessId] = useState<number | 'all'>('all');

  // Custom calculation parameters override
  const [customMarkup, setCustomMarkup] = useState<number | null>(null);
  
  // Items list state
  const [items, setItems] = useState<CountertopItem[]>([
    {
      id: 'item-1',
      typeKey: 'kitchen',
      typeName: 'Кухонная столешница',
      widthMm: 600,
      lengthMm: 3000,
      quantity: 1,
      processingM: 3.0,
      note: 'Основная рабочая поверхность',
    },
    {
      id: 'item-2',
      typeKey: 'fartuk',
      typeName: 'Стеновая панель / Фартук',
      widthMm: 600,
      lengthMm: 3000,
      quantity: 1,
      processingM: 3.0,
      note: 'Фартук над столешницей',
    }
  ]);

  // Form inputs for adding item
  const [newItemType, setNewItemType] = useState<string>('kitchen');
  const [newItemWidth, setNewItemWidth] = useState<number>(600);
  const [newItemLength, setNewItemLength] = useState<number>(3000);
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemDecorId, setNewItemDecorId] = useState<number | 'default'>('default');
  const [newItemNote, setNewItemNote] = useState<string>('');

  // Calc metadata & saving state
  const [calcTitle, setCalcTitle] = useState<string>('Расчёт столешницы HPL');
  const [objectName, setObjectName] = useState<string>('Объект №1 (Частный заказ)');
  const [savedCalcs, setSavedCalcs] = useState<SavedCountertopCalc[]>(() => {
    try {
      const stored = localStorage.getItem('stc_saved_countertop_calcs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync saved calculations with Firestore database
  useEffect(() => {
    const unsubscribe = subscribeToCalculatorData((data) => {
      if (data && Array.isArray(data.stc_saved_countertop_calcs)) {
        setSavedCalcs(data.stc_saved_countertop_calcs);
      }
    });
    return () => unsubscribe();
  }, []);

  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Active decor item
  const activeDecor = useMemo(() => {
    return decors.find(d => d.id === selectedDecorId) || decors[0];
  }, [decors, selectedDecorId]);

  // Filtered decors based on manufacturer, embossing, thickness, size filters
  const availableEmbossings = useMemo(() => {
    if (selectedManufacturerId === 'all') return embossings;
    return embossings.filter(e => !e.manufacturerId || e.manufacturerId === selectedManufacturerId);
  }, [embossings, selectedManufacturerId]);

  const availableSizes = useMemo(() => {
    if (selectedManufacturerId === 'all') return panelSizes;
    return panelSizes.filter(s => !s.manufacturerId || s.manufacturerId === selectedManufacturerId);
  }, [panelSizes, selectedManufacturerId]);

  const filteredDecors = useMemo(() => {
    return decors.filter(d => {
      if (selectedManufacturerId !== 'all' && d.manufacturerId !== selectedManufacturerId) return false;
      if (selectedEmbossingId !== 'all' && d.embossingId !== selectedEmbossingId) return false;
      if (selectedThicknessId !== 'all' && d.thicknessId !== selectedThicknessId) return false;
      if (selectedSizeId !== 'all' && d.panelSizeId !== selectedSizeId) return false;
      return true;
    });
  }, [decors, selectedManufacturerId, selectedEmbossingId, selectedThicknessId, selectedSizeId]);

  // Exchange rate multiplier to RUB
  const activeCurrencyRate = useMemo(() => {
    const curr = currencies.find(c => c.code === selectedCurrency);
    return curr?.rateToRub || 1;
  }, [currencies, selectedCurrency]);

  const decorCurrencyRate = useMemo(() => {
    const curr = currencies.find(c => c.code === (activeDecor?.currency || 'EUR'));
    return curr?.rateToRub || 98.45;
  }, [currencies, activeDecor]);

  // Decor cost & price in RUB
  const costEurPerM2 = activeDecor?.cost || 58.0;
  const markupPercent = customMarkup !== null ? customMarkup : (activeDecor?.markup || 46.5);
  
  const costRubPerM2 = costEurPerM2 * decorCurrencyRate;
  const priceRubPerM2 = costRubPerM2 * (1 + markupPercent / 100);

  // Sheet format dimensions
  const sheetWidthMm = activeDecor?.widthMm || 1300;
  const sheetHeightMm = activeDecor?.heightMm || 3050;
  const sheetAreaM2 = (sheetWidthMm * sheetHeightMm) / 1000000;
  const sheetCostRub = costRubPerM2 * sheetAreaM2;
  const sheetPriceRub = priceRubPerM2 * sheetAreaM2;

  // Item math calculations with support for custom decor per item
  const itemsCalculated = useMemo(() => {
    return items.map(item => {
      const itemDecor = decors.find(d => d.id === (item.decorId || selectedDecorId)) || activeDecor;
      const itemRate = currencies.find(c => c.code === (itemDecor?.currency || 'EUR'))?.rateToRub || 98.45;
      const itemCostEur = itemDecor?.cost || 58.0;
      const itemMarkup = customMarkup !== null ? customMarkup : (itemDecor?.markup || 46.5);

      const itemCostRub = itemCostEur * itemRate;
      const itemPriceRubPerM2 = itemCostRub * (1 + itemMarkup / 100);

      const areaPerPiece = (item.widthMm * item.lengthMm) / 1000000;
      const totalArea = areaPerPiece * item.quantity;
      const pt = productTypes.find(p => p.typeKey === item.typeKey);
      const procRateM = pt ? pt.processingPerM : 12;
      
      // Auto processing length estimate if 0
      const processingM = item.processingM > 0 ? item.processingM : (item.lengthMm / 1000) * item.quantity;
      const processingCostRub = processingM * procRateM * (currencies.find(c => c.code === 'EUR')?.rateToRub || 98.45);

      const materialCostRub = totalArea * itemPriceRubPerM2;
      const itemTotalRub = materialCostRub + processingCostRub;

      return {
        ...item,
        itemDecor,
        itemPriceRubPerM2,
        areaPerPiece,
        totalArea,
        processingM,
        processingCostRub,
        materialCostRub,
        itemTotalRub,
      };
    });
  }, [items, decors, selectedDecorId, activeDecor, customMarkup, productTypes, currencies]);

  // Group calculations by Decor to compute sheet requirements per plate material
  const sheetsByDecor = useMemo(() => {
    const groups: {
      [decorId: number]: {
        decor: PanelFormat;
        totalAreaM2: number;
        materialCostRub: number;
        sheetsCount: number;
        sheetPriceRub: number;
      };
    } = {};

    itemsCalculated.forEach(item => {
      const d = item.itemDecor;
      if (!d) return;

      if (!groups[d.id]) {
        const rate = currencies.find(c => c.code === (d.currency || 'EUR'))?.rateToRub || 98.45;
        const costEur = d.cost || 58.0;
        const markup = customMarkup !== null ? customMarkup : (d.markup || 46.5);
        const pricePerM2 = costEur * rate * (1 + markup / 100);
        const sArea = (d.widthMm * d.heightMm) / 1000000;
        const sPrice = pricePerM2 * sArea;

        groups[d.id] = {
          decor: d,
          totalAreaM2: 0,
          materialCostRub: 0,
          sheetsCount: 0,
          sheetPriceRub: sPrice,
        };
      }

      groups[d.id].totalAreaM2 += item.totalArea;
      groups[d.id].materialCostRub += item.materialCostRub;
    });

    Object.values(groups).forEach(g => {
      const sArea = (g.decor.widthMm * g.decor.heightMm) / 1000000;
      g.sheetsCount = Math.max(1, Math.ceil((g.totalAreaM2 * 1.15) / sArea));
    });

    return Object.values(groups);
  }, [itemsCalculated, currencies, customMarkup]);

  // Total Summary
  const totalAreaM2 = useMemo(() => itemsCalculated.reduce((acc, i) => acc + i.totalArea, 0), [itemsCalculated]);
  const totalMaterialCostRub = useMemo(() => itemsCalculated.reduce((acc, i) => acc + i.materialCostRub, 0), [itemsCalculated]);
  const totalProcessingCostRub = useMemo(() => itemsCalculated.reduce((acc, i) => acc + i.processingCostRub, 0), [itemsCalculated]);
  const grandTotalRub = totalMaterialCostRub + totalProcessingCostRub;

  // Total estimated sheets across all decors
  const totalEstimatedSheetsCount = useMemo(() => {
    return sheetsByDecor.reduce((acc, s) => acc + s.sheetsCount, 0);
  }, [sheetsByDecor]);

  // Currency display helper
  const formatCurrency = (amountRub: number) => {
    const val = selectedCurrency === 'RUB' ? amountRub : amountRub / activeCurrencyRate;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: selectedCurrency,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Add Item Handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const pt = productTypes.find(p => p.typeKey === newItemType);
    const chosenDecorId = newItemDecorId === 'default' ? selectedDecorId : newItemDecorId;
    const item: CountertopItem = {
      id: `item-${Date.now()}`,
      typeKey: newItemType,
      typeName: pt ? pt.name : 'Изделие',
      widthMm: newItemWidth,
      lengthMm: newItemLength,
      quantity: newItemQty,
      processingM: (newItemLength / 1000) * newItemQty,
      decorId: chosenDecorId,
      note: newItemNote,
    };
    setItems(prev => [...prev, item]);
    setNewItemNote('');
  };

  // Update specific item's decor
  const handleUpdateItemDecor = (id: string, decorId: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, decorId } : i));
  };

  // Delete Item Handler
  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Save calculation to local history
  const handleSaveCalculation = () => {
    const calc: SavedCountertopCalc = {
      id: Date.now(),
      title: calcTitle || 'Расчёт столешницы',
      objectName: objectName || 'Объект',
      totalRub: grandTotalRub,
      createdAt: new Date().toLocaleString('ru-RU'),
      payload: {
        items,
        manufacturerId: activeDecor?.manufacturerId,
        decorId: activeDecor?.id,
        embossingId: activeDecor?.embossingId,
        panelSizeId: activeDecor?.panelSizeId,
        thicknessId: activeDecor?.thicknessId,
        costPerM2: costEurPerM2,
        markupPercent,
        currency: selectedCurrency,
        rateToRub: activeCurrencyRate,
      }
    };

    const updated = [calc, ...savedCalcs];
    setSavedCalcs(updated);
    saveCalculatorStateToFirestore('stc_saved_countertop_calcs', updated);

    setSavedSuccessMessage('Расчёт успешно сохранён в базу данных!');
    setTimeout(() => setSavedSuccessMessage(null), 3000);
  };

  // Load calculation
  const handleLoadCalc = (calc: SavedCountertopCalc) => {
    setCalcTitle(calc.title);
    setObjectName(calc.objectName);
    if (calc.payload.items) setItems(calc.payload.items);
    if (calc.payload.decorId) setSelectedDecorId(calc.payload.decorId);
    if (calc.payload.markupPercent) setCustomMarkup(calc.payload.markupPercent);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Title */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 border border-teal-800/80 px-2.5 py-0.5 rounded-full">
                Коммерческий модуль
              </span>
              <span className="text-xs text-slate-400">Точный расчёт стоимости изделий</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Калькулятор столешниц и стеновых панелей HPL
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Автоматический расчёт стоимости раскроя компакт-плит, кромления, торцевой обработки и себестоимости материалов по актуальным курсам.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSaveCalculation}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-emerald-600/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить расчёт</span>
            </button>
          </div>
        </div>

        {savedSuccessMessage && (
          <div className="mt-4 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{savedSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Filters & Parameters | Material Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Decor & Format Selection */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>1. Выбор декора и параметризация</span>
            </h2>
            <span className="text-xs text-slate-500">
              Доступно декоров: <strong className="text-slate-800">{filteredDecors.length}</strong>
            </span>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
            {/* Manufacturer Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Производитель</label>
              <select
                value={selectedManufacturerId}
                onChange={(e) => setSelectedManufacturerId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Все производители</option>
                {manufacturers.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>
            </div>

            {/* Embossing Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Тиснение</label>
              <select
                value={selectedEmbossingId}
                onChange={(e) => setSelectedEmbossingId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Все тиснения</option>
                {availableEmbossings.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.shortName})</option>
                ))}
              </select>
            </div>

            {/* Thickness Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Толщина</label>
              <select
                value={selectedThicknessId}
                onChange={(e) => setSelectedThicknessId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Все толщины</option>
                {thicknesses.map(t => (
                  <option key={t.id} value={t.id}>{t.thickness} мм</option>
                ))}
              </select>
            </div>

            {/* Format Size Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Формат листа</label>
              <select
                value={selectedSizeId}
                onChange={(e) => setSelectedSizeId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Все форматы</option>
                {availableSizes.map(s => (
                  <option key={s.id} value={s.id}>{s.heightMm}×{s.widthMm} мм</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Decor Selector Card */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Выберите декор компакт-плиты</label>
            <select
              value={selectedDecorId}
              onChange={(e) => {
                setSelectedDecorId(Number(e.target.value));
                setCustomMarkup(null);
              }}
              className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            >
              {filteredDecors.map(d => (
                <option key={d.id} value={d.id}>
                  [{d.decorNumber}] {d.decorName} — {d.heightMm}×{d.widthMm}×{d.thicknessMm || 12} мм ({d.pricePerM2} {d.currency}/м²)
                </option>
              ))}
            </select>
          </div>

          {/* Active Decor Details Card */}
          {activeDecor && (
            <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {activeDecor.decorPhotoPath ? (
                <img
                  src={activeDecor.decorPhotoPath}
                  alt={activeDecor.decorName}
                  className="w-24 h-24 object-cover rounded-lg border border-slate-700 shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs font-medium flex-shrink-0">
                  Без фото
                </div>
              )}

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    № {activeDecor.decorNumber}
                  </span>
                  <h3 className="text-base font-bold text-white">{activeDecor.decorName}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                  <div>Габариты: <strong>{activeDecor.heightMm}×{activeDecor.widthMm} мм</strong></div>
                  <div>Толщина: <strong>{activeDecor.thicknessMm || 12} мм</strong></div>
                  <div>Площадь листа: <strong>{sheetAreaM2.toFixed(2)} м²</strong></div>
                  <div>Базовая себест.: <strong>{costEurPerM2} €/м²</strong></div>
                  <div>Наценка: <strong>{markupPercent}%</strong></div>
                  <div>Курс пересчёта: <strong>{decorCurrencyRate.toFixed(2)} ₽/€</strong></div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Col: Cost & Pricing Parameters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-600" />
            <span>Параметры расчёта</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Наценка на материал (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={markupPercent}
                onChange={(e) => setCustomMarkup(Number(e.target.value))}
                className="w-full text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Себестоимость материала (м²):</span>
                <span className="font-semibold text-slate-900">{formatCurrency(costRubPerM2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Продажная цена материала (м²):</span>
                <span className="font-bold text-blue-600">{formatCurrency(priceRubPerM2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Себестоимость 1 листа:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(sheetCostRub)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Продажная цена 1 листа:</span>
                <span className="font-bold text-blue-600">{formatCurrency(sheetPriceRub)}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="font-bold text-slate-800">Ширина пропила (Керф): {settings.kerfMm} мм</div>
              <div className="text-slate-500">Запас технологического отхода: 15%</div>
            </div>
          </div>
        </div>

      </div>

      {/* Item Addition Form & List Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>2. Спецификация деталей / элементов столешницы</span>
          </h2>
        </div>

        {/* Form to add item */}
        <form onSubmit={handleAddItem} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Добавить деталь в расчёт</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Тип изделия</label>
              <select
                value={newItemType}
                onChange={(e) => {
                  setNewItemType(e.target.value);
                  const pt = productTypes.find(p => p.typeKey === e.target.value);
                  if (pt) {
                    setNewItemWidth(pt.minW);
                  }
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {productTypes.map(p => (
                  <option key={p.typeKey} value={p.typeKey}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Материал / Декор плиты</label>
              <select
                value={newItemDecorId}
                onChange={(e) => setNewItemDecorId(e.target.value === 'default' ? 'default' : Number(e.target.value))}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="default">
                  По умолчанию [{activeDecor?.decorNumber}] {activeDecor?.decorName}
                </option>
                {decors.map(d => (
                  <option key={d.id} value={d.id}>
                    [{d.decorNumber}] {d.decorName} ({d.heightMm}×{d.widthMm}×{d.thicknessMm || 12}мм)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ширина (мм)</label>
              <input
                type="number"
                min="50"
                max="2500"
                value={newItemWidth}
                onChange={(e) => setNewItemWidth(Number(e.target.value))}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Длина (мм)</label>
              <input
                type="number"
                min="100"
                max="5000"
                value={newItemLength}
                onChange={(e) => setNewItemLength(Number(e.target.value))}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Кол-во (шт)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={newItemQty}
                onChange={(e) => setNewItemQty(Number(e.target.value))}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-end lg:col-span-1">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить</span>
              </button>
            </div>

          </div>
        </form>

        {/* Table of Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">№</th>
                <th className="py-3 px-3">Наименование / Тип</th>
                <th className="py-3 px-3">Материал / Декор</th>
                <th className="py-3 px-3 text-center">Размеры (мм)</th>
                <th className="py-3 px-3 text-center">Площадь (м²)</th>
                <th className="py-3 px-3 text-center">Кол-во</th>
                <th className="py-3 px-3 text-center">Обработка (м.п.)</th>
                <th className="py-3 px-3 text-right">Материал</th>
                <th className="py-3 px-3 text-right">Обработка</th>
                <th className="py-3 px-3 text-right">Итого</th>
                <th className="py-3 px-3 text-center">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsCalculated.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <div>{item.typeName}</div>
                    {item.note && <div className="text-[11px] font-normal text-slate-500">{item.note}</div>}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={item.decorId || selectedDecorId}
                        onChange={(e) => handleUpdateItemDecor(item.id, Number(e.target.value))}
                        className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none max-w-[210px]"
                      >
                        {decors.map(d => (
                          <option key={d.id} value={d.id}>
                            [{d.decorNumber}] {d.decorName} ({d.thicknessMm || 12}мм)
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-medium">
                    {item.lengthMm} × {item.widthMm}
                  </td>
                  <td className="py-3 px-3 text-center font-medium">
                    {item.totalArea.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-center font-medium">
                    {item.processingM.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700">
                    {formatCurrency(item.materialCostRub)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700">
                    {formatCurrency(item.processingCostRub)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.itemTotalRub)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {itemsCalculated.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 text-sm">
                    Нет добавленных деталей. Воспользуйтесь формой выше, чтобы добавить элементы.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Breakdown by Decor Plates */}
        {sheetsByDecor.length > 0 && (
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                Расчёт потребности листов HPL по декорам ({sheetsByDecor.length} декор{sheetsByDecor.length > 1 ? 'а' : ''})
              </span>
              <span className="text-slate-400 font-medium lowercase">уточнённый расчёт по материалам</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sheetsByDecor.map(g => (
                <div key={g.decor.id} className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                    <div className="font-bold text-white text-xs truncate">
                      [{g.decor.decorNumber}] {g.decor.decorName}
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30 font-semibold">
                      {g.decor.thicknessMm || 12} мм
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Формат: <strong>{g.decor.heightMm}×{g.decor.widthMm} мм</strong> ({((g.decor.heightMm * g.decor.widthMm)/1000000).toFixed(2)} м²/лист)
                  </div>
                  <div className="flex justify-between items-center text-slate-300 pt-1">
                    <span>Площадь: <strong>{g.totalAreaM2.toFixed(2)} м²</strong></span>
                    <span className="text-teal-300 font-extrabold text-xs">Листов: {g.sheetsCount} шт.</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-700/60 text-[11px]">
                    <span className="text-slate-400">Стоимость листа:</span>
                    <span className="font-bold text-teal-400">{formatCurrency(g.sheetPriceRub)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Footer Box */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Общая площадь деталей</div>
            <div className="text-2xl font-extrabold text-white mt-0.5">
              {totalAreaM2.toFixed(2)} м²
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Всего листов: <strong className="text-teal-400">{totalEstimatedSheetsCount} шт.</strong> по типам декоров
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Стоимость материала</div>
            <div className="text-xl font-bold text-slate-200 mt-0.5">
              {formatCurrency(totalMaterialCostRub)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Стоимость обработки</div>
            <div className="text-xl font-bold text-slate-200 mt-0.5">
              {formatCurrency(totalProcessingCostRub)}
            </div>
          </div>

          <div className="bg-blue-600 rounded-xl p-4 text-right shadow-lg shadow-blue-600/30">
            <div className="text-xs text-blue-100 uppercase font-bold">ИТОГО К ОПЛАТЕ</div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {formatCurrency(grandTotalRub)}
            </div>
          </div>
        </div>

      </div>

      {/* Saved Calculations Drawer / Section */}
      {savedCalcs.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-500" />
              <span>История сохранённых расчётов</span>
            </h3>
            <span className="text-xs text-slate-500">Всего записей: {savedCalcs.length}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedCalcs.map(calc => (
              <div
                key={calc.id}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 transition flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 truncate">{calc.title}</div>
                  <div className="text-[11px] text-slate-500">{calc.objectName} — {calc.createdAt}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-sm font-extrabold text-blue-600">
                    {formatCurrency(calc.totalRub)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadCalc(calc)}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600 underline"
                    >
                      Загрузить
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Удалить расчёт из базы данных?')) {
                          const updated = savedCalcs.filter(c => c.id !== calc.id);
                          setSavedCalcs(updated);
                          saveCalculatorStateToFirestore('stc_saved_countertop_calcs', updated);
                        }
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 p-1"
                      title="Удалить расчёт из БД"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
