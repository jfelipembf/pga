// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom"

/**
 * Mock global do Firebase para evitar inicialização real nos testes.
 * Os tests devem testar LÓGICA DE NEGÓCIO (domain rules, services) 
 * sem depender da infraestrutura Firebase.
 */

// Mock do firebase/app
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(() => ({})),
    getApps: jest.fn(() => []),
    getApp: jest.fn(() => ({})),
}))

// Mock do firebase/auth
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({})),
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    FacebookAuthProvider: jest.fn(),
    signInWithPopup: jest.fn(),
}))

// Mock do firebase/firestore
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    serverTimestamp: jest.fn(() => new Date().toISOString()),
    Timestamp: {
        now: jest.fn(() => ({ toDate: () => new Date() })),
        fromDate: jest.fn((d) => ({ toDate: () => d })),
    },
}))

// Mock do firebase/storage
jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(() => ({})),
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
}))

// Mock do firebase_helper (inicialização)
jest.mock('./helpers/firebase_helper', () => ({
    initFirebaseBackend: jest.fn(),
    getFirebaseBackend: jest.fn(() => ({
        getAuthenticatedUser: jest.fn(),
        loginUser: jest.fn(),
        logout: jest.fn(),
    })),
}))

// Mock do firebase_config
jest.mock('./helpers/firebase_config', () => ({
    firebaseConfig: {
        apiKey: 'test-api-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.appspot.com',
        messagingSenderId: '123456',
        appId: '1:123456:web:abcdef',
    },
}))

// Suprimir warnings do console durante os testes (opcional)
const originalWarn = console.warn
beforeAll(() => {
    console.warn = (...args) => {
        // Filtrar warnings do Firebase
        if (args[0]?.includes?.('Firebase')) return
        originalWarn(...args)
    }
})
afterAll(() => {
    console.warn = originalWarn
})
