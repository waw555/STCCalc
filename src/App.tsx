import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { CountertopCalculator } from './components/calculators/CountertopCalculator';
import { PartitionCalculator } from './components/calculators/PartitionCalculator';
import { SubsystemCalculator } from './components/calculators/SubsystemCalculator';
import { CuttingCalculator } from './components/calculators/CuttingCalculator';
import { SepticCalculator } from './components/calculators/SepticCalculator';
import { PriceListCountertops } from './components/pricelist/PriceListCountertops';
import { AdminPanel } from './components/admin/AdminPanel';
import { LoginModal } from './components/auth/LoginModal';
import { fetchCbrRates } from './services/cbrRates';

import { 
  TabType, 
  Currency, 
  Manufacturer, 
  PanelFormat, 
  Embossing, 
  PanelSize, 
  PanelThickness, 
  CountertopSettings, 
  ProductType, 
  Service, 
  Supplier, 
  OrganizationSettings, 
  UserSession,
  UserAccount 
} from './types';

import { 
  initialCurrencies, 
  initialManufacturers, 
  initialEmbossings, 
  initialPanelSizes, 
  initialThicknesses, 
  initialDecors, 
  initialCountertopSettings, 
  initialProductTypes, 
  initialServices, 
  initialSuppliers, 
  initialOrganization,
  initialUsers 
} from './data/initialData';

