import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return React.createElement('div', { 
    style: { 
      padding: '50px', 
      textAlign: 'center',
      background: 'linear-gradient(135deg, #00264d, #004080)',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    } 
  }, [
    React.createElement('h1', { key: 'title' }, '🇳🇬 NIMC National ID System'),
    React.createElement('p', { key: 'subtitle' }, 'National Identity Management Commission'),
    React.createElement('div', { 
      key: 'login',
      style: { 
        background: 'white', 
        color: 'black', 
        padding: '30px', 
        borderRadius: '10px',
        maxWidth: '400px',
        margin: '50px auto'
      } 
    }, [
      React.createElement('h2', { key: 'login-title' }, 'Staff Login'),
      React.createElement('input', { 
        key: 'username',
        placeholder: 'Username',
        style: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px' }
      }),
      React.createElement('input', { 
        key: 'password',
        type: 'password',
        placeholder: 'Password', 
        style: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px' }
      }),
      React.createElement('button', { 
        key: 'login-btn',
        style: { width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
      }, 'Login to NIMC Portal')
    ])
  ]);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null,
    React.createElement(App)
  )
);
