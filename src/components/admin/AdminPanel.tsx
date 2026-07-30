import React, { useState } from 'react';
import { 
  Currency, 
  Manufacturer, 
  PanelFormat, 
  Embossing, 
  PanelSize, 
  PanelThickness, 
  Service, 
  Supplier, 
  OrganizationSettings, 
  UserSession 
} from '../../types';
import { Settings, DollarSign, Building2, Layers, Grid, Sliders, Truck, ShieldAlert, Plus, Trash2, Check, Save } from 'lucide-react';

interface AdminPanelProps {
  userSession: UserSession;
  currencies: Currency[];
  onUpdateCurrencyRate: (code: string, newRate: number) => void;
  manufacturers: Manufacturer[];
  onAddManufacturer: (mfg: Omit<Manufacturer, 'id'>) => void;
  onDeleteManufacturer: (id: number) => void;
  decors: PanelFormat[];
  onAddDecor: (decor: Omit<PanelFormat, 'id'>) => void;
  onDeleteDecor: (id: number) => void;
  embossings: Embossing[];
  onAddEmbossing: (emb: Omit<Embossing, 'id'>) => void;
  services: Service[];
  onAddService: (srv: Omit<Service, 'id'>) => void;
  suppliers: Supplier[];
  organization: OrganizationSettings;
  onUpdateOrganization: (org: OrganizationSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  userSession,
  currencies,
  onUpdateCurrencyRate,
  manufacturers,
  onAddManufacturer,
  onDeleteManufacturer,
  decors,
  onAddDecor,
  onDeleteDecor,
  embossings,
  onAddEmbossing,
  services,
  onAddService,
  suppliers,
  organization,
  onUpdateOrganization,
}) => {
  const [adminTab, setAdminTab] = useState<'currencies' | 'mfg' | 'decors' | 'embossings' | 'services' | 'org'>('currencies');

  // Form states
  const [newMfgName, setNewMfgName] = useState('');
  const [newMfgCountry, setNewMfgCountry] = useState('');

  const [newDecorName, setNewDecorName] = useState('');
  const [newDecorNumber, setNewDecorNumber] = useState('');
  const [newDecorCost, setNewDecorCost] = useState<number>(60);
  const [newDecorMarkup, setNewDecorMarkup] = useState<number>(46.5);

  const [orgState, setOrgState] = useState<OrganizationSettings>(organization);
  const [orgSaveMessage, setOrgSaveMessage] = useState<string | null>(null);

  if (userSession.role !== 'admin') {
    return (
      <div className="bg-white rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-sm border border-slate-200 space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Доступ ограничен</h2>
        <p className="text-sm text-slate-600">
          Раздел администрирования доступен только авторизованным пользователям с ролью <strong>Администратор</strong>.
        </p>
      </div>
    );
  }

  const handleAddMfgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMfgName.trim()) return;
    onAddManufacturer({
      fullName: newMfgName,
      countryOrigin: newMfgCountry || 'Не указана',
    });
    setNewMfgName('');
    setNewMfgCountry('');
  };

  const handleAddDecorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecorName.trim()) return;
    onAddDecor({
      name: newDecorName,
      decorName: newDecorName,
      decorNumber: newDecorNumber || '100',
      widthMm: 1300,
      heightMm: 3050,
      thicknessMm: 12,
      cost: newDecorCost,
      markup: newDecorMarkup,
      currency: 'EUR',
      isStockDecor: true,
      isStockProgram: true,
      isActive: true,
    });
    setNewDecorName('');
    setNewDecorNumber('');
  };

  const handleOrgSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOrganization(orgState);
    setOrgSaveMessage('Реквизиты организации успешно сохранены!');
    setTimeout(() => setOrgSaveMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                Администрирование
              </span>
              <span className="text-xs text-slate-400">Управление справочниками и тарифами</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Панель администратора
            </h1>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setAdminTab('currencies')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            adminTab === 'currencies' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Валюты и курсы
        </button>
        <button
          onClick={() => setAdminTab('mfg')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            adminTab === 'mfg' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" /> Производители
        </button>
        <button
          onClick={() => setAdminTab('decors')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            adminTab === 'decors' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Grid className="w-4 h-4" /> Декоры и форматы
        </button>
        <button
          onClick={() => setAdminTab('services')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            adminTab === 'services' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" /> Тарифы услуг
        </button>
        <button
          onClick={() => setAdminTab('org')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            adminTab === 'org' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" /> Реквизиты компании
        </button>
      </div>

      {/* Currencies Tab */}
      {adminTab === 'currencies' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Управление курсами валют</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {currencies.map(c => (
              <div key={c.code} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{c.code} — {c.name}</span>
                  <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-700">Активна</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Курс к рублю (₽)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={c.rateToRub}
                    disabled={c.code === 'RUB'}
                    onChange={(e) => onUpdateCurrencyRate(c.code, Number(e.target.value))}
                    className="w-full text-sm font-bold border border-slate-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manufacturers Tab */}
      {adminTab === 'mfg' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Справочник производителей HPL</h2>
          
          {/* Form */}
          <form onSubmit={handleAddMfgSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Название бренда (например, Arpa)"
              value={newMfgName}
              onChange={(e) => setNewMfgName(e.target.value)}
              className="flex-1 text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 outline-none"
            />
            <input
              type="text"
              placeholder="Страна происхождения (например, Италия)"
              value={newMfgCountry}
              onChange={(e) => setNewMfgCountry(e.target.value)}
              className="flex-1 text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 outline-none"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow">
              Добавить
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {manufacturers.map(m => (
              <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">{m.fullName}</div>
                  <div className="text-xs text-slate-500">{m.countryOrigin}</div>
                </div>
                <button
                  onClick={() => onDeleteManufacturer(m.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decors Tab */}
      {adminTab === 'decors' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Добавить новый декор HPL</h2>
          
          <form onSubmit={handleAddDecorSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Артикул декора</label>
              <input
                type="text"
                value={newDecorNumber}
                onChange={(e) => setNewDecorNumber(e.target.value)}
                placeholder="Например, 4012"
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Наименование</label>
              <input
                type="text"
                value={newDecorName}
                onChange={(e) => setNewDecorName(e.target.value)}
                placeholder="Marble Carrara"
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Базовая цена (€/м²)</label>
              <input
                type="number"
                value={newDecorCost}
                onChange={(e) => setNewDecorCost(Number(e.target.value))}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow">
                Сохранить декор
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Org Tab */}
      {adminTab === 'org' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Реквизиты организации</h2>
          
          {orgSaveMessage && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs p-3 rounded-lg font-bold flex items-center gap-2">
              <Check className="w-4 h-4" /> {orgSaveMessage}
            </div>
          )}

          <form onSubmit={handleOrgSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Полное наименование</label>
              <input
                type="text"
                value={orgState.fullName}
                onChange={(e) => setOrgState({ ...orgState, fullName: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ИНН</label>
              <input
                type="text"
                value={orgState.inn}
                onChange={(e) => setOrgState({ ...orgState, inn: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Телефон</label>
              <input
                type="text"
                value={orgState.phone}
                onChange={(e) => setOrgState({ ...orgState, phone: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <input
                type="text"
                value={orgState.email}
                onChange={(e) => setOrgState({ ...orgState, email: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-2">
                <Save className="w-4 h-4" /> Сохранить изменения
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
