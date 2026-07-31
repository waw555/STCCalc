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
  UserSession,
  UserAccount 
} from '../../types';
import { Settings, DollarSign, Building2, Layers, Grid, Sliders, ShieldAlert, Plus, Trash2, Check, Save, Globe, Upload, Image as ImageIcon, FileText, X, Pencil, Users, UserPlus, ShieldCheck, UserCheck, Lock, Mail, User as UserIcon, Search, Key, Eye, EyeOff, RefreshCw } from 'lucide-react';
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
  onUpdateEmbossing?: (emb: Embossing) => void;
  onDeleteEmbossing?: (id: number) => void;
  services: Service[];
  onAddService: (srv: Omit<Service, 'id'>) => void;
  onDeleteService?: (id: number) => void;
  suppliers: Supplier[];
  organization: OrganizationSettings;
  onUpdateOrganization: (org: OrganizationSettings) => void;
  users?: UserAccount[];
  onAddUser?: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onDeleteUser?: (id: number) => void;
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
  onUpdateEmbossing,
  onDeleteEmbossing,
  services,
  onAddService,
  onDeleteService,
  suppliers,
  organization,
  onUpdateOrganization,
  users = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [adminTab, setAdminTab] = useState<'currencies' | 'mfg' | 'decors' | 'embossings' | 'services' | 'users' | 'org'>('currencies');

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
  const [newEmbossingImagePreview, setNewEmbossingImagePreview] = useState('');
  const [newEmbossingImageFileName, setNewEmbossingImageFileName] = useState('');

  const handleEmbossingImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewEmbossingImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEmbossingImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearEmbossingImage = () => {
    setNewEmbossingImagePreview('');
    setNewEmbossingImageFileName('');
  };

  // Embossing edit state
  const [editingEmbossingId, setEditingEmbossingId] = useState<number | null>(null);
  const [editEmbossingName, setEditEmbossingName] = useState('');
  const [editEmbossingShortName, setEditEmbossingShortName] = useState('');
  const [editEmbossingMfgId, setEditEmbossingMfgId] = useState<number>(1);
  const [editEmbossingImagePreview, setEditEmbossingImagePreview] = useState('');
  const [editEmbossingImageFileName, setEditEmbossingImageFileName] = useState('');

  const handleStartEditEmbossing = (emb: Embossing) => {
    setEditingEmbossingId(emb.id);
    setEditEmbossingName(emb.name);
    setEditEmbossingShortName(emb.shortName || '');
    setEditEmbossingMfgId(emb.manufacturerId || manufacturers[0]?.id || 1);
    setEditEmbossingImagePreview(emb.imagePath || '');
    setEditEmbossingImageFileName('');
  };

  const handleCancelEditEmbossing = () => {
    setEditingEmbossingId(null);
    setEditEmbossingName('');
    setEditEmbossingShortName('');
    setEditEmbossingMfgId(manufacturers[0]?.id || 1);
    setEditEmbossingImagePreview('');
    setEditEmbossingImageFileName('');
  };

  const handleEditEmbossingImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditEmbossingImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditEmbossingImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEditEmbossing = (emb: Embossing) => {
    if (!editEmbossingName.trim()) return;
    if (onUpdateEmbossing) {
      onUpdateEmbossing({
        ...emb,
        name: editEmbossingName.trim(),
        shortName: editEmbossingShortName.trim() || editEmbossingName.trim().slice(0, 3).toUpperCase(),
        manufacturerId: editEmbossingMfgId,
        imagePath: editEmbossingImagePreview || emb.imagePath,
      });
    }
    handleCancelEditEmbossing();
  };

  // Service form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceUnit, setNewServiceUnit] = useState('м.п.');
  const [newServicePrice, setNewServicePrice] = useState<number>(300);
  const [newServiceExt, setNewServiceExt] = useState('jpg');

  // Org form state
  const [orgState, setOrgState] = useState<OrganizationSettings>(organization);
  const [orgSaveMessage, setOrgSaveMessage] = useState<string | null>(null);

  // Users form state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [userSearch, setUserSearch] = useState('');

  // User edit state
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);

  // Password modal state
  const [pwdModalUser, setPwdModalUser] = useState<UserAccount | null>(null);
  const [pwdModalValue, setPwdModalValue] = useState('');
  const [pwdModalShow, setPwdModalShow] = useState(false);
  const [pwdSuccessMessage, setPwdSuccessMessage] = useState<string | null>(null);

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) return;
    if (onAddUser) {
      onAddUser({
        username: newUsername.trim().toLowerCase(),
        fullName: newFullName.trim(),
        email: newEmail.trim() || `${newUsername.trim().toLowerCase()}@stc-hpl.ru`,
        role: newRole,
        password: newPassword || '123456',
        isActive: true,
      });
    }
    setNewUsername('');
    setNewFullName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('user');
  };

  const handleStartEditUser = (u: UserAccount) => {
    setEditingUserId(u.id);
    setEditUsername(u.username);
    setEditFullName(u.fullName);
    setEditEmail(u.email);
    setEditPassword('');
    setShowEditPassword(false);
    setEditRole(u.role);
    setEditIsActive(u.isActive);
  };

  const handleCancelEditUser = () => {
    setEditingUserId(null);
    setEditUsername('');
    setEditFullName('');
    setEditEmail('');
    setEditPassword('');
    setShowEditPassword(false);
    setEditRole('user');
    setEditIsActive(true);
  };

  const handleSaveEditUser = (u: UserAccount) => {
    if (!editUsername.trim() || !editFullName.trim()) return;
    if (onUpdateUser) {
      onUpdateUser({
        ...u,
        username: editUsername.trim().toLowerCase(),
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        role: editRole,
        isActive: editIsActive,
        ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
      });
    }
    handleCancelEditUser();
  };

  const handleOpenPasswordModal = (u: UserAccount) => {
    setPwdModalUser(u);
    setPwdModalValue('');
    setPwdModalShow(false);
    setPwdSuccessMessage(null);
  };

  const handleClosePasswordModal = () => {
    setPwdModalUser(null);
    setPwdModalValue('');
    setPwdModalShow(false);
    setPwdSuccessMessage(null);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPwdModalValue(res);
    setPwdModalShow(true);
  };

  const handleSavePasswordModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdModalUser || !pwdModalValue.trim()) return;
    if (onUpdateUser) {
      onUpdateUser({
        ...pwdModalUser,
        password: pwdModalValue.trim(),
      });
    }
    setPwdSuccessMessage(`Пароль для пользователя ${pwdModalUser.fullName} (@${pwdModalUser.username}) успешно изменен!`);
    setTimeout(() => {
      handleClosePasswordModal();
    }, 1500);
  };

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
    const imagePath = newEmbossingImagePreview || generateEmbossingFilePath(mfgName, newEmbossingName, newEmbossingExt);

    onAddEmbossing({
      name: newEmbossingName.trim(),
      shortName: newEmbossingShortName.trim() || newEmbossingName.trim().slice(0, 3).toUpperCase(),
      manufacturerId: newEmbossingMfgId,
      imagePath: imagePath,
      isActive: true,
      isStockProgram: true,
    });
    setNewEmbossingName('');
    setNewEmbossingShortName('');
    setNewEmbossingImagePreview('');
    setNewEmbossingImageFileName('');
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
          onClick={() => setAdminTab('users')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'users' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> Пользователи
          {users.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              adminTab === 'users' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {users.length}
            </span>
          )}
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
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Grid className="w-5 h-5 text-blue-600" />
              <span>Справочник тиснений HPL</span>
            </h2>
            <p className="text-xs text-slate-500">Справочник доступных структур и тиснений поверхности HPL пластиков</p>
          </div>

          <form onSubmit={handleAddEmbossingSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Производитель</label>
                <select
                  value={newEmbossingMfgId}
                  onChange={(e) => setNewEmbossingMfgId(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Название тиснения</label>
                <input
                  type="text"
                  value={newEmbossingName}
                  onChange={(e) => setNewEmbossingName(e.target.value)}
                  placeholder="Например, Canyon"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Короткий код</label>
                <input
                  type="text"
                  value={newEmbossingShortName}
                  onChange={(e) => setNewEmbossingShortName(e.target.value)}
                  placeholder="Например, CN"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Фото тиснения</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg px-2 py-2 bg-white cursor-pointer transition text-[11px] font-semibold text-slate-700">
                    <Upload className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{newEmbossingImageFileName || 'Загрузить'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEmbossingImageUpload}
                      className="hidden"
                    />
                  </label>
                  {newEmbossingImagePreview && (
                    <div className="relative group flex-shrink-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden">
                        <img src={newEmbossingImagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={handleClearEmbossingImage}
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

          {/* List of Embossings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {embossings.map(emb => {
              const mfg = manufacturers.find(m => m.id === emb.manufacturerId);
              const isEditing = editingEmbossingId === emb.id;

              if (isEditing) {
                return (
                  <div key={emb.id} className="bg-blue-50/70 border-2 border-blue-500 rounded-xl p-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Редактирование</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEditEmbossing(emb)}
                          title="Сохранить изменения"
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow flex items-center gap-1 text-xs font-semibold px-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Сохранить</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditEmbossing}
                          title="Отмена"
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Производитель</label>
                        <select
                          value={editEmbossingMfgId}
                          onChange={(e) => setEditEmbossingMfgId(Number(e.target.value))}
                          className="w-full font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {manufacturers.map(m => (
                            <option key={m.id} value={m.id}>{m.fullName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Название тиснения</label>
                        <input
                          type="text"
                          value={editEmbossingName}
                          onChange={(e) => setEditEmbossingName(e.target.value)}
                          className="w-full font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Короткий код</label>
                        <input
                          type="text"
                          value={editEmbossingShortName}
                          onChange={(e) => setEditEmbossingShortName(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Заменить фото</label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg px-2 py-1.5 bg-white cursor-pointer transition text-[11px] font-semibold text-slate-700">
                            <Upload className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{editEmbossingImageFileName || 'Загрузить новое'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditEmbossingImageUpload}
                              className="hidden"
                            />
                          </label>
                          {editEmbossingImagePreview && (
                            <div className="w-8 h-8 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img src={editEmbossingImagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={emb.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{emb.name}</div>
                      <div className="text-slate-500 text-xs font-semibold">Код: <span className="text-blue-700 font-mono">{emb.shortName}</span></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditEmbossing(emb)}
                        title="Редактировать тиснение"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {onDeleteEmbossing && (
                        <button
                          type="button"
                          onClick={() => onDeleteEmbossing(emb.id)}
                          title="Удалить тиснение"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Photo Graphic Container */}
                  <div className="h-24 w-full bg-white rounded-lg p-2 border border-slate-200/90 flex items-center justify-center overflow-hidden shadow-inner relative group">
                    {emb.imagePath ? (
                      <img
                        src={emb.imagePath}
                        alt={emb.name}
                        className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.emboss-fallback');
                            if (fallback) fallback.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <div className={`emboss-fallback flex flex-col items-center justify-center text-slate-400 text-xs font-semibold gap-1 ${emb.imagePath ? 'hidden' : ''}`}>
                      <Grid className="w-6 h-6 text-slate-400 stroke-[1.5]" />
                      <span className="text-[10px] text-slate-500 font-mono font-bold">{emb.shortName || emb.name}</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-slate-500 pt-1 border-t border-slate-200/80 flex items-center justify-between">
                    <span>Бренд:</span>
                    <span className="font-semibold text-slate-700">{mfg?.fullName || 'Gentas'}</span>
                  </div>
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

      {/* Users Tab */}
      {adminTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Управление пользователями</span>
              </h2>
              <p className="text-xs text-slate-500">Добавление новых сотрудников, назначение ролей и управление доступом в систему</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Всего в системе: <strong>{users.length}</strong></span>
            </div>
          </div>

          {/* Add User Form */}
          <form onSubmit={handleAddUserSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              <UserPlus className="w-4 h-4 text-blue-600" />
              Новый пользователь
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ФИО / Имя *</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Иван Петров"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Логин *</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="ipetrov"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="petrov@stc-hpl.ru"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Пароль</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Пароль"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Роль доступа</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                  className="w-full font-bold border border-slate-300 rounded-lg px-3 py-2 outline-none bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value="user">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-5 rounded-lg shadow transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить пользователя</span>
              </button>
            </div>
          </form>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по имени, логину или email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full text-xs font-semibold pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Users List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users
              .filter(u => {
                const search = userSearch.toLowerCase();
                return (
                  u.fullName.toLowerCase().includes(search) ||
                  u.username.toLowerCase().includes(search) ||
                  u.email.toLowerCase().includes(search)
                );
              })
              .map(u => {
                const isEditing = editingUserId === u.id;
                const initials = u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || u.username.slice(0, 2).toUpperCase();

                if (isEditing) {
                  return (
                    <div key={u.id} className="bg-blue-50/70 border-2 border-blue-500 rounded-xl p-4 space-y-3 shadow-md">
                      <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Редактирование</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEditUser(u)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow flex items-center gap-1 text-xs font-semibold px-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Сохранить</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditUser}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">ФИО / Имя</label>
                          <input
                            type="text"
                            value={editFullName}
                            onChange={(e) => setEditFullName(e.target.value)}
                            className="w-full font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Логин</label>
                          <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Новый пароль</label>
                          <div className="relative">
                            <input
                              type={showEditPassword ? "text" : "password"}
                              placeholder="Оставить прежний (или ввести новый)"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg pl-2.5 pr-8 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEditPassword(!showEditPassword)}
                              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                              title={showEditPassword ? "Скрыть" : "Показать"}
                            >
                              {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Роль</label>
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                              className="w-full font-bold border border-slate-300 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="user">Менеджер</option>
                              <option value="admin">Администратор</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Статус</label>
                            <select
                              value={editIsActive ? 'active' : 'blocked'}
                              onChange={(e) => setEditIsActive(e.target.value === 'active')}
                              className="w-full font-bold border border-slate-300 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="active">Активен</option>
                              <option value="blocked">Заблокирован</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={u.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-slate-300 transition flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                            u.role === 'admin' 
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' 
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{u.fullName}</div>
                            <div className="text-xs font-semibold text-slate-500">@{u.username}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(u)}
                            title="Сменить пароль"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditUser(u)}
                            title="Редактировать пользователя"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {onDeleteUser && (
                            <button
                              type="button"
                              onClick={() => onDeleteUser(u.id)}
                              title="Удалить пользователя"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Email:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[180px]" title={u.email}>{u.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Роль:</span>
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Администратор
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Менеджер
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-slate-400 font-medium">Статус:</span>
                          {u.isActive ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Активен
                            </span>
                          ) : (
                            <span className="text-rose-500 font-bold text-[11px]">Заблокирован</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 mt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPasswordModal(u)}
                        className="w-full bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-600" />
                        <span>Сменить пароль</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Change Password Modal */}
          {pwdModalUser && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Смена пароля</h3>
                      <p className="text-xs font-semibold text-slate-500">{pwdModalUser.fullName} (@{pwdModalUser.username})</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClosePasswordModal}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {pwdSuccessMessage ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{pwdSuccessMessage}</span>
                  </div>
                ) : (
                  <form onSubmit={handleSavePasswordModal} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Новый пароль *</label>
                      <div className="relative">
                        <input
                          type={pwdModalShow ? "text" : "password"}
                          required
                          placeholder="Введите новый пароль"
                          value={pwdModalValue}
                          onChange={(e) => setPwdModalValue(e.target.value)}
                          className="w-full text-xs font-semibold pl-3 pr-20 py-2.5 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute right-2 top-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPwdModalShow(!pwdModalShow)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title={pwdModalShow ? "Скрыть" : "Показать"}
                          >
                            {pwdModalShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200/60 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Сгенерировать</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleClosePasswordModal}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          Отмена
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow transition flex items-center gap-1.5"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Сохранить</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
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
