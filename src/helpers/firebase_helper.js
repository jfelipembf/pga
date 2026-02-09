import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

class FirebaseAuthBackend {
  constructor(firebaseConfig) {
    if (firebaseConfig) {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);

      onAuthStateChanged(this.auth, user => {
        if (user) {
          const currentAuthUser = localStorage.getItem("authUser");
          if (currentAuthUser) {
            try {
              const parsedUser = JSON.parse(currentAuthUser);
              // Se o UID for o mesmo e já tivermos o campo 'role', não sobrescrevemos
              // pois o objeto no localStorage já está enriquecido com dados do Firestore (Saga)
              if (parsedUser.uid === user.uid && (parsedUser.role || parsedUser.firstName)) {
                return;
              }
            } catch (e) {
              // ignore
            }
          }
          // Só salva o básico se não houver nada ou se for troca de conta
          localStorage.setItem("authUser", JSON.stringify(user));
        } else {
          localStorage.removeItem("authUser");
        }
      });
    }
  }

  /**
   * Registers the user with given details
   */
  registerUser = (email, password) => {
    return new Promise((resolve, reject) => {
      createUserWithEmailAndPassword(this.auth, email, password)
        .then(
          userCredential => {
            resolve(userCredential.user);
          },
          error => {
            reject(this._handleError(error));
          }
        );
    });
  };

  /**
   * Edit profile (this seems to be a duplicate of registerUser in the original code, 
   * likely meant to be something else, but I'll maintain the signature)
   */
  editProfileAPI = (email, password) => {
    return this.registerUser(email, password);
  };

  /**
   * Login user with given details
   */
  loginUser = (email, password) => {
    return new Promise((resolve, reject) => {
      signInWithEmailAndPassword(this.auth, email, password)
        .then(
          userCredential => {
            resolve(userCredential.user);
          },
          error => {
            reject(this._handleError(error));
          }
        );
    });
  };

  /**
   * forget Password user with given details
   */
  forgetPassword = email => {
    return new Promise((resolve, reject) => {
      sendPasswordResetEmail(this.auth, email, {
        url: window.location.protocol + "//" + window.location.host + "/login",
      })
        .then(() => {
          resolve(true);
        })
        .catch(error => {
          reject(this._handleError(error));
        });
    });
  };

  /**
   * Logout the user
   */
  logout = () => {
    return new Promise((resolve, reject) => {
      signOut(this.auth)
        .then(() => {
          resolve(true);
        })
        .catch(error => {
          reject(this._handleError(error));
        });
    });
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

    await setDoc(doc(this.db, "users", this.auth.currentUser.uid), details);
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
    return error.message;
  }
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

export { initFirebaseBackend, getFirebaseBackend };
