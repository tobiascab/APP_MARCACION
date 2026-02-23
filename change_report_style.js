const fs = require('fs');
let content = fs.readFileSync('/home/reductoasistencia/frontend/src/pages/AdminPanel.jsx', 'utf8');

// Replace padding for cabecera corporativa
content = content.replace(/padding: '3rem', borderBottom: '1px solid #e2e8f0'/g, "padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0'");
content = content.replace(/padding: '2rem 3rem', background: '#f8fafc'/g, "padding: '1rem 2rem', background: '#f8fafc'");

// Reduce font sizes for headers
content = content.replace(/fontSize: '1\.75rem'/g, "fontSize: '1.4rem'");
content = content.replace(/letterSpacing: '2px', textTransform: 'uppercase'/g, "letterSpacing: '1px', textTransform: 'uppercase'");
content = content.replace(/fontSize: '1\.1rem'/g, "fontSize: '0.95rem'");
content = content.replace(/fontSize: '2rem'/g, "fontSize: '1.4rem'");

// Subheader labels
content = content.replace(/fontSize: '0\.75rem', color: '#64748b', textTransform/g, "fontSize: '0.65rem', color: '#64748b', textTransform");

// Tables style
content = content.replace(/fontSize: '0\.9rem'/g, "fontSize: '0.8rem'");
content = content.replace(/padding: '1rem'/g, "padding: '0.5rem 0.75rem'");

// Adjust main container top padding
content = content.replace(/padding: '8rem 2rem'/g, "padding: '4rem 2rem'");

// Change PIE DE PAGINA OFICIAL
content = content.replace(/padding: '2rem 3rem', borderTop/g, "padding: '1rem 2rem', borderTop");

fs.writeFileSync('/home/reductoasistencia/frontend/src/pages/AdminPanel.jsx', content);
