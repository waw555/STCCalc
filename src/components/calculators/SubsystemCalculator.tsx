import React, { useState, useEffect, useMemo } from 'react';
import { Currency } from '../../types';
import { Layers, Plus, Trash2, Shield, Check } from 'lucide-react';
import { subscribeToCalculatorData, saveCalculatorStateToFirestore } from '../../lib/firebase';

interface SubsystemCalculatorProps {
  currencies: Currency[];
  selectedCurrency: string;
}

export const SubsystemCalculator: React.FC<SubsystemCalculatorProps> = ({ currencies, selectedCurrency }) => {
  const [facadeAreaM2, setFacadeAreaM2] = useState<number>(() => {
    try {
      const s = localStorage.getItem('stc_subsystem_area');
      return s ? Number(s) : 350;
    } catch {
      return 350;
    }
  });
  const [enclosureType, setEnclosureType] = useState<string>(() => {
    try { return localStorage.getItem('stc_subsystem_enclosure') || 'brick'; } catch { return 'brick'; }
  });
  const [fastenerType, setFastenerType] = useState<string>(() => {
    try { return localStorage.getItem('stc_subsystem_fastener') || 'anchor'; } catch { return 'anchor'; }
  });
  const [profileType, setProfileType] = useState<string>(() => {
    try { return localStorage.getItem('stc_subsystem_profile') || 'omega_aluminum'; } catch { return 'omega_aluminum'; }
  });

  // Sync with Firestore database
  useEffect(() => {
    const unsubscribe = subscribeToCalculatorData((data) => {
      if (data) {
        if (data.stc_subsystem_area) setFacadeAreaM2(Number(data.stc_subsystem_area));
        if (data.stc_subsystem_enclosure) setEnclosureType(data.stc_subsystem_enclosure);
        if (data.stc_subsystem_fastener) setFastenerType(data.stc_subsystem_fastener);
        if (data.stc_subsystem_profile) setProfileType(data.stc_subsystem_profile);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { saveCalculatorStateToFirestore('stc_subsystem_area', facadeAreaM2); }, [facadeAreaM2]);
  useEffect(() => { saveCalculatorStateToFirestore('stc_subsystem_enclosure', enclosureType); }, [enclosureType]);
  useEffect(() => { saveCalculatorStateToFirestore('stc_subsystem_fastener', fastenerType); }, [fastenerType]);
  useEffect(() => { saveCalculatorStateToFirestore('stc_subsystem_profile', profileType); }, [profileType]);

  const activeCurrencyRate = useMemo(() => {
    return currencies.find(c => c.code === selectedCurrency)?.rateToRub || 1;
  }, [currencies, selectedCurrency]);

  // Material consumption rates per 1 m2 of facade
  const materialsList = useMemo(() => {
    return [
      { name: 'Омега-профиль вертикальный (алюминий)', unit: 'м.п.', ratePerM2: 2.5, pricePerUnitRub: 420 },
      { name: 'Кронштейн несущий (вылет 150 мм)', unit: 'шт.', ratePerM2: 3.2, pricePerUnitRub: 180 },
      { name: 'Анкер фасадный 10х100', unit: 'шт.', ratePerM2: 3.2, pricePerUnitRub: 65 },
      { name: 'Клеевая двухсторонняя лента 3M VHB', unit: 'м.п.', ratePerM2: 2.8, pricePerUnitRub: 140 },
      { name: 'Обезжириватель поверхностей HPL', unit: 'мл', ratePerM2: 25, pricePerUnitRub: 2.5 },
      { name: 'Праймер адгезионный Sika / Bostik', unit: 'мл', ratePerM2: 20, pricePerUnitRub: 4.2 },
      { name: 'Однокомпонентный клей-герметик', unit: 'мл', ratePerM2: 120, pricePerUnitRub: 1.8 },
      { name: 'Заклепка вытяжная нерж. 4.0х12', unit: 'шт.', ratePerM2: 12, pricePerUnitRub: 12 },
    ];
  }, []);

  const itemsCalculated = useMemo(() => {
    return materialsList.map(mat => {
      const totalQty = mat.ratePerM2 * facadeAreaM2;
      const totalCostRub = totalQty * mat.pricePerUnitRub;
      return {
        ...mat,
        totalQty,
        totalCostRub,
      };
    });
  }, [materialsList, facadeAreaM2]);

  const grandTotalRub = useMemo(() => itemsCalculated.reduce((acc, i) => acc + i.totalCostRub, 0), [itemsCalculated]);
  const costPerM2Rub = facadeAreaM2 > 0 ? grandTotalRub / facadeAreaM2 : 0;

  const formatCurrency = (amountRub: number) => {
    const val = selectedCurrency === 'RUB' ? amountRub : amountRub / activeCurrencyRate;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: selectedCurrency,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                Фасадная система
              </span>
              <span className="text-xs text-slate-400">Вентилируемый фасад HPL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Калькулятор навесной подсистемы и клеевой системы
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Спецификация профилей, кронштейнов, фасадных анкеров, клеевых лент и адгезионных праймеров для облицовки зданий HPL панелями.
            </p>
          </div>
        </div>
      </div>

      {/* Input Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <span>Параметры фасада</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Площадь фасада (м²)</label>
              <input
                type="number"
                min="10"
                max="50000"
                value={facadeAreaM2}
                onChange={(e) => setFacadeAreaM2(Number(e.target.value))}
                className="w-full text-base font-extrabold text-blue-600 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Тип основания стены</label>
              <select
                value={enclosureType}
                onChange={(e) => setEnclosureType(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="brick">Полнотелый кирпич</option>
                <option value="concrete">Monolithic Бетон</option>
                <option value="hollow_brick">Пустотелый пеноблок</option>
                <option value="sandwich">Сэндвич-панель</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Тип профиля</label>
              <select
                value={profileType}
                onChange={(e) => setProfileType(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="omega_aluminum">Омега профиль (Алюминий)</option>
                <option value="omega_steel">Омега профиль (Оцинковка)</option>
                <option value="t_profile">Т-образный профиль</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cost summary card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-emerald-400 uppercase font-bold tracking-wider mb-1">Итого подсистема</div>
            <div className="text-3xl font-black text-white">{formatCurrency(grandTotalRub)}</div>
          </div>

          <div className="space-y-1 text-xs text-slate-300 border-t border-slate-800 pt-3">
            <div className="flex justify-between">
              <span>Средняя стоимость подсистемы на м²:</span>
              <strong className="text-emerald-400 font-bold">{formatCurrency(costPerM2Rub)} / м²</strong>
            </div>
            <div className="flex justify-between">
              <span>Площадь фасада:</span>
              <strong className="text-white">{facadeAreaM2} м²</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Detailed Material Specification */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Сводная ведомость материалов подсистемы
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">№</th>
                <th className="py-3 px-3">Материал / Комплектующее</th>
                <th className="py-3 px-3 text-center">Расход на 1 м²</th>
                <th className="py-3 px-3 text-center">Итого объем</th>
                <th className="py-3 px-3 text-right">Цена за ед.</th>
                <th className="py-3 px-3 text-right">Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsCalculated.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="py-3 px-3 text-center font-medium">{item.ratePerM2} {item.unit}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900">{item.totalQty.toFixed(1)} {item.unit}</td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700">{formatCurrency(item.pricePerUnitRub)}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{formatCurrency(item.totalCostRub)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
