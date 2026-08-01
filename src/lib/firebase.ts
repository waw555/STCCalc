import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Currency,
  Manufacturer,
  Embossing,
  PanelSize,
  PanelThickness,
  PanelFormat,
  CountertopSettings,
  ProductType,
  Service,
  Supplier,
  OrganizationSettings,
  UserAccount
} from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface MasterData {
  currencies: Currency[];
  manufacturers: Manufacturer[];
  embossings: Embossing[];
  panelSizes: PanelSize[];
  thicknesses: PanelThickness[];
  decors: PanelFormat[];
  countertopSettings: CountertopSettings;
  productTypes: ProductType[];
  services: Service[];
  suppliers: Supplier[];
  organization: OrganizationSettings;
  users: UserAccount[];
  selectedCurrency?: string;
}

export const MASTER_DATA_DOC = doc(db, 'app_data', 'master');
export const CALCULATOR_DATA_DOC = doc(db, 'app_data', 'calculators');

/**
 * Subscribe to master app datasets from Firestore in real time.
 * If the document does not exist yet, initializes it with seedData.
 */
export function subscribeToMasterData(
  seedData: MasterData,
  onUpdate: (data: MasterData) => void
) {
  let isInitialCheckDone = false;

  const unsubscribe = onSnapshot(
    MASTER_DATA_DOC,
    async (snapshot) => {
      if (!snapshot.exists()) {
        if (!isInitialCheckDone) {
          isInitialCheckDone = true;
          console.log('Seeding initial master data to Firestore database...');
          try {
            await setDoc(MASTER_DATA_DOC, seedData);
            onUpdate(seedData);
          } catch (err) {
            console.error('Error seeding initial Firestore data:', err);
          }
        }
      } else {
        isInitialCheckDone = true;
        const data = snapshot.data() as MasterData;
        onUpdate(data);
      }
    },
    (error) => {
      console.error('Firestore onSnapshot error:', error);
    }
  );

  return unsubscribe;
}

/**
 * Save updated master fields to Firestore
 */
export async function saveMasterDataToFirestore(partialData: Partial<MasterData>) {
  try {
    await setDoc(MASTER_DATA_DOC, partialData, { merge: true });
  } catch (err) {
    console.error('Failed to save data to Firestore database:', err);
    throw err;
  }
}

/**
 * Reset all master datasets in Firestore back to factory initial data
 */
export async function resetMasterDataInFirestore(initialData: MasterData) {
  try {
    await setDoc(MASTER_DATA_DOC, initialData);
  } catch (err) {
    console.error('Failed to reset Firestore data:', err);
    throw err;
  }
}

/**
 * Subscribe to calculator persistent states (saved countertop calculations, cutting, partitions, subsystem, septic)
 */
export function subscribeToCalculatorData(
  onUpdate: (data: Record<string, any>) => void
) {
  return onSnapshot(
    CALCULATOR_DATA_DOC,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data());
      }
    },
    (error) => {
      console.error('Firestore calculator data onSnapshot error:', error);
    }
  );
}

/**
 * Save individual calculator key-value state to Firestore
 */
export async function saveCalculatorStateToFirestore(key: string, value: any) {
  try {
    await setDoc(CALCULATOR_DATA_DOC, { [key]: value }, { merge: true });
  } catch (err) {
    console.error(`Failed to save calculator state "${key}" to Firestore:`, err);
  }
}
