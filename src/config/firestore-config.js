import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAW_9_9rbsUoB5ZVmJRgSrxqOS3WHwHOS8",
  authDomain: "maps-aee8b.firebaseapp.com",
  projectId: "maps-aee8b",
  storageBucket: "maps-aee8b.appspot.com",
  messagingSenderId: "557741465789",
  appId: "1:557741465789:web:f91c685e19cde5adadd7d4",
  measurementId: "G-T155CVR3X3"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)