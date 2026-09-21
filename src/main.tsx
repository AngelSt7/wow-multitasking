import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './popup/App.tsx'
import { MultitaskingProvider } from './context/MultitaskingContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MultitaskingProvider>
      <App />
    </MultitaskingProvider>
  </React.StrictMode>,
)