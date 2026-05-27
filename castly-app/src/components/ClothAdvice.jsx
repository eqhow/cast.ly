import React from 'react';
import aiIcon from '../assets/ai.svg';

export default function ClothAdvice({ adviceText, type }) {
  return (
    <div className={`glass-panel cloth-panel data-theme-${type}`}>
      <div className="panel-title">
        <img src={aiIcon} alt="ИИ" className="panel-svg-icon" />
        <span>Что надеть?</span>
      </div>
      <div className="panel-body">
        {adviceText || "Анализ погоды для совета..."}
      </div>
    </div>
  );
}