export const App: React.FC = () => {
  // Helper to safely load data from localStorage
  const loadStoredData = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        const parsed = JSON.parse(item);
        if (parsed !== undefined && parsed !== null) {
          return parsed as T;
        }
      }
    } catch (err) {
      console.error(`Error loading key "${key}" from localStorage:`, err);
    }
    return fallback;
  };

  const [activeTab, setActiveTab] = useState<TabType>(() => loadStoredData('stc_activeTab', 'calc_countertops'));
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => loadStoredData('stc_selectedCurrency', 'RUB'));
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);

  // Auth Session
  const [userSession, setUserSession] = useState<UserSession>(() => loadStoredData('stc_userSession', {
    isLoggedIn: true,
    username: 'admin',
    role: 'admin',
  }));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // App Master Datasets with localStorage persistence
  const [currencies, setCurrencies] = useState<Currency[]>(() => loadStoredData('stc_currencies', initialCurrencies));
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(() => loadStoredData('stc_manufacturers', initialManufacturers));
  const [embossings, setEmbossings] = useState<Embossing[]>(() => loadStoredData('stc_embossings', initialEmbossings));
  const [panelSizes, setPanelSizes] = useState<PanelSize[]>(() => loadStoredData('stc_panelSizes', initialPanelSizes));
  const [thicknesses, setThicknesses] = useState<PanelThickness[]>(() => loadStoredData('stc_thicknesses', initialThicknesses));
  const [decors, setDecors] = useState<PanelFormat[]>(() => loadStoredData('stc_decors', initialDecors));
  const [countertopSettings, setCountertopSettings] = useState<CountertopSettings>(() => loadStoredData('stc_countertopSettings', initialCountertopSettings));
  const [productTypes, setProductTypes] = useState<ProductType[]>(() => loadStoredData('stc_productTypes', initialProductTypes));
  const [services, setServices] = useState<Service[]>(() => loadStoredData('stc_services', initialServices));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStoredData('stc_suppliers', initialSuppliers));
  const [organization, setOrganization] = useState<OrganizationSettings>(() => loadStoredData('stc_organization', initialOrganization));
  const [users, setUsers] = useState<UserAccount[]>(() => loadStoredData('stc_users', initialUsers));

  // Auto-save changes to localStorage
  useEffect(() => { localStorage.setItem('stc_activeTab', JSON.stringify(activeTab)); }, [activeTab]);
  useEffect(() => { localStorage.setItem('stc_selectedCurrency', JSON.stringify(selectedCurrency)); }, [selectedCurrency]);
  useEffect(() => { localStorage.setItem('stc_userSession', JSON.stringify(userSession)); }, [userSession]);
  useEffect(() => { localStorage.setItem('stc_currencies', JSON.stringify(currencies)); }, [currencies]);
  useEffect(() => { localStorage.setItem('stc_manufacturers', JSON.stringify(manufacturers)); }, [manufacturers]);
  useEffect(() => { localStorage.setItem('stc_embossings', JSON.stringify(embossings)); }, [embossings]);
  useEffect(() => { localStorage.setItem('stc_panelSizes', JSON.stringify(panelSizes)); }, [panelSizes]);
  useEffect(() => { localStorage.setItem('stc_thicknesses', JSON.stringify(thicknesses)); }, [thicknesses]);
  useEffect(() => { localStorage.setItem('stc_decors', JSON.stringify(decors)); }, [decors]);
  useEffect(() => { localStorage.setItem('stc_countertopSettings', JSON.stringify(countertopSettings)); }, [countertopSettings]);
  useEffect(() => { localStorage.setItem('stc_productTypes', JSON.stringify(productTypes)); }, [productTypes]);
  useEffect(() => { localStorage.setItem('stc_services', JSON.stringify(services)); }, [services]);
  useEffect(() => { localStorage.setItem('stc_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('stc_organization', JSON.stringify(organization)); }, [organization]);
  useEffect(() => { localStorage.setItem('stc_users', JSON.stringify(users)); }, [users]);

  // Reset to Factory Default Data
  const handleResetAllData = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные системы к исходным? Все сохраненные изменения будут удалены.')) {
      const keys = [
        'stc_currencies',
        'stc_manufacturers',
        'stc_embossings',
        'stc_panelSizes',
        'stc_thicknesses',
        'stc_decors',
        'stc_countertopSettings',
        'stc_productTypes',
        'stc_services',
        'stc_suppliers',
        'stc_organization',
        'stc_users',
        'stc_selectedCurrency',
        'stc_activeTab',
        'stc_saved_countertop_calcs',
        'cbr_saved_cutting_calculations',
        'stc_partition_object_name',
        'stc_partition_panel_type',
        'stc_partition_cabins',
        'stc_partition_installation',
        'stc_partition_delivery',
        'stc_subsystem_area',
        'stc_subsystem_enclosure',
        'stc_subsystem_fastener',
        'stc_subsystem_profile',
        'stc_septic_people',
        'stc_septic_soil',
        'stc_septic_washing',
        'stc_septic_bath'
      ];
      keys.forEach(k => localStorage.removeItem(k));
      
      setCurrencies(initialCurrencies);
      setManufacturers(initialManufacturers);
      setEmbossings(initialEmbossings);
      setPanelSizes(initialPanelSizes);
      setThicknesses(initialThicknesses);
      setDecors(initialDecors);
      setCountertopSettings(initialCountertopSettings);
      setProductTypes(initialProductTypes);
      setServices(initialServices);
      setSuppliers(initialSuppliers);
      setOrganization(initialOrganization);
      setUsers(initialUsers);
      setSelectedCurrency('RUB');
      setActiveTab('calc_countertops');
    }
  };

  // Fetch live CBR rates on app load
  useEffect(() => {
    loadLiveCbrRates();
  }, []);

  const loadLiveCbrRates = async () => {
    setIsRefreshingRates(true);
    try {
      const cbrData = await fetchCbrRates();
      if (cbrData.rates && Object.keys(cbrData.rates).length > 0) {
        setCurrencies(prev => prev.map(c => {
          if (c.code === 'RUB') return c;
          const liveRate = cbrData.rates[c.code];
          if (liveRate) {
            return { 
              ...c, 
              rateToRub: liveRate, 
              updatedAt: cbrData.date || new Date().toLocaleDateString('ru-RU') 
            };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Failed to update rates from CBR:', err);
    } finally {
      setIsRefreshingRates(false);
    }
  };

  // Manual CBR refresh handler
  const handleRefreshRates = () => {
    loadLiveCbrRates();
  };

  const handleUpdateCurrencyRate = (code: string, newRate: number) => {
    setCurrencies(prev => prev.map(c => c.code === code ? { ...c, rateToRub: newRate } : c));
  };

  const handleAddCurrency = (newCurr: Currency) => {
    setCurrencies(prev => {
      const exists = prev.some(c => c.code === newCurr.code);
      if (exists) {
        return prev.map(c => c.code === newCurr.code ? { ...c, ...newCurr } : c);
      }
      return [...prev, newCurr];
    });
  };

  const handleDeleteCurrency = (code: string) => {
    if (code === 'RUB') return; // Cannot delete base currency
    setCurrencies(prev => prev.filter(c => c.code !== code));
    if (selectedCurrency === code) {
      setSelectedCurrency('RUB');
    }
  };

  const handleAddManufacturer = (mfg: Omit<Manufacturer, 'id'>) => {
    const newMfg: Manufacturer = { id: Date.now(), ...mfg };
    setManufacturers(prev => [...prev, newMfg]);
  };

  const handleDeleteManufacturer = (id: number) => {
    setManufacturers(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateManufacturer = (updated: Manufacturer) => {
    setManufacturers(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const handleAddDecor = (decor: Omit<PanelFormat, 'id'>) => {
    const newDecor: PanelFormat = { id: Date.now(), ...decor };
    setDecors(prev => [newDecor, ...prev]);
  };

  const handleDeleteDecor = (id: number) => {
    setDecors(prev => prev.filter(d => d.id !== id));
  };

  const handleAddThickness = (thickness: number) => {
    if (!thickness || thickness <= 0) return;
    const newThick: PanelThickness = { id: Date.now(), thickness, isActive: true };
    setThicknesses(prev => [...prev, newThick].sort((a, b) => a.thickness - b.thickness));
  };

  const handleDeleteThickness = (id: number) => {
    setThicknesses(prev => prev.filter(t => t.id !== id));
  };

  const handleAddPanelSize = (size: Omit<PanelSize, 'id'>) => {
    const newSize: PanelSize = { id: Date.now(), ...size };
    setPanelSizes(prev => [...prev, newSize]);
  };

  const handleDeletePanelSize = (id: number) => {
    setPanelSizes(prev => prev.filter(p => p.id !== id));
  };

  const handleAddEmbossing = (emb: Omit<Embossing, 'id'>) => {
    setEmbossings(prev => [...prev, { id: Date.now(), ...emb }]);
  };

  const handleUpdateEmbossing = (updated: Embossing) => {
    setEmbossings(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const handleDeleteEmbossing = (id: number) => {
    setEmbossings(prev => prev.filter(e => e.id !== id));
  };

  const handleAddService = (srv: Omit<Service, 'id'>) => {
    setServices(prev => [...prev, { id: Date.now(), ...srv }]);
  };

  const handleDeleteService = (id: number) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleAddUser = (user: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const newUser: UserAccount = {
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      ...user
    };
    setUsers(prev => [newUser, ...prev]);
  };

  const handleUpdateUser = (updated: UserAccount) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const handleDeleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Sticky Header & Navigation Container */}
      <div className="sticky top-0 z-30 no-print shadow-md">
        {/* App Header */}
        <Header
          currencies={currencies}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={setSelectedCurrency}
          onRefreshRates={handleRefreshRates}
          isRefreshing={isRefreshingRates}
          userSession={userSession}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={() => setUserSession({ isLoggedIn: false, username: '', role: 'user' })}
          orgName={organization.fullName}
        />

        {/* Main Tab Navigation */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isAdmin={userSession.role === 'admin'}
        />
      </div>

      {/* Main Active Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'calc_countertops' && (
          <CountertopCalculator
            manufacturers={manufacturers}
            decors={decors}
            embossings={embossings}
            panelSizes={panelSizes}
            thicknesses={thicknesses}
            currencies={currencies}
            settings={countertopSettings}
            productTypes={productTypes}
            selectedCurrency={selectedCurrency}
          />
        )}

        {activeTab === 'calc_partitions' && (
          <PartitionCalculator
            manufacturers={manufacturers}
            currencies={currencies}
            services={services}
            selectedCurrency={selectedCurrency}
          />
        )}

        {activeTab === 'calc_subsystem' && (
          <SubsystemCalculator
            currencies={currencies}
            selectedCurrency={selectedCurrency}
          />
        )}

        {activeTab === 'calc_cutting' && (
          <CuttingCalculator
            currencies={currencies}
            selectedCurrency={selectedCurrency}
            decors={decors}
            panelSizes={panelSizes}
            manufacturers={manufacturers}
          />
        )}

        {activeTab === 'calc_septic' && (
          <SepticCalculator
            currencies={currencies}
            selectedCurrency={selectedCurrency}
          />
        )}

        {activeTab === 'pricelist' && (
          <PriceListCountertops
            decors={decors}
            manufacturers={manufacturers}
            embossings={embossings}
            panelSizes={panelSizes}
            thicknesses={thicknesses}
            currencies={currencies}
            selectedCurrency={selectedCurrency}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            userSession={userSession}
            currencies={currencies}
            selectedCurrency={selectedCurrency}
            onSelectCurrency={setSelectedCurrency}
            onUpdateCurrencyRate={handleUpdateCurrencyRate}
            onAddCurrency={handleAddCurrency}
            onDeleteCurrency={handleDeleteCurrency}
            onRefreshRates={handleRefreshRates}
            isRefreshingRates={isRefreshingRates}
            manufacturers={manufacturers}
            onAddManufacturer={handleAddManufacturer}
            onUpdateManufacturer={handleUpdateManufacturer}
            onDeleteManufacturer={handleDeleteManufacturer}
            decors={decors}
            onAddDecor={handleAddDecor}
            onDeleteDecor={handleDeleteDecor}
            panelSizes={panelSizes}
            onAddPanelSize={handleAddPanelSize}
            onDeletePanelSize={handleDeletePanelSize}
            thicknesses={thicknesses}
            onAddThickness={handleAddThickness}
            onDeleteThickness={handleDeleteThickness}
            embossings={embossings}
            onAddEmbossing={handleAddEmbossing}
            onUpdateEmbossing={handleUpdateEmbossing}
            onDeleteEmbossing={handleDeleteEmbossing}
            services={services}
            onAddService={handleAddService}
            onDeleteService={handleDeleteService}
            suppliers={suppliers}
            organization={organization}
            onUpdateOrganization={setOrganization}
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} {organization.fullName || 'STCCalc'} — Расчётный комплекс для HPL и компакт-плит.</p>
          <p className="mt-1 text-slate-400 font-medium">Тел: {organization.phone} | Email: {organization.email} | Сайт: {organization.website}</p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={setUserSession}
      />

    </div>
  );
};
