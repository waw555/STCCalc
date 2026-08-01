import React, { useState, useMemo } from 'react';
import { PanelFormat, Manufacturer, Embossing, PanelSize, PanelThickness, Currency } from '../../types';
import { Search, Filter, BookOpen, Layers, CheckCircle2, Eye, Grid, List } from 'lucide-react';

interface PriceListProps {
  decors: PanelFormat[];
  manufacturers: Manufacturer[];
  embossings: Embossing[];
  panelSizes: PanelSize[];
  thicknesses: PanelThickness[];
  currencies: Currency[];
  selectedCurrency: string;
}

export const PriceListCountertops: React.FC<PriceListProps> = ({
  decors,
  manufacturers,
  embossings,
  panelSizes,
  thicknesses,
  currencies,
  selectedCurrency,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<number | 'all'>('all');
  const [selectedEmbossing, setSelectedEmbossing] = useState<number | 'all'>('all');
  const [selectedThickness, setSelectedThickness] = useState<number | 'all'>('all');
  const [onlyStock, setOnlyStock] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  const activeCurrencyRate = useMemo(() => {
    return currencies.find(c => c.code === selectedCurrency)?.rateToRub || 1;
  }, [currencies, selectedCurrency]);

  const eurRate = useMemo(() => {
    return currencies.find(c => c.code === 'EUR')?.rateToRub || 98.45;
  }, [currencies]);

  const filteredDecors = useMemo(() => {
    return decors.filter(d => {
      if (selectedManufacturer !== 'all' && d.manufacturerId !== selectedManufacturer) return false;
      if (selectedEmbossing !== 'all' && d.embossingId !== selectedEmbossing) return false;
      if (selectedThickness !== 'all' && d.thicknessId !== selectedThickness) return false;
      if (onlyStock && !d.isStockDecor) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = d.name.toLowerCase().includes(term);
        const matchNum = d.decorNumber?.toLowerCase().includes(term);
        const matchDecName = d.decorName?.toLowerCase().includes(term);
        if (!matchName && !matchNum && !matchDecName) return false;
      }
      return true;
    });
  }, [decors, selectedManufacturer, selectedEmbossing, selectedThickness, onlyStock, searchTerm]);

  const formatPrice = (amountRub: number) => {
    const val = selectedCurrency === 'RUB' ? amountRub : amountRub / activeCurrencyRate;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: selectedCurrency,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/80 px-2.5 py-0.5 rounded-full">
                Каталог HPL
              </span>
              <span className="text-xs text-slate-400">Компакт-плиты для кухонь, мебели и фасадов</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Официальный прайс-лист декоров и текстур
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Актуальные складские остатки, форматы листов, тиснения поверхности и коммерческие цены в {selectedCurrency}.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Плитка</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Таблица</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search bar */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по артикулу или названию декора..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            />
          </div>

          {/* Manufacturer filter */}
          <div>
            <select
              value={selectedManufacturer}
              onChange={(e) => setSelectedManufacturer(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full text-xs font-medium py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            >
              <option value="all">Все производители</option>
              {manufacturers.map(m => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
          </div>

          {/* Embossing filter */}
          <div>
            <select
              value={selectedEmbossing}
              onChange={(e) => setSelectedEmbossing(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full text-xs font-medium py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            >
              <option value="all">Все тиснения</option>
              {embossings.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {/* Thickness filter */}
          <div>
            <select
              value={selectedThickness}
              onChange={(e) => setSelectedThickness(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full text-xs font-medium py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            >
              <option value="all">Все толщины</option>
              {thicknesses.map(t => (
                <option key={t.id} value={t.id}>{t.thickness} мм</option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={onlyStock}
              onChange={(e) => setOnlyStock(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Только складская программа (в наличии)</span>
          </label>

          <span className="text-slate-500 font-medium">
            Найдено декоров: <strong className="text-slate-900">{filteredDecors.length}</strong>
          </span>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDecors.map((decor) => {
            const mfg = manufacturers.find(m => m.id === decor.manufacturerId);
            const emb = embossings.find(e => e.id === decor.embossingId);
            const decorCurrCode = decor.currency || 'EUR';
            const decorRate = currencies.find(c => c.code === decorCurrCode)?.rateToRub || eurRate;

            let priceRubPerM2 = 0;
            if (decor.pricePerM2 && decor.pricePerM2 > 0) {
              priceRubPerM2 = decor.pricePerM2 * decorRate;
            } else {
              const cost = decor.cost || 58;
              const markup = decor.markup || 46.5;
              priceRubPerM2 = cost * decorRate * (1 + markup / 100);
            }

            const sheetAreaM2 = (decor.widthMm * decor.heightMm) / 1000000;
            const sheetPriceRub = (decor.pricePerSheet && decor.pricePerSheet > 0)
              ? decor.pricePerSheet * decorRate
              : priceRubPerM2 * sheetAreaM2;

            return (
              <div
                key={decor.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image Header */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {decor.decorPhotoPath ? (
                      <img
                        src={decor.decorPhotoPath}
                        alt={decor.decorName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                        Нет изображения
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-slate-900/90 text-white backdrop-blur shadow">
                        № {decor.decorNumber}
                      </span>
                      {decor.isStockDecor && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white shadow flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> В наличии
                        </span>
                      )}
                    </div>

                    {decor.decorPhotoPath && (
                      <button
                        onClick={() => setPreviewImage({ src: decor.decorPhotoPath!, title: decor.decorName || decor.name })}
                        className="absolute bottom-3 right-3 p-2 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur opacity-0 group-hover:opacity-100 transition"
                        title="Увеличить фото"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                      {mfg?.fullName || 'HPL Производитель'}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {decor.decorName || decor.name}
                    </h3>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-600 pt-1">
                      <div>Формат: <strong className="text-slate-800">{decor.heightMm}×{decor.widthMm}</strong></div>
                      <div>Толщина: <strong className="text-slate-800">{decor.thicknessMm || 12} мм</strong></div>
                      <div>Тиснение: <strong className="text-slate-800">{emb?.name || 'Стандарт'}</strong></div>
                      <div>Площадь: <strong className="text-slate-800">{sheetAreaM2.toFixed(2)} м²</strong></div>
                    </div>
                  </div>
                </div>

                {/* Footer Price */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Цена за м²</div>
                    <div className="text-lg font-black text-blue-600">{formatPrice(priceRubPerM2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Цена за лист</div>
                    <div className="text-xs font-bold text-slate-800">{formatPrice(sheetPriceRub)}</div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Артикул</th>
                  <th className="py-3.5 px-4">Наименование декора</th>
                  <th className="py-3.5 px-4">Производитель</th>
                  <th className="py-3.5 px-4">Тиснение</th>
                  <th className="py-3.5 px-4 text-center">Формат (мм)</th>
                  <th className="py-3.5 px-4 text-center">Толщина</th>
                  <th className="py-3.5 px-4 text-center">Склад</th>
                  <th className="py-3.5 px-4 text-right">Цена м²</th>
                  <th className="py-3.5 px-4 text-right">Цена лист</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDecors.map((decor) => {
                  const mfg = manufacturers.find(m => m.id === decor.manufacturerId);
                  const emb = embossings.find(e => e.id === decor.embossingId);
                  const decorCurrCode = decor.currency || 'EUR';
                  const decorRate = currencies.find(c => c.code === decorCurrCode)?.rateToRub || eurRate;

                  let priceRubPerM2 = 0;
                  if (decor.pricePerM2 && decor.pricePerM2 > 0) {
                    priceRubPerM2 = decor.pricePerM2 * decorRate;
                  } else {
                    const cost = decor.cost || 58;
                    const markup = decor.markup || 46.5;
                    priceRubPerM2 = cost * decorRate * (1 + markup / 100);
                  }

                  const sheetAreaM2 = (decor.widthMm * decor.heightMm) / 1000000;
                  const sheetPriceRub = (decor.pricePerSheet && decor.pricePerSheet > 0)
                    ? decor.pricePerSheet * decorRate
                    : priceRubPerM2 * sheetAreaM2;

                  return (
                    <tr key={decor.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">№ {decor.decorNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{decor.decorName || decor.name}</td>
                      <td className="py-3 px-4 font-semibold text-blue-600">{mfg?.fullName}</td>
                      <td className="py-3 px-4 text-slate-600">{emb?.name || 'Canyon'}</td>
                      <td className="py-3 px-4 text-center font-medium">{decor.heightMm}×{decor.widthMm}</td>
                      <td className="py-3 px-4 text-center font-semibold">{decor.thicknessMm || 12} мм</td>
                      <td className="py-3 px-4 text-center">
                        {decor.isStockDecor ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">В наличии</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">Под заказ</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-blue-600">{formatPrice(priceRubPerM2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatPrice(sheetPriceRub)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900">{previewImage.title}</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-slate-900 font-bold px-2"
              >
                ✕
              </button>
            </div>
            <img src={previewImage.src} alt={previewImage.title} className="w-full max-h-[70vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

    </div>
  );
};
