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
  // Синхронное определение блокировки PWA
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const isPwaBlocked = isIos && !isStandalone;

  const [isMobile, setIsMobile] = useState(true);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [weatherType, setWeatherType] = useState('sunny');
  
  // Управление сплеш-скрином
  const [showSplash, setShowSplash] = useState(true);     
  const [isFadingOut, setIsFadingOut] = useState(false);   
  const [loading, setLoading] = useState(true);           
  const [splashText, setSplashText] = useState('изучаю местность');
  const [loadingStep, setLoadingStep] = useState(0); // Для анимации квадратного лоадера

  // Массив сохраненных городов для свайпов
  const [savedCities, setSavedCities] = useState([
    { name: 'Санкт-Петербург', coords: { lat: 59.9386, lon: 30.3141 } }
  ]);
  const [activeCityIndex, setActiveCityIndex] = useState(0);

  // Текущий активный город
  const cityName = savedCities[activeCityIndex]?.name || 'Загрузка...';
  const cityCoords = savedCities[activeCityIndex]?.coords || { lat: 59.9386, lon: 30.3141 };

  const [aiAdvice, setAiAdvice] = useState('');

  // Модальные окна
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Поиск и геопозиция
  const [isGeoDenied, setIsGeoDenied] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');     
  const [searchResults, setSearchResults] = useState([]); 
  const [isSearching, setIsSearching] = useState(false);   

  // Настройки
  const [unitTemp, setUnitTemp] = useState('celsius'); 
  const [unitWind, setUnitWind] = useState('ms');      
  const [unitPress, setUnitPress] = useState('gpa');    

  // Переменные для отслеживания свайпов
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const videoSources = {
    sunny: '/videos/bg-sunny.mp4',
    sunset: '/videos/bg-sunset.mp4',
    cloudy: '/videos/bg-cloudy.mp4',
    rainy: '/videos/bg-rainy.mp4',
    night: '/videos/bg-night.mp4'
  };

  // Ротация текста и кубиков на сплеш-скрине
  useEffect(() => {
    if (!showSplash) return;
    const phrases = ['изучаю местность', 'проверяю погоду', 'обновляю данные'];
    let textIndex = 0;
    
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % phrases.length;
      setSplashText(phrases[textIndex]);
    }, 1500);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 6);
    }, 400);

    return () => {
      clearInterval(textInterval);
      clearInterval(stepInterval);
    };
  }, [showSplash]);

  // Определение мобилки
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

  // Геопозиция при старте
  const requestGeoLocation = () => {
    if (!navigator.geolocation) {
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
            
            // Заменяем базовый город на геолокацию пользователя
            setSavedCities(prev => {
              const updated = [...prev];
              updated[0] = { name: city, coords: { lat: latitude, lon: longitude } };
              return updated;
            });
          })
          .catch(err => console.error("Ошибка названия города:", err));
      },
      (error) => {
        console.warn("Геопозиция недоступна.");
        setIsGeoDenied(true); 
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isPwaBlocked) return;
    requestGeoLocation();
  }, [isPwaBlocked]);

  // Загрузка погоды
  useEffect(() => {
    if (isPwaBlocked) return;
    
    setLoading(true);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityCoords.lat}&longitude=${cityCoords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure,precipitation,visibility`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const current = data.current;
        setWeatherInfo(current);

        const code = current.weather_code;
        const isDay = current.is_day;
        const currentHour = new Date().getHours();
        const isSunsetHour = currentHour >= 18 && currentHour <= 20;

        if (code === 0) {
          if (!isDay) setWeatherType('night');
          else setWeatherType(isSunsetHour ? 'sunset' : 'sunny');
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
  }, [cityCoords, isPwaBlocked]);

  // Плавное скрытие сплеш-скрина
  useEffect(() => {
    if (isPwaBlocked) return;
    if (!loading && weatherInfo && showSplash) {
      setIsFadingOut(true); 
      const timer = setTimeout(() => setShowSplash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, weatherInfo, isPwaBlocked, showSplash]);

  // Поиск города
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

  // Сохранение и переключение на новый город
  const handleSelectCity = (cityData) => {
    const lat = parseFloat(cityData.lat);
    const lon = parseFloat(cityData.lon);
    const shortName = cityData.display_name.split(',')[0];
    const newCity = { name: shortName, coords: { lat, lon } };

    setSavedCities(prev => {
      // Ищем, нет ли уже этого города в пуле
      const existingIdx = prev.findIndex(c => Math.abs(c.coords.lat - lat) < 0.02 && Math.abs(c.coords.lon - lon) < 0.02);
      if (existingIdx !== -1) {
        setActiveCityIndex(existingIdx);
        return prev;
      }
      const updated = [...prev, newCity];
      setActiveCityIndex(updated.length - 1);
      return updated;
    });

    setIsLocationOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Обработчики свайпов влево/вправо
  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const swipeDistance = touchStartX - touchEndX;
    const minSwipeThreshold = 50; 

    if (swipeDistance > minSwipeThreshold) {
      // Свайп влево -> следующий город
      if (activeCityIndex < savedCities.length - 1) {
        setActiveCityIndex(prev => prev + 1);
      }
    } else if (swipeDistance < -minSwipeThreshold) {
      // Свайп вправо -> предыдущий город
      if (activeCityIndex > 0) {
        setActiveCityIndex(prev => prev - 1);
      }
    }
    
    // Сбрасываем координаты
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (!isMobile) return <DesktopPlug />;

  // Конвертеры
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

  return (
    <PwaGate>
      <div className="app-container">
        
        {showSplash && (
          <div className={`splash-screen light-theme ${isFadingOut ? 'fade-out' : ''}`}>
            <div className="splash-content-box">
              
              <div className="splash-logo-area">
                {/* SVG Пиксельное облако */}
                <svg width="60" height="36" viewBox="0 0 60 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="pixel-cloud-svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M24 6H36V12H42V18H48V30H6V24H12V18H18V12H24V6ZM36 12V18H42V24H12V18H18V12H24V12H36Z" fill="black"/>
                </svg>
                <div className="brand-logo font-pixel">castly</div>
              </div>
              
              <div className="splash-bottom-area">
                <div className="loader-dots-squares">
                  <div className={`square ${loadingStep >= 1 ? 'active' : ''}`}></div>
                  <div className={`square ${loadingStep >= 2 ? 'active' : ''}`}></div>
                  <div className={`square ${loadingStep >= 3 ? 'active' : ''}`}></div>
                  <div className={`square ${loadingStep >= 4 ? 'active' : ''}`}></div>
                  <div className={`square ${loadingStep >= 5 ? 'active' : ''}`}></div>
                </div>
                <div className="splash-loading-text">{splashText}</div>
              </div>

            </div>
          </div>
        )}

        <div className="video-background-container">
          <video key={weatherType} autoPlay loop muted playsInline className="bg-video">
            <source src={currentVideoPath} type="video/mp4" />
          </video> 
          <div className="video-overlay"></div>
        </div>

        {/* Индикатор сохраненных страниц городов (точки сверху) */}
        {savedCities.length > 1 && (
          <div className="city-page-indicator">
            {savedCities.map((_, idx) => (
              <div key={idx} className={`page-dot ${idx === activeCityIndex ? 'active' : ''}`} />
            ))}
          </div>
        )}

        <div 
          className={`ui-content-wrapper ${!showSplash ? 'app-entry-active' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <WeatherCard 
            data={weatherInfo} 
            type={weatherType} 
            cityName={cityName} 
            unitTemp={unitTemp}
            onLocationClick={() => setIsLocationOpen(true)}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
          
          <div className="bottom-panels-area">
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

        {/* Модальное окно локации */}
        {isLocationOpen && (
          <div className="modal-overlay" onClick={() => { setIsLocationOpen(false); setSearchQuery(''); setSearchResults([]); }}>
            <div className="modal-glass-container location-panel" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <img src={trainIcon} alt="" className="modal-header-icon" />
                <span className="modal-icon-title">Добавить геолокацию</span>
              </div>
              
              {isGeoDenied && (
                <div className="geo-alert-box denied" onClick={requestGeoLocation} style={{ cursor: 'pointer' }}>
                  <div className="geo-alert-header">
                    <img src={locationIcon} alt="" className="geo-alert-svg-icon" />
                    <h3>Разрешите сайту использовать геопозицию</h3>
                  </div>
                  <p>Вы запретили доступ. Нажмите на эту плашку, чтобы повторить системный запрос геопозиции.</p>
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

        {/* Модальное окно настроек */}
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