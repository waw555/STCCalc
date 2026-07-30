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
  const [activeTab, setActiveTab] = useState<TabType>('calc_countertops');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('RUB');
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);

  // Auth Session
  const [userSession, setUserSession] = useState<UserSession>({
    isLoggedIn: true,
    username: 'admin',
    role: 'admin',
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // App Master Datasets
  const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(initialManufacturers);
  const [embossings, setEmbossings] = useState<Embossing[]>(initialEmbossings);
  const [panelSizes, setPanelSizes] = useState<PanelSize[]>(initialPanelSizes);
  const [thicknesses, setThicknesses] = useState<PanelThickness[]>(initialThicknesses);
  const [decors, setDecors] = useState<PanelFormat[]>(initialDecors);
  const [countertopSettings, setCountertopSettings] = useState<CountertopSettings>(initialCountertopSettings);
  const [productTypes, setProductTypes] = useState<ProductType[]>(initialProductTypes);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [organization, setOrganization] = useState<OrganizationSettings>(initialOrganization);
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);

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
