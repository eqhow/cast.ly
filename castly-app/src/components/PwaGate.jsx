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
        <div style={styles.container}>
          <img src="/favicon.svg" alt="Cloud Icon" style={styles.icon} />
          
          <h1 style={styles.title}>Добро пожаловать!</h1>
          <p style={styles.text}>
            Чтобы веб-приложение функционировало без сбоев, добавьте его на главный экран вашего смартфона
          </p>
          
          <h2 style={styles.subtitle}>Как это сделать?</h2>
          <ol style={styles.list}>
            <li style={styles.listItem}>Нажмите кнопку «Поделиться» внизу экрана(квадрат со стрелкой вверх).</li>
            <li style={styles.listItem}>Прокрутите вниз и выберите «На экран „Домой“».</li>
            <li style={styles.listItem}>Нажмите «Добавить»</li>
            <li style={styles.listItem}>Перейдите в веб-приложения, нажав на иконку cast.ly на экране «Домой»</li>
          </ol>
        </div>
      </div>
    );
  }

  // Пропускаем пользователя дальше, если проверки пройдены
  return children;
};

// Стилизация компонента PWA-Gate строго по макету
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#fcfade', // Светло-желтый цвет из макета
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '15vh', // Смещение контента немного вниз, как на макете
    boxSizing: 'border-box',
    overflowY: 'auto'
  },
  container: {
    padding: '0 24px',
    maxWidth: '500px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  icon: {
    width: '64px',
    marginBottom: '40px'
  },
  title: {
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 900,
    fontSize: '24px',
    color: '#000000',
    margin: '0 0 16px 0',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 900,
    fontSize: '22px',
    color: '#000000',
    margin: '32px 0 16px 0',
    letterSpacing: '-0.5px'
  },
  text: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#000000',
    margin: 0
  },
  list: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#000000',
    margin: 0,
    paddingLeft: '20px'
  },
  listItem: {
    marginBottom: '8px',
    paddingLeft: '4px'
  }
};

export default PwaGate;