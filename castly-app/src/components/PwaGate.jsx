import React, { useEffect, useState } from 'react';

const PwaGate = ({ children }) => {
  const [showBlocker, setShowBlocker] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInstalled = window.navigator.standalone === true 
                      || window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isInstalled) {
      setShowBlocker(true);
    }
  }, []);

  if (showBlocker) {
    return (
      <div className="pwa-gate-container">
        <div className="pwa-gate-content">
          <img src="/favicon.svg" alt="Cloud" className="pwa-gate-icon" />
          
          <h1 className="pwa-gate-title">Добро пожаловать!</h1>
          <p className="pwa-gate-text">
            Чтобы веб-приложение функционировало без сбоев, добавьте его на главный экран вашего смартфона
          </p>
          
          <h2 className="pwa-gate-subtitle">Как это сделать?</h2>
          <ol className="pwa-gate-list">
            <li>Нажмите кнопку «Поделиться» внизу экрана (квадрат со стрелкой вверх).</li>
            <li>Прокрутите вниз и выберите «На экран „Домой“».</li>
            <li>Нажмите «Добавить»</li>
            <li>Перейдите в веб-приложения, нажав на иконку cast.ly на экране «Домой»</li>
          </ol>
        </div>
      </div>
    );
  }

  // Пропускаем пользователя дальше, если проверки пройдены
  return children;
};

export default PwaGate;