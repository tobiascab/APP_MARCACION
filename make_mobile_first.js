const fs = require('fs');
let css = fs.readFileSync('/home/reductoasistencia/frontend/src/pages/AdminPanel.css', 'utf8');

if (!css.includes("/* Mobile Forms & Targets Enhancement */")) {
    css += `
/* Mobile Forms & Targets Enhancement */
@media (max-width: 768px) {
    .btn, .action-btn, button, .input, input, select {
        min-height: 44px; /* Apple UI Guidelines */
    }
    .form-group input, .form-group select {
        height: 52px;
        font-size: 16px; /* Para prevenir auto-zoom en inputs en iOS */
    }
    .modal-content {
        padding-bottom: 2rem; /* Safe area pseudo-fix for mobile */
    }
    .card, .stat-card {
        padding: 1rem;
        border-radius: 16px;
    }
    .admin-main {
        padding: 4rem 1rem 1rem 1rem !important; /* Quitar margenes excesivos laterales que comen pantalla en movil */
    }
    h1 {
        font-size: 1.5rem !important;
    }
    
    .table-container {
        border-radius: 12px;
    }
    
    .data-table th, .data-table td {
        padding: 12px 10px;
        font-size: 0.8rem;
    }

    /* Swipeable Sidebar Adjustments */
    .admin-sidebar {
        width: 80% !important;
        max-width: 320px !important;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        transform: translateX(-100%);
        left: 0 !important;
    }

    .admin-sidebar.mobile-open {
        transform: translateX(0);
        left: 0 !important;
    }
}
`;
    fs.writeFileSync('/home/reductoasistencia/frontend/src/pages/AdminPanel.css', css);
} else {
    // Modify existing string
    css = css.replace("transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);", "transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s; transform: translateX(-100%); left:0;");
    css = css.replace(".admin-sidebar.mobile-open {\n        left: 0;\n    }", ".admin-sidebar.mobile-open {\n        transform: translateX(0);\n        box-shadow: 10px 0 25px rgba(0,0,0,0.5);\n    }");

    fs.writeFileSync('/home/reductoasistencia/frontend/src/pages/AdminPanel.css', css);
}

