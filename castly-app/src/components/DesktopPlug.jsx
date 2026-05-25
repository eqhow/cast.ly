import React from 'react';

export default function DesktopPlug() {
  return (
    <div className="desktop-plug-wrapper">
      <div className="desktop-plug-content">
        {/* Иконка логотипа приложения */}
        <img 
          src="/favicon.svg" 
          alt="castly icon" 
          className="plug-icon-img" 
        />
        
        <h1 className="plug-logo">castly</h1>
        <p className="plug-text">
          Сервис доступен только на мобильных устройствах.
        </p>
      </div>
    </div>
  );
}