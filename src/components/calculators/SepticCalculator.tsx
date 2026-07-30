import React, { useState, useMemo } from 'react';
import { Currency } from '../../types';
import { Droplets, ShieldCheck, Check } from 'lucide-react';

interface SepticCalculatorProps {
  currencies: Currency[];
  selectedCurrency: string;
}

export const SepticCalculator: React.FC<SepticCalculatorProps> = ({ currencies, selectedCurrency }) => {
  const [peopleCount, setPeopleCount] = useState<number>(4);
  const [soilType, setSoilType] = useState<string>('sand'); // sand, clay, loam
  const [hasWashingMachine, setHasWashingMachine] = useState<boolean>(true);
  const [hasBath, setHasBath] = useState<boolean>(true);

  const activeCurrencyRate = useMemo(() => {
    return currencies.find(c => c.code === selectedCurrency)?.rateToRub || 1;
  }, [currencies, selectedCurrency]);

  // Water consumption estimation: 200 Liters / person / day
  const dailyVolumeLiters = useMemo(() => {
    let base = peopleCount * 200;
    if (hasWashingMachine) base += 100;
    if (hasBath) base += 150;
    return base;
  }, [peopleCount, hasWashingMachine, hasBath]);

  // Recommended Septic Tank Model
  const recommendedSeptic = useMemo(() => {
    if (dailyVolumeLiters <= 800) {
      return { model: 'STC-Bio 4', volumeM3: 1.5, priceRub: 78000, installationRub: 25000 };
    } else if (dailyVolumeLiters <= 1200) {
      return { model: 'STC-Bio 6', volumeM3: 2.2, priceRub: 95000, installationRub: 28000 };
    } else if (dailyVolumeLiters <= 1800) {
      return { model: 'STC-Bio 8 Pro', volumeM3: 3.0, priceRub: 125000, installationRub: 34000 };
    } else {
      return { model: 'STC-Bio 12 Max', volumeM3: 4.5, priceRub: 168000, installationRub: 42000 };
    }
  }, [dailyVolumeLiters]);

  const grandTotalRub = recommendedSeptic.priceRub + recommendedSeptic.installationRub;

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
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2.5 py-0.5 rounded-full">
                Локальные очистные сооружения
              </span>
              <span className="text-xs text-slate-400">Автономная канализация</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Калькулятор подбора септика и монтажа
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Расчёт объема суточного водопотребления, подбор биостанций глубокой очистки и стоимость земляных работ.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-600" />
            <span>Параметры проживания и оборудования</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Количество постоянно проживающих (чел)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={peopleCount}
                onChange={(e) => setPeopleCount(Number(e.target.value))}
                className="w-full text-base font-extrabold text-sky-600 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Тип грунта на участке</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="sand">Песок / Супесь (Хорошее впитывание)</option>
                <option value="clay">Суглинок / Глина (Высокий УГВ)</option>
                <option value="heavy_clay">Тяжелая глина / Плывун</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasWashingMachine}
                onChange={(e) => setHasWashingMachine(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Стиральная / Посудомоечная машина</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBath}
                onChange={(e) => setHasBath(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Ванна / Джакузи (Залповый сброс)</span>
            </label>
          </div>
        </div>

        {/* Output card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-sky-400 uppercase font-bold tracking-wider mb-1">Рекомендуемый комплект</div>
            <div className="text-2xl font-black text-white">{recommendedSeptic.model}</div>
            <div className="text-xs text-slate-400 mt-1">
              Суточный сброс: <strong className="text-sky-300">{dailyVolumeLiters} л/сутки</strong> ({recommendedSeptic.volumeM3} м³)
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
            <div className="flex justify-between">
              <span>Стоимость биостанции:</span>
              <strong className="text-white">{formatCurrency(recommendedSeptic.priceRub)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Монтаж под ключ:</span>
              <strong className="text-sky-300">{formatCurrency(recommendedSeptic.installationRub)}</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
              <span className="font-bold text-white">ИТОГО:</span>
              <strong className="text-emerald-400 font-black">{formatCurrency(grandTotalRub)}</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
