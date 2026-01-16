// Firebase v9+ modular SDK
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

class FirebaseAuthBackend {
  constructor(firebaseConfig) {
    if (firebaseConfig) {
      // Initialize Firebase v9+
      if (!getApps().length) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApp();
      }

      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.storage = getStorage(this.app);
      this.functions = getFunctions(this.app);

      // Segunda instância para criar usuários sem fazer login automático
      this.secondaryApp = initializeApp(firebaseConfig, 'Secondary');
      this.secondaryAuth = getAuth(this.secondaryApp);

      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          try {
            const current = JSON.parse(localStorage.getItem("authUser") || "{}");
            const sessionKey =
              (current?.tenantSlug && current?.branchSlug && `session-${current.tenantSlug}-${current.branchSlug}`) ||
              Object.keys(localStorage).find(k => k.startsWith("session-"));
            const sessionData = sessionKey ? JSON.parse(localStorage.getItem(sessionKey) || "{}") : {};

            const staffName = sessionData?.staff
              ? [sessionData.staff.firstName, sessionData.staff.lastName].filter(Boolean).join(" ")
              : null;

            const enriched = {
              ...sessionData,
              ...current,
              uid: user.uid,
              email: user.email,
              displayName:
                staffName ||
                sessionData.displayName ||
                current.displayName ||
                user.displayName ||
                sessionData?.staff?.firstName ||
                user.email,
              photoURL: sessionData?.staff?.photoUrl || user.photoURL || current.photoURL || sessionData.photoUrl,
              photoUrl: sessionData?.staff?.photoUrl || user.photoURL || current.photoUrl || sessionData.photoUrl,
            };

            localStorage.setItem("authUser", JSON.stringify(enriched));
          } catch (e) {
            localStorage.setItem("authUser", JSON.stringify(user));
          }
        } else {
          localStorage.removeItem("authUser");
        }
      });
    }
  }

  /**
   * Registers the user with given details
   */
  registerUser = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw this._handleError(error);
    }
  };

  /**
   * Cria usuário sem fazer login automático (usa instância secundária)
   * Ideal para admins criarem novos usuários sem perder a sessão
   */
  createUserWithoutLogin = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.secondaryAuth, email, password);
      const user = userCredential.user;

      // Fazer logout da instância secundária imediatamente
      await signOut(this.secondaryAuth);

      return user;
    } catch (error) {
      throw this._handleError(error);
    }
  };

  /**
   * Registers the user with given details
   */
  editProfileAPI = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw this._handleError(error);
    }
  };

  /**
   * Login user with given details
   */
  loginUser = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw this._handleError(error);
    }
  };

  /**
   * forget Password user with given details
   */
  forgetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(this.auth, email, {
        url: window.location.protocol + "//" + window.location.host + "/login",
      });
      return true;
    } catch (error) {
      throw this._handleError(error);
    }
  };

  /**
   * Logout the user
   */
  logout = async () => {
    try {
      await signOut(this.auth);
      return true;
    } catch (error) {
      throw this._handleError(error);
    }
  };

  /**
  * Social Login user with given details
  */

  socialLoginUser = async (type) => {
    let provider;
    if (type === "google") {
      provider = new GoogleAuthProvider();
    } else if (type === "facebook") {
      provider = new FacebookAuthProvider();
    }
    try {
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      throw this._handleError(error);
    }
  };

  addNewUserToFirestore = async (user) => {
    const { profile } = user.additionalUserInfo;
    const details = {
      firstName: profile.given_name ? profile.given_name : profile.first_name,
      lastName: profile.family_name ? profile.family_name : profile.last_name,
      fullName: profile.name,
      email: profile.email,
      picture: profile.picture,
      createdDtm: serverTimestamp(),
      lastLoginTime: serverTimestamp()
    };
    const userRef = doc(this.db, "users", this.auth.currentUser.uid);
    await setDoc(userRef, details);
    return { user, details };
  };

  setLoggeedInUser = user => {
    localStorage.setItem("authUser", JSON.stringify(user));
  };

  /**
   * Returns the authenticated user
   */
  getAuthenticatedUser = () => {
    if (!localStorage.getItem("authUser")) return null;
    return JSON.parse(localStorage.getItem("authUser"));
  };

  /**
   * Handle the error
   * @param {*} error
   */
  _handleError(error) {
    // var errorCode = error.code;
    var errorMessage = error.message;
    return errorMessage;
  }

  getDb = () => this.db;
  getAuth = () => this.auth;
  getStorage = () => this.storage;
  getFunctions = () => this.functions;
}

let _fireBaseBackend = null;

/**
 * Initilize the backend
 * @param {*} config
 */
const initFirebaseBackend = config => {
  if (!_fireBaseBackend) {
    _fireBaseBackend = new FirebaseAuthBackend(config);
  }
  return _fireBaseBackend;
};

/**
 * Returns the firebase backend
 */
const getFirebaseBackend = () => {
  return _fireBaseBackend;
};

const getFirebaseServices = () => {
  const backend = getFirebaseBackend();
  if (!backend) {
    return { db: null, auth: null, storage: null };
  }
  return { db: backend.getDb(), auth: backend.getAuth(), storage: backend.getStorage() };
};

const onAuthStateChangedListener = (callback) => {
  const { auth } = getFirebaseServices();
  if (!auth) return () => { };
  return onAuthStateChanged(auth, callback);
};

export { initFirebaseBackend, getFirebaseBackend, getFirebaseServices, onAuthStateChangedListener };

// Exports adicionais para uso direto nos módulos
export const getFirebaseDb = () => {
  const backend = getFirebaseBackend();
  return backend ? backend.getDb() : null;
};

export const getFirebaseAuth = () => {
  const backend = getFirebaseBackend();
  return backend ? backend.getAuth() : null;
};

export const getFirebaseStorage = () => {
  const backend = getFirebaseBackend();
  return backend ? backend.getStorage() : null;
};

export const getFirebaseFunctions = () => {
  const backend = getFirebaseBackend();
  return backend ? backend.getFunctions() : null;
};
