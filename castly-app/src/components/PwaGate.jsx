import React, { useEffect, useState } from 'react';

const PwaGate = ({ children }) => {
  const [showBlocker, setShowBlocker] = useState(false);

  useEffect(() => {
    // Проверка устройства iOS и режима запуска (Standalone / Экран «Домой»)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInstalled = window.navigator.standalone === true 
                      || window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isInstalled) {
      setShowBlocker(true);
    }
  }, []);

  // Интерфейс блокировщика для Safari на iOS
  if (showBlocker) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <h1 style={styles.title}>CastLy</h1>
          <p style={styles.text}>Это приложение работает ТОЛЬКО при добавлении на рабочий экран.</p>
          
          <div style={styles.instruction}>
            <p>Чтобы продолжить:</p>
            <ol style={styles.list}>
              <li>Нажмите кнопку <b>«Поделиться»</b> внизу экрана (квадрат со стрелкой вверх).</li>
              <li>Прокрутите вниз и выберите <b>«На экран „Домой“»</b>.</li>
              <li>Нажмите <b>«Добавить»</b></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Пропускаем пользователя дальше, если проверки пройдены
  return children;
};

// Добавлено в конец файла для исправления ошибки сборки:
export default PwaGate;