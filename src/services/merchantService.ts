import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Merchant {
  id: string;
  name: string;
  category: string;
  address: string;
  barangay: string;
  rating: number;
  isOpen: boolean;
  openHours: string;
  isVerified: boolean;
  isFeatured: boolean;
  image?: string;
  description?: string;
  deliveryFee?: number;
  isArchived?: boolean; // New field
}

export const subscribeToMerchants = (callback: (merchants: Merchant[]) => void) => {
  const q = query(collection(db, 'merchants'), orderBy('name', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const merchants: Merchant[] = [];
    snapshot.forEach((docSnap) => {
      merchants.push({ id: docSnap.id, ...docSnap.data() } as Merchant);
    });
    callback(merchants);
  });
};

export const addMerchant = async (data: Omit<Merchant, 'id'>) => {
  const merchantsRef = collection(db, 'merchants');
  await addDoc(merchantsRef, {
    ...data,
    isOpen: true,
    rating: 4.5, // Initial rating
    isVerified: true,
    isFeatured: false,
    isArchived: false,
    createdAt: new Date().toISOString()
  });
};

export const updateMerchant = async (id: string, data: Partial<Merchant>) => {
  const merchantRef = doc(db, 'merchants', id);
  await updateDoc(merchantRef, data);
};

export const updateMerchantStatus = async (id: string, isOpen: boolean) => {
  const merchantRef = doc(db, 'merchants', id);
  await updateDoc(merchantRef, { isOpen });
};

export const toggleMerchantVerification = async (id: string, isVerified: boolean) => {
  const merchantRef = doc(db, 'merchants', id);
  await updateDoc(merchantRef, { isVerified });
};

export const archiveMerchant = async (id: string) => {
  const merchantRef = doc(db, 'merchants', id);
  await updateDoc(merchantRef, { isArchived: true, isOpen: false });
};

export const restoreMerchant = async (id: string) => {
  const merchantRef = doc(db, 'merchants', id);
  await updateDoc(merchantRef, { isArchived: false });
};

export const deleteMerchant = async (id: string) => {
  const merchantRef = doc(db, 'merchants', id);
  await deleteDoc(merchantRef);
};
