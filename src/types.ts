export interface Currency {
  code: string;
  name: string;
  nominal: number;
  rateToRub: number;
  isActive: boolean;
  updatedAt?: string;
}

export interface Manufacturer {
  id: number;
  fullName: string;
  countryOrigin: string;
  logoPath?: string;
  note?: string;
}

export interface Embossing {
  id: number;
  name: string;
  shortName?: string;
  manufacturerId?: number;
  imagePath?: string;
  note?: string;
  isActive: boolean;
  isStockProgram: boolean;
}

export interface PanelFormat {
  id: number;
  name: string;
  decorNumber?: string;
  decorName?: string;
  widthMm: number;
  heightMm: number;
  thicknessMm?: number;
  manufacturerId?: number;
  embossingId?: number;
  panelSizeId?: number;
  thicknessId?: number;
  pricePerM2?: number;
  pricePerSheet?: number;
  cost?: number;
  costPerSheet?: number;
  markup?: number;
  currency: string;
  decorPhotoPath?: string;
  isStockDecor: boolean;
  isStockProgram: boolean;
  isActive: boolean;
  weightPerM2?: number;
}

export interface PanelSize {
  id: number;
  heightMm: number;
  widthMm: number;
  volumeM2?: number;
  manufacturerId?: number;
  isActive: boolean;
  isStockProgram: boolean;
}

export interface PanelThickness {
  id: number;
  thickness: number;
  isActive: boolean;
}

export interface CountertopSettings {
  kerfMm: number;
  blankWidthMm: number;
}

export interface ProductType {
  typeKey: string;
  name: string;
  processingPerM: number;
  minW: number;
  maxW: number;
  minL: number;
  maxL: number;
}

export interface CountertopItem {
  id: string;
  typeKey: string;
  typeName: string;
  widthMm: number;
  lengthMm: number;
  quantity: number;
  processingM: number;
  decorId?: number;
  note?: string;
}

export interface SavedCountertopCalc {
  id: number;
  objectName: string;
  title: string;
  totalRub: number;
  createdAt: string;
  payload: {
    items: CountertopItem[];
    manufacturerId?: number;
    decorId?: number;
    embossingId?: number;
    panelSizeId?: number;
    thicknessId?: number;
    costPerM2?: number;
    markupPercent?: number;
    currency?: string;
    rateToRub?: number;
  };
}

export interface PartitionItem {
  id: string;
  type: string; // cabinet, urinal, shower
  widthMm: number;
  heightMm: number;
  depthMm?: number;
  doorWidthMm?: number;
  quantity: number;
}

export interface SubsystemMaterial {
  id: number;
  name: string;
  unit: string;
  pricePerUnit: number;
  consumptionPerM2: number;
}

export interface Service {
  id: number;
  name: string;
  unit: string;
  price: number;
  currency: string;
  photoPath?: string;
}

export interface Supplier {
  id: number;
  companyName: string;
  products?: string;
  address?: string;
  website?: string;
  contacts?: string;
}

export interface OrganizationSettings {
  fullName: string;
  shortName: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  email: string;
  inn: string;
  ogrn: string;
  bik: string;
  bankName: string;
  logoPath?: string;
}

export interface UserSession {
  isLoggedIn: boolean;
  username: string;
  role: 'admin' | 'user';
}

export type TabType = 
  | 'calc_countertops'
  | 'calc_partitions'
  | 'calc_subsystem'
  | 'calc_cutting'
  | 'calc_septic'
  | 'pricelist'
  | 'admin';
