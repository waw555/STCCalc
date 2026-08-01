import React, { useState, useEffect, useMemo } from 'react';
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
import { Settings, DollarSign, Building2, Layers, Grid, Sliders, ShieldAlert, Plus, Trash2, Check, Save, Globe, Upload, Image as ImageIcon, FileText, X, Pencil, Users, UserPlus, ShieldCheck, UserCheck, Lock, Mail, User as UserIcon, Search, Key, Eye, EyeOff, RefreshCw, Maximize2, Palette, Ruler, Database, Filter } from 'lucide-react';
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
  panelSizes?: PanelSize[];
  onAddPanelSize?: (size: Omit<PanelSize, 'id'>) => void;
  onDeletePanelSize?: (id: number) => void;
  thicknesses?: PanelThickness[];
  onAddThickness?: (thickness: number) => void;
  onDeleteThickness?: (id: number) => void;
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
  panelSizes = [],
  onAddPanelSize,
  onDeletePanelSize,
  thicknesses = [],
  onAddThickness,
  onDeleteThickness,
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
  const [adminTab, setAdminTab] = useState<'panels' | 'decors' | 'formats' | 'thicknesses' | 'embossings' | 'mfg' | 'currencies' | 'services' | 'users' | 'org'>('panels');

  // Panels (Finished Ready Panel) form state
  const [panelMfgId, setPanelMfgId] = useState<number>(manufacturers[0]?.id || 1);
  const [panelSizeId, setPanelSizeId] = useState<number>(panelSizes[0]?.id || 1);
  const [panelDecorNumber, setPanelDecorNumber] = useState('');
  const [panelDecorName, setPanelDecorName] = useState('');
  const [panelNomenclature1C, setPanelNomenclature1C] = useState('');
  const [panelEmbossingId, setPanelEmbossingId] = useState<number>(embossings[0]?.id || 1);
  const [panelThicknessId, setPanelThicknessId] = useState<number>(thicknesses[0]?.id || 1);
  const [panelCurrency, setPanelCurrency] = useState<string>('EUR');
  const [panelIsStock, setPanelIsStock] = useState<boolean>(true);
  const [panelSearch, setPanelSearch] = useState('');

  // Filters by Manufacturer for sub-tabs
  const [decorMfgFilter, setDecorMfgFilter] = useState<number | 'all'>('all');
  const [formatMfgFilter, setFormatMfgFilter] = useState<number | 'all'>('all');
  const [embossingMfgFilter, setEmbossingMfgFilter] = useState<number | 'all'>('all');

  // Available Formats and Embossings for currently selected Manufacturer in Panel Form
  const availFormatsForPanelMfg = useMemo(() => {
    const matched = panelSizes.filter(ps => !ps.manufacturerId || ps.manufacturerId === panelMfgId);
    return matched.length > 0 ? matched : panelSizes;
  }, [panelSizes, panelMfgId]);

  const availEmbossingsForPanelMfg = useMemo(() => {
    const matched = embossings.filter(emb => !emb.manufacturerId || emb.manufacturerId === panelMfgId);
    return matched.length > 0 ? matched : embossings;
  }, [embossings, panelMfgId]);

  const handlePanelMfgChange = (mfgId: number) => {
    setPanelMfgId(mfgId);
    // Check if current format belongs to new mfg, else select first matching
    const formats = panelSizes.filter(ps => !ps.manufacturerId || ps.manufacturerId === mfgId);
    if (formats.length > 0 && !formats.some(f => f.id === panelSizeId)) {
      setPanelSizeId(formats[0].id);
    }
    // Check if current embossing belongs to new mfg, else select first matching
    const embList = embossings.filter(e => !e.manufacturerId || e.manufacturerId === mfgId);
    if (embList.length > 0 && !embList.some(e => e.id === panelEmbossingId)) {
      setPanelEmbossingId(embList[0].id);
    }
  };

  // Format area calculation helper
  const getFormatArea = (sizeId: number): number => {
    const ps = panelSizes.find(s => s.id === sizeId);
    if (!ps) return 3.965;
    return ps.volumeM2 || Number(((ps.heightMm * ps.widthMm) / 1000000).toFixed(3));
  };

  const [panelPricePerM2, setPanelPricePerM2] = useState<number>(85.0);
  const [panelPricePerSheet, setPanelPricePerSheet] = useState<number>(() => {
    const initArea = panelSizes[0] ? (panelSizes[0].volumeM2 || Number(((panelSizes[0].heightMm * panelSizes[0].widthMm) / 1000000).toFixed(3))) : 3.965;
    return Number((85.0 * initArea).toFixed(2));
  });

  const handlePricePerM2Change = (val: number) => {
    setPanelPricePerM2(val);
    const area = getFormatArea(panelSizeId);
    if (area > 0) {
      setPanelPricePerSheet(Number((val * area).toFixed(2)));
    }
  };

  const handlePricePerSheetChange = (val: number) => {
    setPanelPricePerSheet(val);
    const area = getFormatArea(panelSizeId);
    if (area > 0) {
      setPanelPricePerM2(Number((val / area).toFixed(2)));
    }
  };

  const handlePanelSizeChange = (newSizeId: number) => {
    setPanelSizeId(newSizeId);
    const area = getFormatArea(newSizeId);
    if (area > 0 && panelPricePerM2 > 0) {
      setPanelPricePerSheet(Number((panelPricePerM2 * area).toFixed(2)));
    }
  };

  // Thickness form state
  const [newThicknessMm, setNewThicknessMm] = useState<number>(12);

  const handleAddThicknessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThicknessMm || newThicknessMm <= 0) return;
    if (onAddThickness) {
      onAddThickness(newThicknessMm);
    }
  };

  const handleAddPanelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelDecorName.trim()) return;
    const selSize = panelSizes.find(ps => ps.id === panelSizeId) || { heightMm: 3050, widthMm: 1300 };
    const selThickness = thicknesses.find(t => t.id === panelThicknessId)?.thickness || 12;
    const mfg = manufacturers.find(m => m.id === panelMfgId);

    onAddDecor({
      name: `${mfg?.fullName || ''} ${panelDecorNumber} ${panelDecorName}`.trim(),
      decorNumber: panelDecorNumber.trim(),
      decorName: panelDecorName.trim(),
      nomenclature1C: panelNomenclature1C.trim(),
      widthMm: selSize.widthMm,
      heightMm: selSize.heightMm,
      thicknessMm: selThickness,
      manufacturerId: panelMfgId,
      embossingId: panelEmbossingId,
      panelSizeId: panelSizeId,
      thicknessId: panelThicknessId,
      pricePerM2: panelPricePerM2,
      pricePerSheet: panelPricePerSheet,
      cost: Number((panelPricePerM2 / 1.465).toFixed(2)),
      costPerSheet: Number((panelPricePerSheet / 1.465).toFixed(2)),
      markup: 46.5,
      currency: panelCurrency,
      isStockDecor: panelIsStock,
      isStockProgram: panelIsStock,
      isActive: true,
    });

    setPanelDecorNumber('');
    setPanelDecorName('');
    setPanelNomenclature1C('');
  };

  // Format (Panel Size) form state
  const [newFormatMfgId, setNewFormatMfgId] = useState<number>(manufacturers[0]?.id || 1);
  const [newFormatHeightMm, setNewFormatHeightMm] = useState<number>(3050);
  const [newFormatWidthMm, setNewFormatWidthMm] = useState<number>(1300);
  const [newFormatIsStock, setNewFormatIsStock] = useState<boolean>(true);

  const handleAddFormatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormatHeightMm || !newFormatWidthMm) return;
    const vol = Number(((newFormatHeightMm * newFormatWidthMm) / 1000000).toFixed(3));
    if (onAddPanelSize) {
      onAddPanelSize({
        heightMm: newFormatHeightMm,
        widthMm: newFormatWidthMm,
        volumeM2: vol,
        manufacturerId: newFormatMfgId,
        isActive: true,
        isStockProgram: newFormatIsStock,
      });
    }
  };

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

      {/* Admin Primary Tabs */}
      {(() => {
        const isDbTab = ['panels', 'decors', 'formats', 'thicknesses', 'embossings', 'mfg'].includes(adminTab);

        return (
          <div className="space-y-3">
            <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-2">
              <button
                onClick={() => {
                  if (!isDbTab) setAdminTab('panels');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
                  isDbTab 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Database className="w-4 h-4" /> 
                <span>База данных панелей</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isDbTab ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {decors.length}
                </span>
              </button>

              <button
                onClick={() => setAdminTab('currencies')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                  adminTab === 'currencies' 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-4 h-4" /> Валюты и курсы
              </button>

              <button
                onClick={() => setAdminTab('services')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                  adminTab === 'services' 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-4 h-4" /> Тарифы услуг
              </button>

              <button
                onClick={() => setAdminTab('users')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                  adminTab === 'users' 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                  adminTab === 'org' 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" /> Реквизиты компании
              </button>
            </div>

            {/* Sub-Navigation for Panel Database */}
            {isDbTab && (
              <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-md border border-slate-800 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-2 gap-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-extrabold tracking-wide uppercase text-blue-200">
                      Раздел «База данных панелей»
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Управление элементами и параметрами HPL панелей
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <button
                    onClick={() => setAdminTab('panels')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      adminTab === 'panels' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Панели
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-200 font-bold">
                      {decors.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setAdminTab('decors')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      adminTab === 'decors' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" /> Декоры
                  </button>

                  <button
                    onClick={() => setAdminTab('formats')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      adminTab === 'formats' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Форматы
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-200 font-bold">
                      {panelSizes.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setAdminTab('thicknesses')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      adminTab === 'thicknesses' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" /> Толщины
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-200 font-bold">
                      {thicknesses.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setAdminTab('embossings')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      adminTab === 'embossings' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" /> Тиснения
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-200 font-bold">
                      {embossings.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setAdminTab('mfg')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      adminTab === 'mfg' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Производители
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-200 font-bold">
                      {manufacturers.length}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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

      {/* Panels (Finished Ready Panels) Tab */}
      {adminTab === 'panels' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>База готовых панелей HPL</span>
              </h2>
              <p className="text-xs text-slate-500">
                Справочник готовых плит с указанием производителя, формата, декора, тиснения, толщины и цен за м² / за лист
              </p>
            </div>
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={panelSearch}
                onChange={(e) => setPanelSearch(e.target.value)}
                placeholder="Поиск по декору, артикулу..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Form to create/add a new Panel */}
          <form onSubmit={handleAddPanelSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" /> Добавление новой готовой панели
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Manufacturer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Производитель</label>
                <select
                  value={panelMfgId}
                  onChange={(e) => handlePanelMfgChange(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.countryOrigin})</option>
                  ))}
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Формат листа (Д×Ш мм)</label>
                <select
                  value={panelSizeId}
                  onChange={(e) => handlePanelSizeChange(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availFormatsForPanelMfg.map((ps: PanelSize) => {
                    const area = ps.volumeM2 || Number(((ps.heightMm * ps.widthMm) / 1000000).toFixed(3));
                    return (
                      <option key={ps.id} value={ps.id}>
                        {ps.heightMm} × {ps.widthMm} мм ({area} м²)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Decor Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Артикул / Код декора</label>
                <input
                  type="text"
                  value={panelDecorNumber}
                  onChange={(e) => setPanelDecorNumber(e.target.value)}
                  placeholder="Например: 3096"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Decor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Наименование декора</label>
                <input
                  type="text"
                  value={panelDecorName}
                  onChange={(e) => setPanelDecorName(e.target.value)}
                  placeholder="Например: Canyon Wood"
                  required
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Nomenclature 1C */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Номенклатура (1С)</label>
                <input
                  type="text"
                  value={panelNomenclature1C}
                  onChange={(e) => setPanelNomenclature1C(e.target.value)}
                  placeholder="Номенклатурное наименование из 1С..."
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Embossing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Тиснение</label>
                <select
                  value={panelEmbossingId}
                  onChange={(e) => setPanelEmbossingId(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availEmbossingsForPanelMfg.map((emb: Embossing) => (
                    <option key={emb.id} value={emb.id}>
                      {emb.name} ({emb.shortName || '—'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Thickness */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Толщина (мм)</label>
                <select
                  value={panelThicknessId}
                  onChange={(e) => setPanelThicknessId(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {thicknesses.map(t => (
                    <option key={t.id} value={t.id}>{t.thickness} мм</option>
                  ))}
                </select>
              </div>

              {/* Price per M2 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Цена за м² ({panelCurrency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={panelPricePerM2}
                  onChange={(e) => handlePricePerM2Change(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Price per Sheet */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Цена за лист ({panelCurrency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={panelPricePerSheet}
                  onChange={(e) => handlePricePerSheetChange(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 text-emerald-700 font-bold"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Валюта цены</label>
                <select
                  value={panelCurrency}
                  onChange={(e) => setPanelCurrency(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code} ({c.name})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-4 text-slate-700">
                <span className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-blue-900 font-medium">
                  Площадь выбранного формата: <strong>{getFormatArea(panelSizeId)} м²</strong> | Авторасчет: <strong>1 м² = {panelPricePerM2} {panelCurrency}</strong> ↔ <strong>1 лист = {panelPricePerSheet} {panelCurrency}</strong>
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={panelIsStock}
                    onChange={(e) => setPanelIsStock(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Складская программа
                </label>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-5 rounded-lg shadow transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Добавить панель в базу
              </button>
            </div>
          </form>

          {/* List of Ready Panels */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">№</th>
                  <th className="py-3 px-3">Производитель</th>
                  <th className="py-3 px-3">Номенклатура (1С) / Декор</th>
                  <th className="py-3 px-3">Формат (Д×Ш мм)</th>
                  <th className="py-3 px-3">Тиснение</th>
                  <th className="py-3 px-3">Толщина</th>
                  <th className="py-3 px-3 text-right">Цена / м²</th>
                  <th className="py-3 px-3 text-right">Цена / лист</th>
                  <th className="py-3 px-3 text-center">Статус</th>
                  <th className="py-3 px-3 text-center">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {decors
                  .filter(d => {
                    if (!panelSearch.trim()) return true;
                    const q = panelSearch.toLowerCase();
                    return (
                      d.name?.toLowerCase().includes(q) ||
                      d.decorNumber?.toLowerCase().includes(q) ||
                      d.decorName?.toLowerCase().includes(q) ||
                      d.nomenclature1C?.toLowerCase().includes(q)
                    );
                  })
                  .map((panel, idx) => {
                    const mfg = manufacturers.find(m => m.id === panel.manufacturerId);
                    const emb = embossings.find(e => e.id === panel.embossingId);
                    const area = Number(((panel.heightMm * panel.widthMm) / 1000000).toFixed(3));
                    const priceM2 = panel.pricePerM2 || 0;
                    const priceSheet = panel.pricePerSheet || Number((area * priceM2).toFixed(2));

                    return (
                      <tr key={panel.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {mfg ? mfg.fullName : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{panel.decorName || panel.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {panel.decorNumber && (
                              <span className="text-[10px] text-slate-500 font-mono">Арт: {panel.decorNumber}</span>
                            )}
                            {panel.nomenclature1C && (
                              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-mono">
                                1С: {panel.nomenclature1C}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {panel.heightMm} × {panel.widthMm} мм ({area} м²)
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {emb ? `${emb.name} (${emb.shortName})` : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {panel.thicknessMm || 12} мм
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {priceM2} {panel.currency}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {priceSheet} {panel.currency}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {panel.isStockProgram ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              Склад
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                              Заказ
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onDeleteDecor(panel.id)}
                            title="Удалить панель"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700">Фильтр декоров по производителю:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDecorMfgFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    decorMfgFilter === 'all'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Все ({decors.length})
                </button>
                {manufacturers.map(m => {
                  const count = decors.filter(d => d.manufacturerId === m.id).length;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDecorMfgFilter(m.id)}
                      className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                        decorMfgFilter === m.id
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{m.fullName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        decorMfgFilter === m.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {decors
                .filter(d => decorMfgFilter === 'all' || d.manufacturerId === decorMfgFilter)
                .map(d => {
                  const mfg = manufacturers.find(m => m.id === d.manufacturerId);
                  return (
                    <div key={d.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between space-y-2 text-xs hover:border-blue-300 transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                              {mfg?.fullName || 'Производитель'}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900">{d.name}</div>
                          <div className="text-slate-500 text-[11px] font-medium">Арт: {d.decorNumber || '—'} | {d.cost} €/м²</div>
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

      {/* Formats Tab */}
      {adminTab === 'formats' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-blue-600" />
              <span>Форматы листов HPL</span>
            </h2>
            <p className="text-xs text-slate-500">Справочник габаритных форматов плит (длина × ширина, площадь в м²), привязанных к производителям</p>
          </div>

          {/* Add Format Form */}
          <form onSubmit={handleAddFormatSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Производитель</label>
                <select
                  value={newFormatMfgId}
                  onChange={(e) => setNewFormatMfgId(Number(e.target.value))}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Длина листа (мм)</label>
                <input
                  type="number"
                  value={newFormatHeightMm}
                  onChange={(e) => setNewFormatHeightMm(Number(e.target.value))}
                  placeholder="3050"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ширина листа (мм)</label>
                <input
                  type="number"
                  value={newFormatWidthMm}
                  onChange={(e) => setNewFormatWidthMm(Number(e.target.value))}
                  placeholder="1300"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow transition flex items-center justify-center gap-1.5 min-h-[36px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить формат</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-blue-900">
              <span>Расчетная площадь листа: <strong>{((newFormatHeightMm * newFormatWidthMm) / 1000000).toFixed(3)} м²</strong> ({newFormatHeightMm} × {newFormatWidthMm} мм)</span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={newFormatIsStock}
                  onChange={(e) => setNewFormatIsStock(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Складская программа
              </label>
            </div>
          </form>

          {/* List of Formats */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700">Фильтр форматов по производителю:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFormatMfgFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    formatMfgFilter === 'all'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Все ({panelSizes.length})
                </button>
                {manufacturers.map(m => {
                  const count = panelSizes.filter(s => s.manufacturerId === m.id).length;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFormatMfgFilter(m.id)}
                      className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                        formatMfgFilter === m.id
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{m.fullName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        formatMfgFilter === m.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {panelSizes
                .filter(ps => formatMfgFilter === 'all' || ps.manufacturerId === formatMfgFilter)
                .map(ps => {
                  const mfg = manufacturers.find(m => m.id === ps.manufacturerId);
                  const area = ps.volumeM2 || Number(((ps.heightMm * ps.widthMm) / 1000000).toFixed(3));
                  return (
                    <div key={ps.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-2 text-xs hover:border-blue-300 transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {ps.heightMm} × {ps.widthMm} мм
                          </div>
                          <div className="mt-1">
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded">
                              {mfg ? mfg.fullName : 'Все производители'}
                            </span>
                          </div>
                        </div>
                        {onDeletePanelSize && (
                          <button
                            type="button"
                            onClick={() => onDeletePanelSize(ps.id)}
                            title="Удалить формат"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[11px]">
                      <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Площадь: {area} м²
                      </span>
                      {ps.isStockProgram ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          Складской
                        </span>
                      ) : (
                        <span className="bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded text-[10px]">
                          Под заказ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Thicknesses Tab */}
      {adminTab === 'thicknesses' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-blue-600" />
              <span>Толщины компакт-плит HPL</span>
            </h2>
            <p className="text-xs text-slate-500">
              Справочник допустимых толщин монолитного пластика HPL в миллиметрах
            </p>
          </div>

          {/* Form to add thickness */}
          <form onSubmit={handleAddThicknessSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-end gap-3 max-w-md">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-700 mb-1">Толщина (мм)</label>
              <input
                type="number"
                step="0.5"
                value={newThicknessMm}
                onChange={(e) => setNewThicknessMm(Number(e.target.value))}
                placeholder="Например: 12"
                required
                min="0.5"
                max="50"
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow transition flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[36px]"
            >
              <Plus className="w-4 h-4" /> Добавить толщину
            </button>
          </form>

          {/* List of Thicknesses */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Доступные толщины ({thicknesses.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {thicknesses.map(t => {
                const panelsCount = decors.filter(d => d.thicknessMm === t.thickness || d.thicknessId === t.id).length;
                return (
                  <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-slate-900">{t.thickness} мм</span>
                      {onDeleteThickness && (
                        <button
                          type="button"
                          onClick={() => onDeleteThickness(t.id)}
                          title="Удалить толщину"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60 flex items-center justify-between">
                      <span>Панелей:</span>
                      <span className="font-bold text-slate-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">{panelsCount}</span>
                    </div>
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

          {/* List of Embossings Filter & Grid */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700">Фильтр тиснений по производителю:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setEmbossingMfgFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    embossingMfgFilter === 'all'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Все ({embossings.length})
                </button>
                {manufacturers.map(m => {
                  const count = embossings.filter(e => e.manufacturerId === m.id).length;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEmbossingMfgFilter(m.id)}
                      className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                        embossingMfgFilter === m.id
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{m.fullName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        embossingMfgFilter === m.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {embossings
                .filter(emb => embossingMfgFilter === 'all' || emb.manufacturerId === embossingMfgFilter)
                .map(emb => {
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
