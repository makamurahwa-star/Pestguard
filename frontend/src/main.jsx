import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PestDataProvider } from './context/PestDataContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PestDataProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1f441f',
                color: '#f0f7f0',
                borderRadius: '14px',
                padding: '12px 18px',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '14px',
                boxShadow: '0 8px 32px -8px rgba(23, 51, 23, 0.3)',
              },
              success: { iconTheme: { primary: '#b7d8b7', secondary: '#1f441f' } },
              error: {
                style: { background: '#a83820', color: '#fdf3f0' },
                iconTheme: { primary: '#fbe1d9', secondary: '#a83820' },
              },
            }}
          />
        </PestDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
