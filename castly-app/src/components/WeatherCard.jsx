import React from 'react';
import locationIcon from '../assets/location.svg';
import settingsIcon from '../assets/settings.svg'; 
import sunnyIcon from '../assets/sunny.svg';
import sunsetIcon from '../assets/sunny.svg'; 
import cloudyIcon from '../assets/cloudy.svg';
import rainyIcon from '../assets/rainy.svg';
import nightIcon from '../assets/night.svg';

export default function WeatherCard({ data, cityName, type, onLocationClick, onSettingsClick, unitTemp }) {
  if (!data) return null;

  // Конвертация температуры в зависимости от выбранных единиц измерения
  const celsiusVal = data.temperature_2m;
  const isFahrenheit = unitTemp === 'fahrenheit';
  
  const convertedTemp = isFahrenheit ? Math.round(celsiusVal * 1.8 + 32) : Math.round(celsiusVal);
  const tempLabel = convertedTemp > 0 ? `+${convertedTemp}` : convertedTemp;
  const unitLabel = isFahrenheit ? '°F' : '°C';

  // Определение иконки и локализованного статуса погоды
  const getWeatherDetails = () => {
    switch (type) {
      case 'sunny':
        return { icon: sunnyIcon, text: 'Ясно' };
      case 'sunset':
        return { icon: sunsetIcon, text: 'Закат' }; 
      case 'rainy':
        return { icon: rainyIcon, text: 'Дождь' };
      case 'night':
        return { icon: nightIcon, text: 'Ясно' };
      case 'cloudy':
      default:
        return { icon: cloudyIcon, text: 'Облачно' };
    }
  };

  const weather = getWeatherDetails();

  return (
    <div className={`weather-card-top data-theme-${type}`}>
      <div className="weather-header">
        
        <div className="city-box" onClick={onLocationClick} style={{ cursor: 'pointer' }}>
          <img src={locationIcon} alt="Локация" className="header-svg-icon location-icon" />
          <span className="city-text">{cityName}</span>
        </div>
        
        <img 
          src={settingsIcon} 
          alt="Настройки" 
          className="header-svg-icon settings-clickable" 
          onClick={onSettingsClick}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <div className="main-display" style={{ marginTop: '24px' }}>
        {/* Увеличен размер шрифта для температуры */}
        <div className="temp-large-pix" style={{ fontSize: '3rem', lineHeight: '1' }}>
          {tempLabel}{unitLabel}
        </div>
        <div className="condition-pix" style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
          {/* Увеличен размер иконки погоды и отступ справа */}
          <img 
            src={weather.icon} 
            alt={weather.text} 
            className="weather-status-svg" 
            style={{ width: '12px', height: '12px', marginRight: '6px' }} 
          />
          {/* Увеличен размер шрифта для статуса (Облачно, Ясно и тд) */}
          <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>{weather.text}</span>
        </div>
      </div>
    </div>
  );
}