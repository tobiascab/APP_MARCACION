// Fix for sockjs-client (global is not defined)
if (typeof global === 'undefined') {
  window.global = window;
}

// Debugging: Catch global errors
window.onerror = function (message, source, lineno, colno, error) {
  console.error(error);
  // Optional: Alert on mobile to see the error
  if (window.innerWidth < 768) {
    // alert('Error: ' + message); 
  }
};
console.log('App Initialized v2');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { NotificationProvider } from './context/NotificationContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </StrictMode>,
)
