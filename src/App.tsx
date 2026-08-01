import React, { useState, useEffect } from 'react';
import { TabType, Currency, Manufacturer, Embossing, PanelSize, PanelThickness, PanelFormat, CountertopSettings, ProductType, Service, Supplier, OrganizationSettings, UserAccount, UserSession } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { CountertopCalculator } from './components/calculators/CountertopCalculator';
import { PartitionCalculator } from './components/calculators/PartitionCalculator';
import { SubsystemCalculator } from './components/calculators/SubsystemCalculator';
import { CuttingCalculator } from './components/calculators/CuttingCalculator';
import { PriceListCountertops } from './components/pricelist/PriceListCountertops';
import { AdminPanel } from './components/admin/AdminPanel';
import { LoginModal } from './components/auth/LoginModal';
import { fetchCbrRates } from './services/cbrRates';
import {
  subscribeToMasterData,
  saveMasterDataToFirestore,
  resetMasterDataInFirestore,
  MasterData
} from './lib/firebase';
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
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Auth Session
  const [userSession, setUserSession] = useState<UserSession>({
    isLoggedIn: true,
    username: 'admin',
    role: 'admin',
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // App Master Datasets synced with Firestore database
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

  // Initial Firestore real-time subscription
  useEffect(() => {
    const seedData: MasterData = {
      currencies: initialCurrencies,
      manufacturers: initialManufacturers,
      embossings: initialEmbossings,
      panelSizes: initialPanelSizes,
      thicknesses: initialThicknesses,
      decors: initialDecors,
      countertopSettings: initialCountertopSettings,
      productTypes: initialProductTypes,
      services: initialServices,
      suppliers: initialSuppliers,
      organization: initialOrganization,
      users: initialUsers,
      selectedCurrency: 'RUB',
    };

    const unsubscribe = subscribeToMasterData(seedData, (data) => {
      if (data.currencies) setCurrencies(data.currencies);
      if (data.manufacturers) setManufacturers(data.manufacturers);
      if (data.embossings) setEmbossings(data.embossings);
      if (data.panelSizes) setPanelSizes(data.panelSizes);
      if (data.thicknesses) setThicknesses(data.thicknesses);
      if (data.decors) setDecors(data.decors);
      if (data.countertopSettings) setCountertopSettings(data.countertopSettings);
      if (data.productTypes) setProductTypes(data.productTypes);
      if (data.services) setServices(data.services);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.organization) setOrganization(data.organization);
      if (data.users) setUsers(data.users);
      if (data.selectedCurrency) setSelectedCurrency(data.selectedCurrency);
      setIsCloudSynced(true);
    });

    return () => unsubscribe();
  }, []);

  // Reset to Factory Default Data in Firestore
  const handleResetAllData = async () => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные системы в базе данных Firestore к исходным? Все изменения будут удалены.')) {
      const seedData: MasterData = {
        currencies: initialCurrencies,
        manufacturers: initialManufacturers,
        embossings: initialEmbossings,
        panelSizes: initialPanelSizes,
        thicknesses: initialThicknesses,
        decors: initialDecors,
        countertopSettings: initialCountertopSettings,
        productTypes: initialProductTypes,
        services: initialServices,
        suppliers: initialSuppliers,
        organization: initialOrganization,
        users: initialUsers,
        selectedCurrency: 'RUB',
      };
      
      try {
        await resetMasterDataInFirestore(seedData);
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
        alert('База данных успешно сброшена к исходным настройкам!');
      } catch (err) {
        console.error('Error resetting database:', err);
        alert('Ошибка при сбросе базы данных');
      }
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
        setCurrencies(prev => {
          const updated = prev.map(c => {
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
          });
          saveMasterDataToFirestore({ currencies: updated });
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to update rates from CBR:', err);
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handleRefreshRates = () => {
    loadLiveCbrRates();
  };

  const handleSelectCurrency = (code: string) => {
    setSelectedCurrency(code);
    saveMasterDataToFirestore({ selectedCurrency: code });
  };

  const handleUpdateCurrencyRate = (code: string, newRate: number) => {
    setCurrencies(prev => {
      const updated = prev.map(c => c.code === code ? { ...c, rateToRub: newRate } : c);
      saveMasterDataToFirestore({ currencies: updated });
      return updated;
    });
  };

  const handleAddCurrency = (newCurr: Currency) => {
    setCurrencies(prev => {
      const exists = prev.some(c => c.code === newCurr.code);
      const updated = exists 
        ? prev.map(c => c.code === newCurr.code ? { ...c, ...newCurr } : c)
        : [...prev, newCurr];
      saveMasterDataToFirestore({ currencies: updated });
      return updated;
    });
  };

  const handleDeleteCurrency = (code: string) => {
    if (code === 'RUB') return;
    setCurrencies(prev => {
      const updated = prev.filter(c => c.code !== code);
      saveMasterDataToFirestore({ currencies: updated });
      return updated;
    });
    if (selectedCurrency === code) {
      handleSelectCurrency('RUB');
    }
  };

  const handleAddManufacturer = (mfg: Omit<Manufacturer, 'id'>) => {
    setManufacturers(prev => {
      const updated = [...prev, { id: Date.now(), ...mfg }];
      saveMasterDataToFirestore({ manufacturers: updated });
      return updated;
    });
  };

  const handleDeleteManufacturer = (id: number) => {
    setManufacturers(prev => {
      const updated = prev.filter(m => m.id !== id);
      saveMasterDataToFirestore({ manufacturers: updated });
      return updated;
    });
  };

  const handleUpdateManufacturer = (updatedMfg: Manufacturer) => {
    setManufacturers(prev => {
      const updated = prev.map(m => m.id === updatedMfg.id ? updatedMfg : m);
      saveMasterDataToFirestore({ manufacturers: updated });
      return updated;
    });
  };

  const handleAddDecor = (decor: Omit<PanelFormat, 'id'>) => {
    setDecors(prev => {
      const updated = [{ id: Date.now(), ...decor }, ...prev];
      saveMasterDataToFirestore({ decors: updated });
      return updated;
    });
  };

  const handleDeleteDecor = (id: number) => {
    setDecors(prev => {
      const updated = prev.filter(d => d.id !== id);
      saveMasterDataToFirestore({ decors: updated });
      return updated;
    });
  };

  const handleAddThickness = (thickness: number) => {
    if (!thickness || thickness <= 0) return;
    setThicknesses(prev => {
      const newThick: PanelThickness = { id: Date.now(), thickness, isActive: true };
      const updated = [...prev, newThick].sort((a, b) => a.thickness - b.thickness);
      saveMasterDataToFirestore({ thicknesses: updated });
      return updated;
    });
  };

  const handleDeleteThickness = (id: number) => {
    setThicknesses(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveMasterDataToFirestore({ thicknesses: updated });
      return updated;
    });
  };

  const handleAddPanelSize = (size: Omit<PanelSize, 'id'>) => {
    setPanelSizes(prev => {
      const updated = [...prev, { id: Date.now(), ...size }];
      saveMasterDataToFirestore({ panelSizes: updated });
      return updated;
    });
  };

  const handleDeletePanelSize = (id: number) => {
    setPanelSizes(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveMasterDataToFirestore({ panelSizes: updated });
      return updated;
    });
  };

  const handleAddEmbossing = (emb: Omit<Embossing, 'id'>) => {
    setEmbossings(prev => {
      const updated = [...prev, { id: Date.now(), ...emb }];
      saveMasterDataToFirestore({ embossings: updated });
      return updated;
    });
  };

  const handleUpdateEmbossing = (updatedEmb: Embossing) => {
    setEmbossings(prev => {
      const updated = prev.map(e => e.id === updatedEmb.id ? updatedEmb : e);
      saveMasterDataToFirestore({ embossings: updated });
      return updated;
    });
  };

  const handleDeleteEmbossing = (id: number) => {
    setEmbossings(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveMasterDataToFirestore({ embossings: updated });
      return updated;
    });
  };

  const handleAddService = (srv: Omit<Service, 'id'>) => {
    setServices(prev => {
      const updated = [...prev, { id: Date.now(), ...srv }];
      saveMasterDataToFirestore({ services: updated });
      return updated;
    });
  };

  const handleDeleteService = (id: number) => {
    setServices(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveMasterDataToFirestore({ services: updated });
      return updated;
    });
  };

  const handleUpdateOrganization = (updatedOrg: OrganizationSettings) => {
    setOrganization(updatedOrg);
    saveMasterDataToFirestore({ organization: updatedOrg });
  };

  const handleAddUser = (user: Omit<UserAccount, 'id' | 'createdAt'>) => {
    setUsers(prev => {
      const newUser: UserAccount = {
        id: Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
        ...user
      };
      const updated = [newUser, ...prev];
      saveMasterDataToFirestore({ users: updated });
      return updated;
    });
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === updatedUser.id ? updatedUser : u);
      saveMasterDataToFirestore({ users: updated });
      return updated;
    });
  };

  const handleDeleteUser = (id: number) => {
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      saveMasterDataToFirestore({ users: updated });
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Sticky Header & Navigation Container */}
      <div className="sticky top-0 z-30 no-print shadow-md">
        {/* App Header */}
        <Header
          currencies={currencies}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={handleSelectCurrency}
          onRefreshRates={handleRefreshRates}
          isRefreshing={isRefreshingRates}
          userSession={userSession}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={() => setUserSession({ isLoggedIn: false, username: '', role: 'user' })}
          orgName={organization.fullName}
          isCloudSynced={isCloudSynced}
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

        {activeTab === 'admin' && userSession.role === 'admin' && (
          <AdminPanel
            userSession={userSession}
            currencies={currencies}
            manufacturers={manufacturers}
            embossings={embossings}
            panelSizes={panelSizes}
            thicknesses={thicknesses}
            decors={decors}
            services={services}
            suppliers={suppliers}
            organization={organization}
            users={users}
            onUpdateCurrencyRate={handleUpdateCurrencyRate}
            onAddCurrency={handleAddCurrency}
            onDeleteCurrency={handleDeleteCurrency}
            onAddManufacturer={handleAddManufacturer}
            onUpdateManufacturer={handleUpdateManufacturer}
            onDeleteManufacturer={handleDeleteManufacturer}
            onAddDecor={handleAddDecor}
            onDeleteDecor={handleDeleteDecor}
            onAddPanelSize={handleAddPanelSize}
            onDeletePanelSize={handleDeletePanelSize}
            onAddThickness={handleAddThickness}
            onDeleteThickness={handleDeleteThickness}
            onAddEmbossing={handleAddEmbossing}
            onUpdateEmbossing={handleUpdateEmbossing}
            onDeleteEmbossing={handleDeleteEmbossing}
            onAddService={handleAddService}
            onDeleteService={handleDeleteService}
            onUpdateOrganization={handleUpdateOrganization}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(session: UserSession) => {
          setUserSession(session);
          setIsLoginModalOpen(false);
        }}
      />
    </div>
  );
};
