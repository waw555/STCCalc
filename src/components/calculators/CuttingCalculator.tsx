import React, { useState, useMemo } from 'react';
import { Currency } from '../../types';
import { Scissors, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';

interface CuttingCalculatorProps {
  currencies: Currency[];
  selectedCurrency: string;
}

interface Piece {
  id: string;
  widthMm: number;
  heightMm: number;
  qty: number;
  note: string;
}

export const CuttingCalculator: React.FC<CuttingCalculatorProps> = ({ currencies, selectedCurrency }) => {
  const [sheetWidth, setSheetWidth] = useState<number>(3050);
  const [sheetHeight, setSheetHeight] = useState<number>(1300);
  const [kerfMm, setKerfMm] = useState<number>(4.0);
  const [cuttingPricePerMeterRub, setCuttingPricePerMeterRub] = useState<number>(250);

  const [pieces, setPieces] = useState<Piece[]>([
    { id: 'p1', widthMm: 600, heightMm: 1200, qty: 4, note: 'Фасадные панели' },
    { id: 'p2', widthMm: 450, heightMm: 800, qty: 6, note: 'Боковины' },
  ]);

  const activeCurrencyRate = useMemo(() => {
    return currencies.find(c => c.code === selectedCurrency)?.rateToRub || 1;
  }, [currencies, selectedCurrency]);

  const sheetAreaM2 = (sheetWidth * sheetHeight) / 1000000;

  // Calculate cut length & total piece area
  const pieceSummary = useMemo(() => {
    let totalPieceAreaM2 = 0;
    let totalLinearMetersCut = 0;

    pieces.forEach(p => {
      const area = (p.widthMm * p.heightMm / 1000000) * p.qty;
      const perimeterM = ((p.widthMm + p.heightMm) * 2 / 1000) * p.qty;
      totalPieceAreaM2 += area;
      totalLinearMetersCut += perimeterM / 2; // linear cut meters estimate
    });

    const sheetsNeeded = Math.max(1, Math.ceil((totalPieceAreaM2 * 1.12) / sheetAreaM2));
    const totalCutCostRub = totalLinearMetersCut * cuttingPricePerMeterRub;

    return {
      totalPieceAreaM2,
      totalLinearMetersCut,
      sheetsNeeded,
      totalCutCostRub,
    };
  }, [pieces, sheetAreaM2, cuttingPricePerMeterRub]);

  const formatCurrency = (amountRub: number) => {
    const val = selectedCurrency === 'RUB' ? amountRub : amountRub / activeCurrencyRate;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: selectedCurrency,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleAddPiece = () => {
    setPieces(prev => [...prev, {
      id: `p-${Date.now()}`,
      widthMm: 500,
      heightMm: 1000,
      qty: 1,
      note: 'Новая деталь'
    }]);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2.5 py-0.5 rounded-full">
                Оптимизация раскроя
              </span>
              <span className="text-xs text-slate-400">Прямой и фигурный распил HPL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Калькулятор линейного раскроя и отходов
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Оценка метража пропила, расчёт требуемого количества плит и стоимость услуг по распилу компакт-пластика.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-rose-600" />
            <span>Параметры исходного листа</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Длина листа (мм)</label>
              <input
                type="number"
                value={sheetWidth}
                onChange={(e) => setSheetWidth(Number(e.target.value))}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ширина листа (мм)</label>
              <input
                type="number"
                value={sheetHeight}
                onChange={(e) => setSheetHeight(Number(e.target.value))}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Пропил пилы (мм)</label>
              <input
                type="number"
                step="0.5"
                value={kerfMm}
                onChange={(e) => setKerfMm(Number(e.target.value))}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Тариф распила (₽/м.п.)</label>
              <input
                type="number"
                value={cuttingPricePerMeterRub}
                onChange={(e) => setCuttingPricePerMeterRub(Number(e.target.value))}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Summary box */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-rose-400 uppercase font-bold tracking-wider mb-1">Стоимость распила</div>
            <div className="text-3xl font-black text-white">{formatCurrency(pieceSummary.totalCutCostRub)}</div>
          </div>

          <div className="space-y-1 text-xs text-slate-300 border-t border-slate-800 pt-3">
            <div className="flex justify-between">
              <span>Всего листов необходимо:</span>
              <strong className="text-rose-400 font-bold">{pieceSummary.sheetsNeeded} шт.</strong>
            </div>
            <div className="flex justify-between">
              <span>Линейный метраж реза:</span>
              <strong className="text-white">{pieceSummary.totalLinearMetersCut.toFixed(1)} м.п.</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Pieces List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Детали для раскроя</h2>
          <button
            onClick={handleAddPiece}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить деталь</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">№</th>
                <th className="py-3 px-3">Примечание</th>
                <th className="py-3 px-3 text-center">Ширина (мм)</th>
                <th className="py-3 px-3 text-center">Длина (мм)</th>
                <th className="py-3 px-3 text-center">Кол-во (шт)</th>
                <th className="py-3 px-3 text-center">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pieces.map((p, idx) => (
                <tr key={p.id}>
                  <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={p.note}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPieces(prev => prev.map(x => x.id === p.id ? { ...x, note: val } : x));
                      }}
                      className="w-full border border-slate-300 rounded px-2 py-1 font-semibold"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      value={p.widthMm}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPieces(prev => prev.map(x => x.id === p.id ? { ...x, widthMm: val } : x));
                      }}
                      className="w-24 text-center border border-slate-300 rounded px-2 py-1 font-semibold"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      value={p.heightMm}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPieces(prev => prev.map(x => x.id === p.id ? { ...x, heightMm: val } : x));
                      }}
                      className="w-24 text-center border border-slate-300 rounded px-2 py-1 font-semibold"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      value={p.qty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPieces(prev => prev.map(x => x.id === p.id ? { ...x, qty: val } : x));
                      }}
                      className="w-20 text-center border border-slate-300 rounded px-2 py-1 font-semibold"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setPieces(prev => prev.filter(x => x.id !== p.id))}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
