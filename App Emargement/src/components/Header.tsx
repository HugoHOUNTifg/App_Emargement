import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <i className="fas fa-file-signature header-icon"></i>
        <h1>Générateur de Feuille d'Émargement</h1>
        <p>Créez vos feuilles d'émargement en quelques clics</p>
      </div>
    </header>
  );
};

export default Header; 