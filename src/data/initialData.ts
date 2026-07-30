import { 
  Currency, 
  Manufacturer, 
  Embossing, 
  PanelFormat, 
  PanelSize, 
  PanelThickness, 
  CountertopSettings, 
  ProductType, 
  Service, 
  Supplier, 
  OrganizationSettings 
} from '../types';

export const initialCurrencies: Currency[] = [
  { code: 'RUB', name: 'Российский рубль', nominal: 1, rateToRub: 1.0, isActive: true, updatedAt: '2026-07-30 09:00' },
  { code: 'EUR', name: 'Евро', nominal: 1, rateToRub: 98.45, isActive: true, updatedAt: '2026-07-30 09:00' },
  { code: 'USD', name: 'Доллар США', nominal: 1, rateToRub: 89.20, isActive: true, updatedAt: '2026-07-30 09:00' },
];

export const initialManufacturers: Manufacturer[] = [
  { id: 1, fullName: 'Greenlam', countryOrigin: 'Индия', logoPath: '/uploads/manufacturers/293e806b3a19e07fb2736434.png', note: 'Компакт-плиты HPL премиум класса' },
  { id: 2, fullName: 'Gentas', countryOrigin: 'Турция', logoPath: '/uploads/manufacturers/a9ba000c45cc87ddadb15915.png', note: 'Фасадные и интерьерные панели' },
  { id: 3, fullName: 'Fundermax', countryOrigin: 'Австрия', logoPath: '/uploads/manufacturers/cabf99c73c774b9b3bdd830a.png', note: 'Австрийские влагостойкие панельные системы' },
  { id: 4, fullName: 'Abet Laminati', countryOrigin: 'Италия', logoPath: '/uploads/manufacturers/fa54bee57ba878d1c8afbdf1.png', note: 'Итальянский пластик высочайшего качества' },
];

export const initialEmbossings: Embossing[] = [
  { id: 1, name: 'Canyon', shortName: 'CN', manufacturerId: 2, imagePath: '/uploads/embossings/Greenlam_RKR.jpg', isActive: true, isStockProgram: true },
  { id: 2, name: 'Velur', shortName: 'VL', manufacturerId: 2, imagePath: '/uploads/embossings/Greenlam_SAT.jpg', isActive: true, isStockProgram: true },
  { id: 3, name: 'SUD Wood', shortName: 'SUD', manufacturerId: 1, imagePath: '/uploads/embossings/Greenlam_SUD.jpg', isActive: true, isStockProgram: true },
  { id: 4, name: 'Quartz', shortName: 'QTZ', manufacturerId: 1, imagePath: '/uploads/embossings/Greenlam_QTZ.jpg', isActive: true, isStockProgram: true },
  { id: 5, name: 'Satin Light', shortName: 'SAN', manufacturerId: 1, imagePath: '/uploads/embossings/Greenlam_SAN.jpg', isActive: true, isStockProgram: false },
  { id: 6, name: 'Super Gloss', shortName: 'SGL', manufacturerId: 1, imagePath: '/uploads/embossings/Greenlam_SGL.jpg', isActive: true, isStockProgram: false },
];

export const initialPanelSizes: PanelSize[] = [
  { id: 1, heightMm: 3050, widthMm: 1300, volumeM2: 3.965, manufacturerId: 1, isActive: true, isStockProgram: true },
  { id: 2, heightMm: 4100, widthMm: 1300, volumeM2: 5.33, manufacturerId: 1, isActive: true, isStockProgram: true },
  { id: 3, heightMm: 3050, widthMm: 1540, volumeM2: 4.697, manufacturerId: 2, isActive: true, isStockProgram: true },
  { id: 4, heightMm: 4100, widthMm: 1854, volumeM2: 7.601, manufacturerId: 3, isActive: true, isStockProgram: true },
];

export const initialThicknesses: PanelThickness[] = [
  { id: 1, thickness: 4.0, isActive: true },
  { id: 2, thickness: 6.0, isActive: true },
  { id: 3, thickness: 8.0, isActive: true },
  { id: 4, thickness: 10.0, isActive: true },
  { id: 5, thickness: 12.0, isActive: true },
  { id: 6, thickness: 13.0, isActive: true },
];

