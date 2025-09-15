export interface User {
  email: string | null;
  uid: string | null;
  name: string | null;
  photoURL: string | null;
  // Add other user properties as needed (displayName, photoURL, etc.)
}

export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
}

export interface ImageType {
  id: string;
  url: string;
  timeframe?: string; // optional timeframe per trade image
  description?: string; // optional description
  file?: File; // transient local file reference before upload
}

export interface UIState {
  selectedItem: string | null;
  isDetailsOpen: boolean;
  isEditOpen: boolean;
  filteredTradeIds: string[];
}

// AWS API types
export * from './trade-aws'
