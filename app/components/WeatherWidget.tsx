'use client';

import { useState, useEffect, useRef } from 'react';
import { Cloud, X, Maximize2, Minimize2, MapPin } from 'lucide-react';

const LAT = 10.3157;
const LON = 123.8854;
const LOCATION = 'Cebu, PH';
const API_KEY = process.env.NEXT_PUBLIC_WEATHERAPI_KEY ?? '';

const WINDY_URL =
  `https://embed.windy.com/embed2.html?lat=${LAT}&lon=${LON}` +
  `&detailLat=${LAT}&detailLon=${LON}` +
  `&zoom=8&level=surface&overlay=rain&product=ecmwf` +
  `&menu=&message=&marker=true&calendar=now&pressure=` +
  `&type=map&location=coordinates&detail=` +
  `&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

// WeatherAPI.com condition code → emoji
function conditionEmoji(code: number): string {
  if (code === 1000) return '☀️';
  if (code === 1003) return '⛅';
  if (code <= 1009) return '☁️';
  if (code === 1030 || code === 1135 || code === 1147) return '🌫️';
  if (code === 1087 || code >= 1273) return '⛈️';
  if (code >= 1150 && code <= 1201) return '🌧️';
  if (code >= 1063 && code <= 1072) return '🌦️';
  if (code >= 1204 && code <= 1237) return '🌨️';
  if (code >= 1240 && code <= 1264) return '🌦️';
  return '🌡️';
}

interface WeatherData {
  temp: number;
  label: string;
  code: number;
  wind: number;
  precip: number;
}

function isStormCode(code: number) {
  return code === 1087 || code >= 1273;
}


type Tab = 'advisory' | 'map';

export default function WeatherWidget() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>('advisory');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || weather) return;
    if (!API_KEY) { setFetchError(true); return; }
    setLoading(true);
    fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${LAT},${LON}&aqi=no`)
      .then(r => r.json())
      .then(d => {
        const c = d.current;
        setWeather({
          temp: Math.round(c.temp_c),
          label: c.condition.text,
          code: c.condition.code,
          wind: Math.round(c.wind_kph),
          precip: c.precip_mm,
        });
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [open, weather]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setExpanded(false);
        setTab('advisory');
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function handleCollapse() {
    setExpanded(false);
    setTab('advisory');
  }

  return (
    <div ref={wrapRef} className="relative">
      <style>{`
        @keyframes weatherPopIn {
          from { opacity: 0; transform: scale(0.94) translateX(6px); }
          to   { opacity: 1; transform: scale(1)    translateX(0);   }
        }
        .weather-card { animation: weatherPopIn 200ms cubic-bezier(0.22,1,0.36,1) both; }
        .weather-card-inner { transition: width 220ms cubic-bezier(0.22,1,0.36,1); }
        @keyframes weatherFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .weather-section { animation: weatherFadeIn 180ms ease-out both; }
      `}</style>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/90 bg-white text-gray-700 shadow-md shadow-gray-900/5 ring-1 ring-gray-900/5 hover:bg-gray-50 hover:shadow-lg transition-[box-shadow,background-color]"
        aria-label="Weather"
      >
        <Cloud className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {/* Popup */}
      {open && (
        <div
          className="weather-card absolute top-0 z-[90]"
          style={{ right: 'calc(100% + 8px)' }}
        >
          <div className={`weather-card-inner rounded-2xl border border-gray-200/60 bg-white/90 shadow-xl ring-1 ring-black/5 backdrop-blur-xl overflow-hidden ${expanded ? 'w-80' : 'w-52'}`}>

            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{LOCATION}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => expanded ? handleCollapse() : setExpanded(true)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                  {expanded
                    ? <Minimize2 className="h-3.5 w-3.5" />
                    : <Maximize2 className="h-3.5 w-3.5" />
                  }
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setExpanded(false); setTab('advisory'); }}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                  aria-label="Close weather"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3.5">
              {loading && (
                <p className="text-center text-xs text-gray-400 py-3">Loading…</p>
              )}
              {fetchError && !API_KEY && (
                <p className="text-center text-xs text-red-400 py-3">
                  Set <code className="font-mono">NEXT_PUBLIC_WEATHERAPI_KEY</code> to enable weather.
                </p>
              )}
              {fetchError && API_KEY && (
                <p className="text-center text-xs text-red-400 py-3">Could not load weather.</p>
              )}
              {weather && (
                <>
                  {/* Temp + condition */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl leading-none select-none">
                      {conditionEmoji(weather.code)}
                    </span>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 leading-none">{weather.temp}°C</div>
                      <div className="text-xs text-gray-500 mt-0.5">{weather.label}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                      <div className="text-gray-400 text-[10px] mb-0.5">Wind</div>
                      <div className="font-semibold text-gray-700">{weather.wind} km/h</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                      <div className="text-gray-400 text-[10px] mb-0.5">Precip</div>
                      <div className="font-semibold text-gray-700">{weather.precip} mm</div>
                    </div>
                  </div>

                  {/* Expanded: tabs */}
                  {expanded && (
                    <div className="weather-section mt-3 pt-3 border-t border-gray-100">
                      {/* Tab bar */}
                      <div className="flex gap-1 mb-3 p-0.5 bg-gray-100 rounded-lg">
                        {(['advisory', 'map'] as Tab[]).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`flex-1 text-[11px] font-medium py-1 rounded-md transition-colors capitalize ${
                              tab === t
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      {/* Advisory tab */}
                      {tab === 'advisory' && (
                        <div className="weather-section">
                          {isStormCode(weather.code) ? (
                            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700 leading-snug">
                              Severe weather active. Outdoor tours should be suspended. Weather cancellation refund may apply.
                            </div>
                          ) : (
                            <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-700 leading-snug">
                              No active weather advisory. Good for outdoor activities.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Map tab */}
                      {tab === 'map' && (
                        <div className="weather-section rounded-xl overflow-hidden border border-gray-200">
                          <iframe
                            src={WINDY_URL}
                            width="100%"
                            height="220"
                            className="block"
                            title="Weather map"
                            loading="lazy"
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