export const initialDecors: PanelFormat[] = [
  {
    id: 1,
    name: 'Gentas 3096 Canyon Wood',
    decorNumber: '3096',
    decorName: 'Canyon Wood',
    widthMm: 1300,
    heightMm: 3050,
    thicknessMm: 12,
    manufacturerId: 2,
    embossingId: 1,
    panelSizeId: 3,
    thicknessId: 5,
    cost: 58.00,
    costPerSheet: 272.31,
    pricePerM2: 85.00,
    pricePerSheet: 399.00,
    markup: 46.5,
    currency: 'EUR',
    decorPhotoPath: '/uploads/decors/Gentas_3096_CANYON.jpg',
    isStockDecor: true,
    isStockProgram: true,
    isActive: true,
    weightPerM2: 17.4
  },
  {
    id: 2,
    name: 'Gentas 3153 Velur Light',
    decorNumber: '3153',
    decorName: 'Velur Light',
    widthMm: 1300,
    heightMm: 3050,
    thicknessMm: 12,
    manufacturerId: 2,
    embossingId: 2,
    panelSizeId: 3,
    thicknessId: 5,
    cost: 62.00,
    costPerSheet: 291.09,
    pricePerM2: 92.00,
    pricePerSheet: 431.94,
    markup: 48.3,
    currency: 'EUR',
    decorPhotoPath: '/uploads/decors/Gentas_3153_VELUR.jpg',
    isStockDecor: true,
    isStockProgram: true,
    isActive: true,
    weightPerM2: 17.4
  },
  {
    id: 3,
    name: 'Gentas 3155 Canyon Dark',
    decorNumber: '3155',
    decorName: 'Canyon Dark',
    widthMm: 1300,
    heightMm: 4100,
    thicknessMm: 12,
    manufacturerId: 2,
    embossingId: 1,
    panelSizeId: 3,
    thicknessId: 5,
    cost: 60.00,
    costPerSheet: 319.80,
    pricePerM2: 89.00,
    pricePerSheet: 474.37,
    markup: 48.3,
    currency: 'EUR',
    decorPhotoPath: '/uploads/decors/Gentas_3155_CANYON.jpg',
    isStockDecor: true,
    isStockProgram: true,
    isActive: true,
    weightPerM2: 17.4
  },
  {
    id: 4,
    name: 'Greenlam 261 SUD Elm',
    decorNumber: '261',
    decorName: 'SUD Natural Elm',
    widthMm: 1300,
    heightMm: 3050,
    thicknessMm: 12,
    manufacturerId: 1,
    embossingId: 3,
    panelSizeId: 1,
    thicknessId: 5,
    cost: 54.00,
    costPerSheet: 214.11,
    pricePerM2: 79.00,
    pricePerSheet: 313.23,
    markup: 46.2,
    currency: 'EUR',
    decorPhotoPath: '/uploads/decors/Greenlam_261_SUD.jpg',
    isStockDecor: true,
    isStockProgram: true,
    isActive: true,
    weightPerM2: 17.4
  },
  {
    id: 5,
    name: 'Greenlam 275 ESD Metal',
    decorNumber: '275',
    decorName: 'ESD Brushed Metal',
    widthMm: 1300,
    heightMm: 4100,
    thicknessMm: 12,
    manufacturerId: 1,
    embossingId: 4,
    panelSizeId: 2,
    thicknessId: 5,
    cost: 68.00,
    costPerSheet: 362.44,
    pricePerM2: 99.00,
    pricePerSheet: 527.67,
    markup: 45.5,
    currency: 'EUR',
    decorPhotoPath: '/uploads/decors/Greenlam_275_ESD.jpg',
    isStockDecor: false,
    isStockProgram: true,
    isActive: true,
    weightPerM2: 17.4
  }
];

export const initialCountertopSettings: CountertopSettings = {
  kerfMm: 4.0,
  blankWidthMm: 600,
};

export const initialProductTypes: ProductType[] = [
  { typeKey: 'kitchen', name: 'Кухонная столешница', processingPerM: 12.00, minW: 450, maxW: 1854, minL: 150, maxL: 4100 },
  { typeKey: 'fartuk', name: 'Стеновая панель / Фартук', processingPerM: 9.00, minW: 150, maxW: 1000, minL: 300, maxL: 1400 },
  { typeKey: 'horeca', name: 'HoReCa (столешница для кафе)', processingPerM: 12.00, minW: 600, maxW: 1400, minL: 600, maxL: 1400 },
  { typeKey: 'bortik', name: 'Бортик / Плинтус', processingPerM: 12.00, minW: 50, maxW: 150, minL: 1360, maxL: 4100 },
];

export const initialServices: Service[] = [
  { id: 1, name: 'Прямой распил HPL панели', unit: 'м.п.', price: 250.00, currency: 'RUB', photoPath: '/uploads/services/0cc6cc523ac3b9527bcc6e8d.jpg' },
  { id: 2, name: 'Обработка кромки (фаска 45°)', unit: 'м.п.', price: 450.00, currency: 'RUB', photoPath: '/uploads/services/1de1cdadf4279fdf389cfac6.jpg' },
  { id: 3, name: 'Вырез под мойку / варочную панель', unit: 'шт.', price: 1200.00, currency: 'RUB', photoPath: '/uploads/services/29a673f6ed0319b25dc908a7.jpg' },
  { id: 4, name: 'Фрезеровка еврозапила (стык)', unit: 'компл.', price: 3500.00, currency: 'RUB', photoPath: '/uploads/services/3863c3d035e86f162bd3196b.jpg' },
  { id: 5, name: 'Сборка и монтаж сантехнической кабины', unit: 'м²', price: 1800.00, currency: 'RUB' },
];

export const initialSuppliers: Supplier[] = [
  { id: 1, companyName: 'HPL Комплект', products: 'Компакт-плиты, фурнитура STC, профили', address: 'г. Москва, ул. Производственная, 6', website: 'https://hpl-komplekt.ru', contacts: '+7 (495) 789-22-33' },
  { id: 2, companyName: 'Gentas Russia', products: 'Панели Gentas HPL', address: 'г. Санкт-Петербург, Московское шоссе, 25', website: 'https://gentas.ru', contacts: '+7 (812) 345-67-89' },
];

export const initialOrganization: OrganizationSettings = {
  fullName: 'ООО "СТК Композит"',
  shortName: 'ООО "СТК"',
  address: 'г. Москва, шоссе Энтузиастов, д. 56, стр. 3',
  city: 'Москва',
  phone: '+7 (495) 120-44-55',
  website: 'https://stc-hpl.ru',
  email: 'info@stc-hpl.ru',
  inn: '7720891234',
  ogrn: '1187746012345',
  bik: '044525225',
  bankName: 'АО "Альфа-Банк"',
  logoPath: '/uploads/organization/586fe780cafeea4baeeb0ea6.png'
};
