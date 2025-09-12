import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
    UserCredential,
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Tourist } from '../types';

export class FirebaseAuthService {
  // Authentication methods
  async register(userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phoneNumber?: string;
    emergencyContact?: string;
    nationality?: string;
    passportNumber?: string;
  }): Promise<{ user: Tourist; token: string }> {
    try {
      console.log('🚀 Firebase Registration:', userData.email);
      
      // Create user with email and password
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      const user = userCredential.user;
      
      // Update user profile
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });
      
      // Create user document in Firestore
      const userDoc: Tourist = {
        id: user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber || '',
        emergencyContact: userData.emergencyContact || '',
        nationality: userData.nationality || '',
        passportNumber: userData.passportNumber || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        lastLocation: null,
        safetyScore: 10,
        emergencyContacts: [],
        preferences: {
          language: 'en',
          notifications: true,
          locationSharing: true,
          emergencyAlerts: true,
        },
      };
      
      await setDoc(doc(db, 'users', user.uid), userDoc);
      
      // Get Firebase token
      const token = await user.getIdToken();
      
      return { user: userDoc, token };
    } catch (error: any) {
      console.error('Firebase registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  async login(email: string, password: string): Promise<{ user: Tourist; token: string }> {
    try {
      console.log('🔐 Firebase Login:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data() as Tourist;
      const token = await user.getIdToken();
      
      return { user: userData, token };
    } catch (error: any) {
      console.error('Firebase login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Firebase logout error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Password reset failed');
    }
  }

  // User profile methods
  async updateProfile(updates: Partial<Tourist>): Promise<Tourist> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await updateDoc(userRef, updateData);
      
      // Get updated user document
      const userDoc = await getDoc(userRef);
      return userDoc.data() as Tourist;
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Profile update failed');
    }
  }

  async getCurrentUser(): Promise<Tourist | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) return null;
      
      return userDoc.data() as Tourist;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Auth state observer
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current Firebase user
  getCurrentFirebaseUser(): User | null {
    return auth.currentUser;
  }

  // Get ID token
  async getIdToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      
      return await user.getIdToken();
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();