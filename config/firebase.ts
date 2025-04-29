import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCtOXxBah2JMg07PJx0c89TUJvQ8n7w8xU",
  authDomain: "outfit-genie-43a61.firebaseapp.com",
  databaseURL: "https://outfit-genie-43a61-default-rtdb.firebaseio.com",
  projectId: "outfit-genie-43a61",
  storageBucket: "outfit-genie-43a61.appspot.com",
  messagingSenderId: "937210777776",
  appId: "1:937210777776:web:YOUR_APP_ID" // Replace with your actual App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app); 