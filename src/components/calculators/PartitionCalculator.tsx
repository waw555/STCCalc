import React, { useState, useMemo } from 'react';
import { Currency, Service, Manufacturer } from '../../types';
import { DoorOpen, Plus, Trash2, Save, Check, FileText } from 'lucide-react';

interface PartitionCalculatorProps {
  manufacturers: Manufacturer[];
  currencies: Currency[];
  services: Service[];
  selectedCurrency: string;
}

interface CabinConfig {
  id: string;
  type: 'toilet_cabin' | 'urinal_partition' | 'shower_cabin';
  name: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  doorWidthMm: number;
  cabinsCount: number;
  hardwareKit: 'stc_stainless' | 'stc_nylon' | 'stc_aluminum';
}

export const PartitionCalculator: React.FC<PartitionCalculatorProps> = ({
  manufacturers,
  currencies,
  services,
  selectedCurrency,
}) => {
  const [objectName, setObjectName] = useState<string>('ТЦ "Галерея" — Туалетные кабины');
  const [panelType, setPanelType] = useState<string>('hpl_12');

  const [cabins, setCabins] = useState<CabinConfig[]>([
    {
      id: 'cab-1',
      type: 'toilet_cabin',
      name: 'Ряд из 3-х кабин (HPL 12мм)',
      widthMm: 1000,
      depthMm: 1500,
      heightMm: 2000,
      doorWidthMm: 600,
      cabinsCount: 3,
      hardwareKit: 'stc_stainless',
    },
    {
      id: 'cab-2',
      type: 'urinal_partition',
      name: 'Писсуарные экраны',
      widthMm: 400,
      depthMm: 800,
      heightMm: 1200,
      doorWidthMm: 0,
      cabinsCount: 2,
      hardwareKit: 'stc_aluminum',
    }
  ]);

  const [includeInstallation, setIncludeInstallation] = useState<boolean>(true);
  const [includeDelivery, setIncludeDelivery] = useState<boolean>(true);

  // Active currency rate
  const activeCurrencyRate = useMemo(() => {
    return currencies.find(c => c.code === selectedCurrency)?.rateToRub || 1;
  }, [currencies, selectedCurrency]);

  // Panel price base per m2
  const panelPricePerM2Rub = useMemo(() => {
    switch (panelType) {
      case 'hpl_12': return 8500;
      case 'hpl_13': return 9800;
      case 'ldsp_25': return 4200;
      default: return 8500;
    }
  }, [panelType]);

  // Hardware kits pricing per cabin
  const getHardwareKitPriceRub = (kit: string) => {
    switch (kit) {
      case 'stc_stainless': return 6500; // Нержавейка AISI 304
      case 'stc_nylon': return 4200; // Нейлоновый комплект STC
      case 'stc_aluminum': return 3500; // Алюминиевый профиль + петли
      default: return 5000;
    }
  };

  // Detailed area & cost calculation per cabin row
  const calculatedCabins = useMemo(() => {
    return cabins.map(item => {
      let areaPerCabin = 0;
      let totalHwPrice = 0;

      if (item.type === 'toilet_cabin') {
        // Front wall area (excluding doors) + Door + Side Walls + Partition dividers
        const sideWallsArea = (item.depthMm / 1000) * (item.heightMm / 1000) * 2; // 2 outer side walls
        const dividersArea = (item.depthMm / 1000) * (item.heightMm / 1000) * (item.cabinsCount - 1); // inner dividers
        const frontArea = (item.widthMm / 1000) * (item.heightMm / 1000) * item.cabinsCount; // front pilasters + doors
        
        areaPerCabin = (sideWallsArea + dividersArea + frontArea);
        totalHwPrice = getHardwareKitPriceRub(item.hardwareKit) * item.cabinsCount;
      } else if (item.type === 'urinal_partition') {
        const screenArea = (item.depthMm / 1000) * (item.heightMm / 1000);
        areaPerCabin = screenArea * item.cabinsCount;
        totalHwPrice = 1800 * item.cabinsCount; // mounting brackets
      } else {
        const showerArea = ((item.widthMm + item.depthMm) / 1000) * (item.heightMm / 1000) * item.cabinsCount;
        areaPerCabin = showerArea;
        totalHwPrice = 4500 * item.cabinsCount;
      }

      const totalMaterialCostRub = areaPerCabin * panelPricePerM2Rub;
      const totalRowPriceRub = totalMaterialCostRub + totalHwPrice;

      return {
        ...item,
        totalAreaM2: areaPerCabin,
        totalMaterialCostRub,
        totalHwPrice,
        totalRowPriceRub,
      };
    });
  }, [cabins, panelPricePerM2Rub]);

  // Aggregates
  const totalAreaM2 = useMemo(() => calculatedCabins.reduce((acc, c) => acc + c.totalAreaM2, 0), [calculatedCabins]);
  const totalPanelsCostRub = useMemo(() => calculatedCabins.reduce((acc, c) => acc + c.totalMaterialCostRub, 0), [calculatedCabins]);
  const totalHardwareCostRub = useMemo(() => calculatedCabins.reduce((acc, c) => acc + c.totalHwPrice, 0), [calculatedCabins]);

  // Installation & delivery services
  const installationCostRub = includeInstallation ? totalAreaM2 * 1800 : 0;
  const deliveryCostRub = includeDelivery ? 5000 : 0;

  const grandTotalRub = totalPanelsCostRub + totalHardwareCostRub + installationCostRub + deliveryCostRub;

  // Format currency helper
  const formatCurrency = (amountRub: number) => {
    const val = selectedCurrency === 'RUB' ? amountRub : amountRub / activeCurrencyRate;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: selectedCurrency,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleAddCabin = () => {
    const newCab: CabinConfig = {
      id: `cab-${Date.now()}`,
      type: 'toilet_cabin',
      name: 'Новый блок кабин',
      widthMm: 1000,
      depthMm: 1500,
      heightMm: 2000,
      doorWidthMm: 600,
      cabinsCount: 1,
      hardwareKit: 'stc_stainless',
    };
    setCabins(prev => [...prev, newCab]);
  };

  const handleDeleteCabin = (id: string) => {
    setCabins(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-800/80 px-2.5 py-0.5 rounded-full">
                Конструктор сантехперегородок
              </span>
              <span className="text-xs text-slate-400">HPL 12-13 мм / ЛДСП 25 мм</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Расчёт сантехнических кабин и писсуарных перегородок
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Быстрый расчёт расхода монолитного пластика HPL, системы профилей STC, фурнитуры из нержавеющей стали и услуг монтажа.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings & Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-indigo-600" />
            <span>Параметры объекта и материала</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Название объекта / Заказчика</label>
              <input
                type="text"
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Материал заполнения</label>
              <select
                value={panelType}
                onChange={(e) => setPanelType(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="hpl_12">HPL Компакт-пластик 12 мм (8 500 ₽/м²)</option>
                <option value="hpl_13">HPL Компакт-пластик 13 мм (9 800 ₽/м²)</option>
                <option value="ldsp_25">Влагостойкое ЛДСП 25 мм (4 200 ₽/м²)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInstallation}
                onChange={(e) => setIncludeInstallation(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Включить сборку и монтаж (1 800 ₽/м²)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDelivery}
                onChange={(e) => setIncludeDelivery(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Доставка на объект (5 000 ₽)</span>
            </label>
          </div>
        </div>

        {/* Total Stats Box */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-indigo-300 uppercase font-bold tracking-wider mb-1">Итого по объекту</div>
            <div className="text-3xl font-black text-white">{formatCurrency(grandTotalRub)}</div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
            <div className="flex justify-between">
              <span>Общая площадь перегородок:</span>
              <strong className="text-white">{totalAreaM2.toFixed(2)} м²</strong>
            </div>
            <div className="flex justify-between">
              <span>Стоимость HPL панелей:</span>
              <strong className="text-white">{formatCurrency(totalPanelsCostRub)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Фурнитура и крепеж:</span>
              <strong className="text-white">{formatCurrency(totalHardwareCostRub)}</strong>
            </div>
            {includeInstallation && (
              <div className="flex justify-between">
                <span>Монтажные работы:</span>
                <strong className="text-emerald-400">{formatCurrency(installationCostRub)}</strong>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Cabins Rows Specifications */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Конфигурация блоков кабин и экранов</span>
          </h2>

          <button
            onClick={handleAddCabin}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить блок</span>
          </button>
        </div>

        <div className="space-y-4">
          {calculatedCabins.map((cab, index) => (
            <div
              key={cab.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={cab.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCabins(prev => prev.map(c => c.id === cab.id ? { ...c, name: val } : c));
                    }}
                    className="text-sm font-bold bg-transparent border-b border-slate-300 focus:border-indigo-600 outline-none text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-semibold">
                    Итого блок: <strong className="text-indigo-600 text-sm">{formatCurrency(cab.totalRowPriceRub)}</strong>
                  </span>
                  <button
                    onClick={() => handleDeleteCabin(cab.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editable parameters for cabin */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Тип конструкции</label>
                  <select
                    value={cab.type}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setCabins(prev => prev.map(c => c.id === cab.id ? { ...c, type: val } : c));
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
                  >
                    <option value="toilet_cabin">Туалетная кабина</option>
                    <option value="urinal_partition">Писсуарный экран</option>
                    <option value="shower_cabin">Душевая кабина</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Ширина кабины (мм)</label>
                  <input
                    type="number"
                    value={cab.widthMm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCabins(prev => prev.map(c => c.id === cab.id ? { ...c, widthMm: val } : c));
                    }}
                    className="w-full border border-slate-300 rounded px-2 py-1 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Глубина (мм)</label>
                  <input
                    type="number"
                    value={cab.depthMm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCabins(prev => prev.map(c => c.id === cab.id ? { ...c, depthMm: val } : c));
                    }}
                    className="w-full border border-slate-300 rounded px-2 py-1 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Высота (мм)</label>
                  <input
                    type="number"
                    value={cab.heightMm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCabins(prev => prev.map(c => c.id === cab.id ? { ...c, heightMm: val } : c));
                    }}
                    className="w-full border border-slate-300 rounded px-2 py-1 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Количество кабин</label>
                  <input
                    type="number"
                    min="1"
                    value={cab.cabinsCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCabins(prev => prev.map(c => c.id === cab.id ? { ...c, cabinsCount: val } : c));
                    }}
                    className="w-full border border-slate-300 rounded px-2 py-1 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Комплект фурнитуры</label>
                  <select
                    value={cab.hardwareKit}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setCabins(prev => prev.map(c => c.id === cab.id ? { ...c, hardwareKit: val } : c));
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-[11px]"
                  >
                    <option value="stc_stainless">Нержавейка AISI 304 (6500 ₽)</option>
                    <option value="stc_nylon">Нейлон STC (4200 ₽)</option>
                    <option value="stc_aluminum">Анодированный профиль (3500 ₽)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                <span>Площадь: <strong className="text-slate-800">{cab.totalAreaM2.toFixed(2)} м²</strong></span>
                <span>Материал: <strong className="text-slate-800">{formatCurrency(cab.totalMaterialCostRub)}</strong></span>
                <span>Фурнитура: <strong className="text-slate-800">{formatCurrency(cab.totalHwPrice)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
