import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { findAsset } from '../utils/assets';
import './AssetChartModal.css';

const AssetChartModal = ({ asset, onClose }) => {
  const holder = useRef(null);

  useEffect(() => {
    const node = holder.current;
    if (!asset || !node) return;

    const meta = findAsset(asset.symbol);
    node.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container';
    widget.style.height = '100%';
    widget.style.width = '100%';

    const inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    inner.style.height = '100%';
    inner.style.width = '100%';
    widget.appendChild(inner);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: meta.tvSymbol,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      allow_symbol_change: false,
      hide_side_toolbar: false,
      support_host: 'https://www.tradingview.com',
    });
    widget.appendChild(script);
    node.appendChild(widget);

    return () => {
      if (node) node.innerHTML = '';
    };
  }, [asset]);

  if (!asset) return null;

  return (
    <div className="chart-overlay" onClick={onClose}>
      <div className="chart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chart-head">
          <h3>{findAsset(asset.symbol).name} ({asset.symbol}) Chart</h3>
          <button onClick={onClose} aria-label="Close"><FiX /></button>
        </div>
        <div className="chart-body" ref={holder} />
      </div>
    </div>
  );
};

export default AssetChartModal;