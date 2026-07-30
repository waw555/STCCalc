import React, { useState, useEffect } from 'react';
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
import { Settings, DollarSign, Building2, Layers, Grid, Sliders, ShieldAlert, Plus, Trash2, Check, Save, Globe, Upload, Image as ImageIcon, FileText, X, Pencil } from 'lucide-react';
import { fetchCbrRates, CbrValute, POPULAR_CBR_CURRENCIES } from '../../services/cbrRates';
import { 
  generateDecorFilePath, 
  generateEmbossingFilePath, 
  generateManufacturerFilePath, 
  generateOrganizationFilePath, 
  generateServiceFilePath,
  transliterateToEnglish
} from '../../utils/fileNaming';

interface AdminPanelProps {
  userSession: UserSession;
  currencies: Currency[];
  onUpdateCurrencyRate: (code: string, newRate: number) => void;
  onAddCurrency: (currency: Currency) => void;
  onDeleteCurrency: (code: string) => void;
  onRefreshRates?: () => void;
  isRefreshingRates?: boolean;
  manufacturers: Manufacturer[];
  onAddManufacturer: (mfg: Omit<Manufacturer, 'id'>) => void;
  onUpdateManufacturer?: (mfg: Manufacturer) => void;
  onDeleteManufacturer: (id: number) => void;
  decors: PanelFormat[];
  onAddDecor: (decor: Omit<PanelFormat, 'id'>) => void;
  onDeleteDecor: (id: number) => void;
  embossings: Embossing[];
  onAddEmbossing: (emb: Omit<Embossing, 'id'>) => void;
  onDeleteEmbossing?: (id: number) => void;
  services: Service[];
  onAddService: (srv: Omit<Service, 'id'>) => void;
  onDeleteService?: (id: number) => void;
  suppliers: Supplier[];
  organization: OrganizationSettings;
  onUpdateOrganization: (org: OrganizationSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  userSession,
  currencies,
  onUpdateCurrencyRate,
  onAddCurrency,
  onDeleteCurrency,
  onRefreshRates,
  isRefreshingRates,
  manufacturers,
  onAddManufacturer,
  onUpdateManufacturer,
  onDeleteManufacturer,
  decors,
  onAddDecor,
  onDeleteDecor,
  embossings,
  onAddEmbossing,
  onDeleteEmbossing,
  services,
  onAddService,
  onDeleteService,
  suppliers,
  organization,
  onUpdateOrganization,
}) => {
  const [adminTab, setAdminTab] = useState<'currencies' | 'mfg' | 'decors' | 'embossings' | 'services' | 'org'>('currencies');

  // CBR currencies state for adding
  const [cbrValutes, setCbrValutes] = useState<CbrValute[]>(POPULAR_CBR_CURRENCIES);
  const [selectedCbrCode, setSelectedCbrCode] = useState<string>('CNY');
  const [lastCbrDate, setLastCbrDate] = useState<string>('');

  useEffect(() => {
    fetchCbrRates().then(data => {
      if (data.valutes && data.valutes.length > 0) {
        setCbrValutes(data.valutes);
      }
      if (data.date) {
        setLastCbrDate(data.date);
      }
    }).catch(err => console.warn('Admin CBR fetch error:', err));
  }, []);

  // Manufacturer form state
  const [newMfgName, setNewMfgName] = useState('');
  const [newMfgCountry, setNewMfgCountry] = useState('');
  const [newMfgNote, setNewMfgNote] = useState('');
  const [newMfgExt, setNewMfgExt] = useState('png');
  const [newMfgLogoPreview, setNewMfgLogoPreview] = useState<string>('');
  const [newMfgLogoFileName, setNewMfgLogoFileName] = useState<string>('');

  const handleMfgLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      setNewMfgExt(ext);
      setNewMfgLogoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMfgLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearMfgLogo = () => {
    setNewMfgLogoPreview('');
    setNewMfgLogoFileName('');
    setNewMfgExt('png');
  };

  // Manufacturer edit state
  const [editingMfgId, setEditingMfgId] = useState<number | null>(null);
  const [editMfgName, setEditMfgName] = useState('');
  const [editMfgCountry, setEditMfgCountry] = useState('');
  const [editMfgNote, setEditMfgNote] = useState('');
  const [editMfgLogoPreview, setEditMfgLogoPreview] = useState('');
  const [editMfgLogoFileName, setEditMfgLogoFileName] = useState('');

  const handleStartEditMfg = (m: Manufacturer) => {
    setEditingMfgId(m.id);
    setEditMfgName(m.fullName);
    setEditMfgCountry(m.countryOrigin);
    setEditMfgNote(m.note || '');
    setEditMfgLogoPreview(m.logoPath || '');
    setEditMfgLogoFileName('');
  };

  const handleCancelEditMfg = () => {
    setEditingMfgId(null);
    setEditMfgName('');
    setEditMfgCountry('');
    setEditMfgNote('');
    setEditMfgLogoPreview('');
    setEditMfgLogoFileName('');
  };

  const handleEditMfgLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditMfgLogoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditMfgLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEditMfg = (m: Manufacturer) => {
    if (!editMfgName.trim()) return;
    if (onUpdateManufacturer) {
      onUpdateManufacturer({
        ...m,
        fullName: editMfgName,
        countryOrigin: editMfgCountry,
        note: editMfgNote,
        logoPath: editMfgLogoPreview || m.logoPath,
      });
    }
    handleCancelEditMfg();
  };

  // Decor form state
  const [newDecorMfgId, setNewDecorMfgId] = useState<number>(manufacturers[0]?.id || 1);
  const [newDecorName, setNewDecorName] = useState('');
  const [newDecorNumber, setNewDecorNumber] = useState('');
  const [newDecorCost, setNewDecorCost] = useState<number>(60);
  const [newDecorMarkup, setNewDecorMarkup] = useState<number>(46.5);
  const [newDecorExt, setNewDecorExt] = useState('jpg');

  // Embossing form state
  const [newEmbossingMfgId, setNewEmbossingMfgId] = useState<number>(manufacturers[0]?.id || 1);
  const [newEmbossingName, setNewEmbossingName] = useState('');
  const [newEmbossingShortName, setNewEmbossingShortName] = useState('');
  const [newEmbossingExt, setNewEmbossingExt] = useState('jpg');

  // Service form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceUnit, setNewServiceUnit] = useState('м.п.');
  const [newServicePrice, setNewServicePrice] = useState<number>(300);
  const [newServiceExt, setNewServiceExt] = useState('jpg');

  // Org form state
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

  // Manufacturers Submit
  const handleAddMfgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMfgName.trim()) return;
    const logoPath = newMfgLogoPreview || generateManufacturerFilePath(newMfgName, newMfgExt);
    onAddManufacturer({
      fullName: newMfgName,
      countryOrigin: newMfgCountry || 'Не указана',
      logoPath: logoPath,
      note: newMfgNote || 'Производитель HPL/компакт-плит',
    });
    setNewMfgName('');
    setNewMfgCountry('');
    setNewMfgNote('');
    setNewMfgLogoPreview('');
    setNewMfgLogoFileName('');
    setNewMfgExt('png');
  };

  // Decors Submit
  const handleAddDecorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecorName.trim()) return;
    const mfgObj = manufacturers.find(m => m.id === newDecorMfgId) || manufacturers[0];
    const mfgName = mfgObj?.fullName || 'Manufacturer';
    const decorPath = generateDecorFilePath(mfgName, newDecorNumber || '000', newDecorName, newDecorExt);

    onAddDecor({
      name: `${mfgName} ${newDecorNumber} ${newDecorName}`.trim(),
      decorName: newDecorName,
      decorNumber: newDecorNumber || '100',
      manufacturerId: newDecorMfgId,
      widthMm: 1300,
      heightMm: 3050,
      thicknessMm: 12,
      cost: newDecorCost,
      markup: newDecorMarkup,
      currency: 'EUR',
      decorPhotoPath: decorPath,
      isStockDecor: true,
      isStockProgram: true,
      isActive: true,
    });
    setNewDecorName('');
    setNewDecorNumber('');
  };

  // Embossings Submit
  const handleAddEmbossingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmbossingName.trim()) return;
    const mfgObj = manufacturers.find(m => m.id === newEmbossingMfgId) || manufacturers[0];
    const mfgName = mfgObj?.fullName || 'Manufacturer';
    const imagePath = generateEmbossingFilePath(mfgName, newEmbossingName, newEmbossingExt);

    onAddEmbossing({
      name: newEmbossingName,
      shortName: newEmbossingShortName || newEmbossingName.slice(0, 3).toUpperCase(),
      manufacturerId: newEmbossingMfgId,
      imagePath: imagePath,
      isActive: true,
      isStockProgram: true,
    });
    setNewEmbossingName('');
    setNewEmbossingShortName('');
  };

  // Services Submit
  const handleAddServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const photoPath = generateServiceFilePath(newServiceName, newServiceExt);
    onAddService({
      name: newServiceName,
      unit: newServiceUnit,
      price: newServicePrice,
      currency: 'RUB',
      photoPath: photoPath,
    });
    setNewServiceName('');
    setNewServicePrice(300);
  };

  // Org Submit
  const handleOrgSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedLogoPath = generateOrganizationFilePath(orgState.fullName, 'png');
    const updated = { ...orgState, logoPath: updatedLogoPath };
    onUpdateOrganization(updated);
    setOrgState(updated);
    setOrgSaveMessage('Реквизиты организации и путь к логотипу успешно сохранены!');
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
              <span className="text-xs text-slate-400">Управление справочниками, файлами и курсами</span>
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
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'currencies' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Валюты и курсы
        </button>
        <button
          onClick={() => setAdminTab('mfg')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'mfg' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" /> Производители
        </button>
        <button
          onClick={() => setAdminTab('decors')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'decors' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Grid className="w-4 h-4" /> Декоры и форматы
        </button>
        <button
          onClick={() => setAdminTab('embossings')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'embossings' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" /> Тиснения
        </button>
        <button
          onClick={() => setAdminTab('services')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'services' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" /> Тарифы услуг
        </button>
        <button
          onClick={() => setAdminTab('org')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'org' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" /> Реквизиты компании
        </button>
      </div>

      {/* Currencies Tab */}
      {adminTab === 'currencies' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Управление курсами валют</h2>
              <p className="text-xs text-slate-500">Автоматическая синхронизация и добавление валют с сайта Центрального Банка Российской Федерации (ЦБ РФ)</p>
            </div>
            {onRefreshRates && (
              <button
                onClick={onRefreshRates}
                disabled={isRefreshingRates}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow transition disabled:opacity-50"
              >
                <DollarSign className={`w-4 h-4 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                <span>Обновить курсы с ЦБ РФ</span>
              </button>
            )}
          </div>

          {/* Add Currency from CBR Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-blue-600" />
              Добавить валюту из реестра ЦБ РФ
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const targetValute = cbrValutes.find(v => v.code === selectedCbrCode);
                if (targetValute) {
                  onAddCurrency({
                    code: targetValute.code,
                    name: targetValute.name,
                    nominal: 1,
                    rateToRub: targetValute.rateToRub,
                    isActive: true,
                    updatedAt: lastCbrDate || new Date().toLocaleDateString('ru-RU'),
                  });
                }
              }}
              className="flex flex-col sm:flex-row gap-3 items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Выберите валюту ЦБ РФ
                </label>
                <select
                  value={selectedCbrCode}
                  onChange={(e) => setSelectedCbrCode(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {cbrValutes.map(v => {
                    const isAdded = currencies.some(c => c.code === v.code);
                    return (
                      <option key={v.code} value={v.code}>
                        {v.code} — {v.name} ({v.rateToRub.toFixed(2)} ₽) {isAdded ? '✓ Добавлена' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow transition min-w-[160px]"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить валюту</span>
              </button>
            </form>
          </div>

          {/* Active Currencies Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Активные валюты в системе ({currencies.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currencies.map(c => (
                <div key={c.code} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative group">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <div>
                      <span className="text-sm font-bold text-slate-900">{c.code}</span>
                      <span className="text-xs font-medium text-slate-500 ml-1.5">— {c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        c.code === 'RUB' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {c.code === 'RUB' ? 'Базовая' : 'ЦБ РФ'}
                      </span>
                      {c.code !== 'RUB' && (
                        <button
                          type="button"
                          onClick={() => onDeleteCurrency(c.code)}
                          title="Удалить валюту"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Курс к 1 {c.code} в рублях (₽)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={c.rateToRub}
                      disabled={c.code === 'RUB'}
                      onChange={(e) => onUpdateCurrencyRate(c.code, Number(e.target.value))}
                      className="w-full text-sm font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>

                  {c.updatedAt && (
                    <div className="text-[11px] text-slate-400 font-medium">
                      Обновлено ЦБ: {c.updatedAt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manufacturers Tab */}
      {adminTab === 'mfg' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Справочник производителей HPL</h2>
              <p className="text-xs text-slate-500">Загружаемые логотипы сохраняются в системе и ассоциируются с производителем</p>
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleAddMfgSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Название бренда</label>
                <input
                  type="text"
                  placeholder="Например, Arpa"
                  value={newMfgName}
                  onChange={(e) => setNewMfgName(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 outline-none bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Страна происхождения</label>
                <input
                  type="text"
                  placeholder="Например, Италия"
                  value={newMfgCountry}
                  onChange={(e) => setNewMfgCountry(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 outline-none bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Логотип бренда</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg px-3 py-2 bg-white hover:bg-slate-100/80 cursor-pointer transition text-xs font-semibold text-slate-700">
                    <Upload className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{newMfgLogoFileName || 'Выбрать логотип'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMfgLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {newMfgLogoPreview && (
                    <div className="relative group flex-shrink-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden">
                        <img src={newMfgLogoPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={handleClearMfgLogo}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow hover:bg-rose-600 transition"
                        title="Удалить"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow transition flex items-center justify-center gap-1.5 min-h-[36px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить</span>
                </button>
              </div>
            </div>
          </form>

          {/* Manufacturers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {manufacturers.map(m => {
              const isEditing = editingMfgId === m.id;

              if (isEditing) {
                return (
                  <div key={m.id} className="bg-blue-50/70 border-2 border-blue-500 rounded-xl p-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Редактирование</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEditMfg(m)}
                          title="Сохранить изменения"
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow flex items-center gap-1 text-xs font-semibold px-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Сохранить</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditMfg}
                          title="Отмена"
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Название бренда</label>
                        <input
                          type="text"
                          value={editMfgName}
                          onChange={(e) => setEditMfgName(e.target.value)}
                          className="w-full font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Страна происхождения</label>
                        <input
                          type="text"
                          value={editMfgCountry}
                          onChange={(e) => setEditMfgCountry(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Заменить логотип</label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg px-2 py-1.5 bg-white cursor-pointer transition text-[11px] font-semibold text-slate-700">
                            <Upload className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{editMfgLogoFileName || 'Загрузить новый'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditMfgLogoUpload}
                              className="hidden"
                            />
                          </label>
                          {editMfgLogoPreview && (
                            <div className="w-8 h-8 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img src={editMfgLogoPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{m.fullName}</div>
                      <div className="text-xs text-slate-500 font-medium">{m.countryOrigin}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditMfg(m)}
                        title="Редактировать производителя"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteManufacturer(m.id)}
                        title="Удалить производителя"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Logo Graphic Container */}
                  <div className="h-16 w-full bg-white rounded-lg p-2 border border-slate-200/90 flex items-center justify-center overflow-hidden shadow-inner">
                    {m.logoPath ? (
                      <img
                        src={m.logoPath}
                        alt={m.fullName}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const sibling = target.nextElementSibling as HTMLElement | null;
                          if (sibling) sibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="hidden items-center justify-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider"
                      style={{ display: !m.logoPath ? 'flex' : 'none' }}
                    >
                      <ImageIcon className="w-4 h-4 text-slate-300" />
                      <span>{m.fullName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decors Tab */}
      {adminTab === 'decors' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Добавить новый декор HPL</h2>
            <p className="text-xs text-slate-500">Файлы декоров сохраняются в <code>/uploads/decors</code> с именем: <strong>Название производителя_Номер декора_Название декора</strong></p>
          </div>
          
          <form onSubmit={handleAddDecorSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Производитель</label>
                <select
                  value={newDecorMfgId}
                  onChange={(e) => setNewDecorMfgId(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Артикул / Номер декора</label>
                <input
                  type="text"
                  value={newDecorNumber}
                  onChange={(e) => setNewDecorNumber(e.target.value)}
                  placeholder="Например, 4012"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Название декора</label>
                <input
                  type="text"
                  value={newDecorName}
                  onChange={(e) => setNewDecorName(e.target.value)}
                  placeholder="Например, Marble Carrara"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Базовая цена (€/м²)</label>
                <input
                  type="number"
                  value={newDecorCost}
                  onChange={(e) => setNewDecorCost(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>
            </div>

            {/* Path Calculator Banner */}
            {(() => {
              const mfgObj = manufacturers.find(m => m.id === newDecorMfgId) || manufacturers[0];
              const path = generateDecorFilePath(mfgObj?.fullName || 'Manufacturer', newDecorNumber || '000', newDecorName || 'DecorName', newDecorExt);
              return (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-medium">
                    <ImageIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Сгенерированный путь файла:</span>
                    <code className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold text-emerald-800">
                      {path}
                    </code>
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow whitespace-nowrap">
                    Сохранить декор
                  </button>
                </div>
              );
            })()}
          </form>

          {/* List of Decors */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Все декоры в системе ({decors.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {decors.map(d => {
                const mfg = manufacturers.find(m => m.id === d.manufacturerId);
                return (
                  <div key={d.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{d.name}</div>
                        <div className="text-slate-500 text-[11px]">{mfg?.fullName} | № {d.decorNumber} | {d.cost} €/м²</div>
                      </div>
                      <button
                        onClick={() => onDeleteDecor(d.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {d.decorPhotoPath && (
                      <div className="font-mono text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 truncate" title={d.decorPhotoPath}>
                        {d.decorPhotoPath}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Embossings Tab */}
      {adminTab === 'embossings' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Справочник тиснений HPL</h2>
            <p className="text-xs text-slate-500">Файлы тиснений сохраняются в <code>/uploads/embossings</code> с именем: <strong>Название производителя_Название тиснения</strong></p>
          </div>

          <form onSubmit={handleAddEmbossingSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Производитель</label>
                <select
                  value={newEmbossingMfgId}
                  onChange={(e) => setNewEmbossingMfgId(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Название тиснения</label>
                <input
                  type="text"
                  value={newEmbossingName}
                  onChange={(e) => setNewEmbossingName(e.target.value)}
                  placeholder="Например, Canyon"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Короткий код (2-3 буквы)</label>
                <input
                  type="text"
                  value={newEmbossingShortName}
                  onChange={(e) => setNewEmbossingShortName(e.target.value)}
                  placeholder="Например, CN"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>
            </div>

            {/* Path Calculator */}
            {(() => {
              const mfgObj = manufacturers.find(m => m.id === newEmbossingMfgId) || manufacturers[0];
              const path = generateEmbossingFilePath(mfgObj?.fullName || 'Manufacturer', newEmbossingName || 'EmbossingName', newEmbossingExt);
              return (
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-medium">
                    <ImageIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>Сгенерированный путь файла:</span>
                    <code className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-300 font-bold text-indigo-800">
                      {path}
                    </code>
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow whitespace-nowrap">
                    Добавить тиснение
                  </button>
                </div>
              );
            })()}
          </form>

          {/* List of Embossings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {embossings.map(emb => {
              const mfg = manufacturers.find(m => m.id === emb.manufacturerId);
              return (
                <div key={emb.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{emb.name}</span>
                      <span className="text-slate-500 text-[11px] ml-1 font-semibold">({emb.shortName})</span>
                    </div>
                    {onDeleteEmbossing && (
                      <button
                        onClick={() => onDeleteEmbossing(emb.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">Производитель: {mfg?.fullName || 'Gentas'}</div>
                  {emb.imagePath && (
                    <div className="font-mono text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 truncate" title={emb.imagePath}>
                      {emb.imagePath}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Services Tab */}
      {adminTab === 'services' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Тарифы и стоимость обработки</h2>
            <p className="text-xs text-slate-500">Файлы услуг сохраняются в <code>/uploads/services</code> с именем: <strong>Название услуги</strong></p>
          </div>

          <form onSubmit={handleAddServiceSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Наименование услуги</label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Например, Прямой распил HPL панели"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Единица измерения</label>
                <input
                  type="text"
                  value={newServiceUnit}
                  onChange={(e) => setNewServiceUnit(e.target.value)}
                  placeholder="м.п. / шт. / м²"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Цена (₽)</label>
                <input
                  type="number"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>
            </div>

            {/* Path Calculator */}
            {(() => {
              const path = generateServiceFilePath(newServiceName || 'ServiceName', newServiceExt);
              return (
                <div className="bg-purple-50/80 border border-purple-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-purple-900 font-medium">
                    <ImageIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span>Сгенерированный путь файла:</span>
                    <code className="font-mono bg-white px-2 py-0.5 rounded border border-purple-300 font-bold text-purple-800">
                      {path}
                    </code>
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow whitespace-nowrap">
                    Добавить услугу
                  </button>
                </div>
              );
            })()}
          </form>

          {/* List of Services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map(srv => (
              <div key={srv.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{srv.name}</div>
                    <div className="text-slate-500 font-semibold">{srv.price} ₽ / {srv.unit}</div>
                  </div>
                  {onDeleteService && (
                    <button
                      onClick={() => onDeleteService(srv.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {srv.photoPath && (
                  <div className="font-mono text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 truncate" title={srv.photoPath}>
                    {srv.photoPath}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Org Tab */}
      {adminTab === 'org' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Реквизиты организации</h2>
            <p className="text-xs text-slate-500">Логотип сохраняется в <code>/uploads/organization</code> с именем: <strong>Название организации</strong></p>
          </div>
          
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
                className="w-full border border-slate-300 rounded px-3 py-2 font-medium bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ИНН</label>
              <input
                type="text"
                value={orgState.inn}
                onChange={(e) => setOrgState({ ...orgState, inn: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 font-medium bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Телефон</label>
              <input
                type="text"
                value={orgState.phone}
                onChange={(e) => setOrgState({ ...orgState, phone: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 font-medium bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <input
                type="text"
                value={orgState.email}
                onChange={(e) => setOrgState({ ...orgState, email: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 font-medium bg-white"
              />
            </div>

            {/* Generated Logo Path Banner */}
            <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-900 font-medium">
                <ImageIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Сгенерированный путь файла логотипа:</span>
                <code className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-amber-800">
                  {generateOrganizationFilePath(orgState.fullName, 'png')}
                </code>
              </div>
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
