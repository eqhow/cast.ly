import React, { useState, useEffect } from 'react';
import './App.css';
import WeatherCard from './components/WeatherCard';
import ClothAdvice from './components/ClothAdvice';
import DesktopPlug from './components/DesktopPlug';
import PwaGate from './components/PwaGate'; 
import infoIcon from './assets/info.svg';
import trainIcon from './assets/train.svg';
import searchIcon from './assets/search.svg';
import locationIcon from './assets/location.svg';
import menuIcon from './assets/menu.svg';
import { getClothAdvice } from './utils/getClothAdvice';

export default function App() {
  // Синхронное определение блокировки PWA для предотвращения лишних запросов
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const isPwaBlocked = isIos && !isStandalone;

  const [isMobile, setIsMobile] = useState(true);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [weatherType, setWeatherType] = useState('sunny');
  
  // Состояния для управления сплеш-скрином и анимацией ухода
  const [showSplash, setShowSplash] = useState(true);     
  const [isFadingOut, setIsFadingOut] = useState(false);   
  const [loading, setLoading] = useState(true);           
  const [splashText, setSplashText] = useState('изучаю местность');

  // Хранение массива городов (первый элемент — текущая геопозиция)
  const [cities, setCities] = useState(() => {
    const saved = localStorage.getItem('castly_cities');
    return saved ? JSON.parse(saved) : [{ name: 'Загрузка...', lat: 59.9386, lon: 30.3141 }];
  });
  const [activeCityIndex, setActiveCityIndex] = useState(0);

  // Состояния отображения модальных окон
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Поиск городов и управление доступом к геопозиции
  const [isGeoDenied, setIsGeoDenied] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');     
  const [searchResults, setSearchResults] = useState([]); 
  const [isSearching, setIsSearching] = useState(false);   

  // Переменные для обработки свайпов
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  // Пользовательские настройки единиц измерения
  const [unitTemp, setUnitTemp] = useState('celsius'); 
  const [unitWind, setUnitWind] = useState('ms');      
  const [unitPress, setUnitPress] = useState('gpa');    

  // Соответствие типов погоды и фоновых видеофайлов
  const videoSources = {
    sunny: '/videos/bg-sunny.mp4',
    sunset: '/videos/bg-sunset.mp4',
    cloudy: '/videos/bg-cloudy.mp4',
    rainy: '/videos/bg-rainy.mp4',
    night: '/videos/bg-night.mp4'
  };

  // Сохранение списка городов в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('castly_cities', JSON.stringify(cities));
  }, [cities]);

  // Ротация текстов на сплеш-скрине во время загрузки
  useEffect(() => {
    if (!showSplash) return;
    const phrases = ['изучаю местность', 'проверяю погоду', 'обновляю данные'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % phrases.length;
      setSplashText(phrases[index]);
    }, 1500);
    return () => clearInterval(interval);
  }, [showSplash]);

  // Определение типа устройства (мобильный экран или тач-интерфейс)
  useEffect(() => {
    if (isPwaBlocked) return;

    const checkDevice = () => {
      const mobileWidth = window.innerWidth <= 768;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(mobileWidth || isTouch);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [isPwaBlocked]);

  // Запрос текущих координат пользователя и определение города
  const requestGeoLocation = () => {
    if (!navigator.geolocation) {
      setCities(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], name: "Санкт-Петербург" };
        return updated;
      });
      setIsGeoDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setIsGeoDenied(false); 

        const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`;
        
        fetch(geocodeUrl, { headers: { 'User-Agent': 'CastlyWeatherApp/1.0' } })
          .then(res => res.json())
          .then(geoData => {
            const address = geoData.address;
            const city = address.city || address.town || address.village || address.state || "Неизвестный город";
            setCities(prev => {
              const updated = [...prev];
              updated[0] = { name: city, lat: latitude, lon: longitude };
              return updated;
            });
          })
          .catch(err => {
            console.error("Ошибка определения названия города:", err);
            setCities(prev => {
              const updated = [...prev];
              updated[0] = { name: "Санкт-Петербург", lat: 59.9386, lon: 30.3141 };
              return updated;
            });
          });
      },
      (error) => {
        console.warn("Геопозиция недоступна.");
        setIsGeoDenied(true); 
        setCities(prev => {
          const updated = [...prev];
          if (updated[0].name === 'Загрузка...') {
            updated[0] = { name: "Санкт-Петербург", lat: 59.9386, lon: 30.3141 };
          }
          return updated;
        });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isPwaBlocked) return;
    requestGeoLocation();
  }, [isPwaBlocked]);

  // Загрузка метеоданных из Open-Meteo API при изменении активного города
  useEffect(() => {
    if (isPwaBlocked) return;

    const activeCity = cities[activeCityIndex];
    if (!activeCity) return;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${activeCity.lat}&longitude=${activeCity.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure,precipitation,visibility`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const current = data.current;
        setWeatherInfo(current);

        const code = current.weather_code;
        const isDay = current.is_day;
        const currentHour = new Date().getHours();
        
        // Определение вечернего времени для активации заката (с 18:00 до 21:00)
        const isSunsetHour = currentHour >= 18 && currentHour <= 20;

        // Разделение логики на "ясно днем", "ясно ночью" и другие погодные условия
        if (code === 0) {
          if (!isDay) {
            setWeatherType('night'); // Ясно ночью -> bg-night.mp4
          } else {
            setWeatherType(isSunsetHour ? 'sunset' : 'sunny'); // Ясно днем -> bg-sunny.mp4 (или закат)
          }
        } else if (code >= 1 && code <= 3) {
          setWeatherType(isDay && isSunsetHour && code === 1 ? 'sunset' : 'cloudy');
        } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
          setWeatherType('rainy');
        } else {
          setWeatherType('cloudy');
        }
        
        const advice = getClothAdvice(current);
        setAiAdvice(advice);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ошибка загрузки погоды:', err);
        setLoading(false);
      });
  }, [activeCityIndex, cities, isPwaBlocked]);

  // Плавное скрытие сплеш-скрина после завершения загрузки данных
  useEffect(() => {
    if (isPwaBlocked) return;

    if (!loading && weatherInfo) {
      setIsFadingOut(true); 
      const timer = setTimeout(() => setShowSplash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, weatherInfo, isPwaBlocked]);

  // Интерактивный поиск городов по мере ввода названия
  const handleCitySearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&accept-language=ru&limit=5`;

    fetch(searchUrl, { headers: { 'User-Agent': 'CastlyWeatherApp/1.0' } })
      .then(res => res.json())
      .then(data => {
        setSearchResults(data);
        setIsSearching(false);
      })
      .catch(err => {
        console.error("Ошибка поиска города:", err);
        setIsSearching(false);
      });
  };

  const handleSelectCity = (cityData) => {
    const lat = parseFloat(cityData.lat);
    const lon = parseFloat(cityData.lon);
    const shortName = cityData.display_name.split(',')[0];
    
    setCities(prev => {
      // Проверяем, есть ли город уже в сохраненных
      const existsIndex = prev.findIndex(c => Math.abs(c.lat - lat) < 0.001 && Math.abs(c.lon - lon) < 0.001);
      if (existsIndex !== -1) {
        setActiveCityIndex(existsIndex);
        return prev;
      }
      const newCities = [...prev, { name: shortName, lat, lon }];
      setActiveCityIndex(newCities.length - 1);
      return newCities;
    });

    setIsLocationOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Логика свайпов влево/вправо
  const handleTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 60;
    const isRightSwipe = distance < -60;

    if (isLeftSwipe && activeCityIndex < cities.length - 1) {
      setLoading(true);
      setActiveCityIndex(prev => prev + 1);
    } else if (isRightSwipe && activeCityIndex > 0) {
      setLoading(true);
      setActiveCityIndex(prev => prev - 1);
    }
  };

  if (!isMobile) return <DesktopPlug />;

  // Функции-конвертеры для приведения данных к выбранным единицам измерения
  const getFormattedTemp = (celsiusVal) => {
    if (celsiusVal === undefined || celsiusVal === null) return { value: '0', unit: '°C' };
    if (unitTemp === 'fahrenheit') {
      const fahrenheit = Math.round(celsiusVal * 1.8 + 32);
      return { value: fahrenheit > 0 ? `+${fahrenheit}` : fahrenheit, unit: '°F' };
    }
    const celsius = Math.round(celsiusVal);
    return { value: celsius > 0 ? `+${celsius}` : celsius, unit: '°C' };
  };

  const getFormattedWind = (kmhVal) => {
    if (kmhVal === undefined || kmhVal === null) return { value: '0', unit: 'м/с' };
    if (unitWind === 'ms') return { value: Math.round(kmhVal / 3.6), unit: 'м/с' };
    if (unitWind === 'mph') return { value: Math.round(kmhVal / 1.60934), unit: 'мфч' };
    return { value: Math.round(kmhVal), unit: 'км/ч' };
  };

  const getFormattedPress = (hpaVal) => {
    if (hpaVal === undefined || hpaVal === null) return { value: '0', unit: 'гПа' };
    if (unitPress === 'mmhg') return { value: Math.round(hpaVal * 0.750062), unit: 'мм рт.' };
    return { value: Math.round(hpaVal), unit: 'гПа' };
  };

  const displayApparentTemp = getFormattedTemp(weatherInfo?.apparent_temperature);
  const displayWind = getFormattedWind(weatherInfo?.wind_speed_10m);
  const displayPress = getFormattedPress(weatherInfo?.surface_pressure);
  const currentVideoPath = videoSources[weatherType] || videoSources.cloudy;
  const currentCityName = cities[activeCityIndex]?.name || 'Загрузка...';

  return (
    <PwaGate>
      <div 
        className="app-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        
        {showSplash && (
          <div className={`splash-screen ${isFadingOut ? 'fade-out' : ''}`}>
            <div className="splash-center-content">
              {/* Точная копия пиксельного облака из вашего дизайна */}
              <svg width="68" height="42" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="splash-cloud-icon">
                <path d="M6 1h5v1h2v1h2v2h1v2h1v2h-1v1h-1v1H1V9H0V6h1V4h2V2h3V1z" fill="#f6f4e6"/>
                <path d="M6 0h5v1h2v1h2v2h1v2h1v2h-1v1h-1v1H1V9H0V6h1V4h2V2h3V0zm0 1H3v1H1v2H0v3h1v2h1v1h13V9h1V7h1V5h-1V3h-2V2h-2V1H6z" fill="#000000"/>
              </svg>
              <div className="brand-logo">castly</div>
            </div>

            <div className="splash-bottom-content">
              {/* Стилизованный пиксельный индикатор загрузки из 5 квадратов */}
              <div className="loader-squares">
                <span className="square-dot"></span>
                <span className="square-dot"></span>
                <span className="square-dot"></span>
                <span className="square-dot"></span>
                <span className="square-dot"></span>
              </div>
              <div className="splash-loading-text">{splashText}</div>
            </div>
          </div>
        )}

        <div className="video-background-container">
          <video key={weatherType} autoPlay loop muted playsInline className="bg-video">
            <source src={currentVideoPath} type="video/mp4" />
          </video> 
          <div className="video-overlay"></div>
        </div>

        <div className={`ui-content-wrapper ${!showSplash ? 'app-entry-active' : ''}`}>
          <WeatherCard 
            data={weatherInfo} 
            type={weatherType} 
            cityName={currentCityName} 
            unitTemp={unitTemp}
            onLocationClick={() => setIsLocationOpen(true)}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
          
          <div className="bottom-panels-area">
            {/* Точки пагинации для наглядности свайпов городов на главном экране */}
            {cities.length > 1 && (
              <div className="carousel-dots">
                {cities.map((_, idx) => (
                  <span key={idx} className={`carousel-dot ${idx === activeCityIndex ? 'active' : ''}`}></span>
                ))}
              </div>
            )}

            <ClothAdvice data={weatherInfo} adviceText={aiAdvice} type={weatherType} />
            
            <div className={`glass-panel details-panel data-theme-${weatherType}`}>
              <div className="panel-title">
                <img src={infoIcon} alt="Информация" className="panel-svg-icon" />
                <span>Подробная сводка</span>
              </div>
              
              <div className="details-grid">
                <div className="grid-item">
                  <span className="grid-label">Ощущается как</span>
                  <span className="grid-value">
                    {displayApparentTemp.value}
                    <span className="unit">{displayApparentTemp.unit === '°C' ? '°' : '°F'}</span>
                  </span>
                </div>
                <div className="grid-item">
                  <span className="grid-label">Ветер</span>
                  <span className="grid-value">
                    {displayWind.value} <span className="unit">{displayWind.unit}</span>
                  </span>
                </div>
                <div className="grid-item">
                  <span className="grid-label">Влажность</span>
                  <span className="grid-value">{weatherInfo?.relative_humidity_2m || 0}<span className="unit">%</span></span>
                </div>
                <div className="grid-item">
                  <span className="grid-label">Давление</span>
                  <span className="grid-value">
                    {displayPress.value} <span className="unit">{displayPress.unit}</span>
                  </span>
                </div>
                <div className="grid-item">
                  <span className="grid-label">Осадки</span>
                  <span className="grid-value">{weatherInfo?.precipitation > 0 ? 100 : 10}<span className="unit">%</span></span>
                </div>
                <div className="grid-item">
                  <span className="grid-label">Видимость</span>
                  <span className="grid-value">{weatherInfo?.visibility ? Math.round(weatherInfo.visibility/1000) : 12} <span className="unit">км</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Модальное окно: Выбор локации */}
        {isLocationOpen && (
          <div className="modal-overlay" onClick={() => { setIsLocationOpen(false); setSearchQuery(''); setSearchResults([]); }}>
            <div className="modal-glass-container location-panel" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <img src={trainIcon} alt="" className="modal-header-icon" />
                <span className="modal-icon-title">Сменить геолокацию</span>
              </div>
              
              {isGeoDenied && (
                <div className="geo-alert-box denied" onClick={requestGeoLocation} style={{ cursor: 'pointer' }}>
                  <div className="geo-alert-header">
                    <img src={locationIcon} alt="" className="geo-alert-svg-icon" />
                    <h3>Разрешите сайту использовать геопозицию</h3>
                  </div>
                  <p>Вы запретили или заблокировали доступ. Нажмите на эту плашку, чтобы повторить системный запрос геопозиции.</p>
                </div>
              )}

              <div className="search-input-wrapper">
                <img src={searchIcon} alt="" className="search-input-svg-icon" />
                <input 
                  type="text" 
                  placeholder="начните поиск (от 3-х букв)" 
                  className="modal-search-input" 
                  value={searchQuery}
                  onChange={handleCitySearch}
                />
              </div>

              {searchResults.length > 0 && (
                <div className="search-results-container">
                  {searchResults.map((city, index) => (
                    <div key={index} className="search-result-item" onClick={() => handleSelectCity(city)}>
                      {city.display_name}
                    </div>
                  ))}
                </div>
              )}
              {isSearching && <div className="search-status-text">Ищем подходящие города...</div>}
            </div>
          </div>
        )}

        {/* Модальное окно: Настройки единиц измерения */}
        {isSettingsOpen && (
          <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
            <div className="modal-glass-container settings-panel settings-panel-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <img src={menuIcon} alt="" className="modal-header-icon" />
                <span className="modal-icon-title title-pix">Настройки</span>
              </div>

              <div className="settings-row">
                <label>Температура</label>
                <div className="toggle-group">
                  <button className={`toggle-btn ${unitTemp === 'celsius' ? 'active' : ''}`} onClick={() => setUnitTemp('celsius')}>Цельсиум (°C)</button>
                  <button className={`toggle-btn ${unitTemp === 'fahrenheit' ? 'active' : ''}`} onClick={() => setUnitTemp('fahrenheit')}>Фаренгейт (°F)</button>
                </div>
              </div>

              <div className="settings-row">
                <label>Ветер</label>
                <div className="toggle-group">
                  <button className={`toggle-btn ${unitWind === 'ms' ? 'active' : ''}`} onClick={() => setUnitWind('ms')}>м/с</button>
                  <button className={`toggle-btn ${unitWind === 'kmh' ? 'active' : ''}`} onClick={() => setUnitWind('kmh')}>км/ч</button>
                  <button className={`toggle-btn ${unitWind === 'mph' ? 'active' : ''}`} onClick={() => setUnitWind('mph')}>мфч</button>
                </div>
              </div>

              <div className="settings-row">
                <label>Давление</label>
                <div className="toggle-group">
                  <button className={`toggle-btn ${unitPress === 'gpa' ? 'active' : ''}`} onClick={() => setUnitPress('gpa')}>Гектопаскали (гПа)</button>
                  <button className={`toggle-btn ${unitPress === 'mmhg' ? 'active' : ''}`} onClick={() => setUnitPress('mmhg')}>мм рт. ст.</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </PwaGate>
  );
}