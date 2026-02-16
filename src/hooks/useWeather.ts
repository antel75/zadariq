import { useState, useEffect } from 'react';

interface WeatherData {
  tempC: number;
  isDay: boolean;
  weatherCode: number;
  windKmh: number;
  windGustKmh: number;
  windDirection: number;
  humidity: number;
  sunset: string;
  sunrise: string;
  sunsetISO: string;
  sunriseNextISO: string;
}

const ZADAR_LAT = 44.12;
const ZADAR_LON = 15.23;

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${ZADAR_LAT}&longitude=${ZADAR_LON}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,is_day,relative_humidity_2m&daily=sunset,sunrise&timezone=Europe%2FZagreb&forecast_days=2`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        const sunsetRaw = json.daily?.sunset?.[0] ?? '';
        const sunsetTime = sunsetRaw ? sunsetRaw.split('T')[1]?.slice(0, 5) : '--:--';
        const sunriseRaw = json.daily?.sunrise?.[0] ?? '';
        const sunriseTime = sunriseRaw ? sunriseRaw.split('T')[1]?.slice(0, 5) : '--:--';
        const sunriseNextRaw = json.daily?.sunrise?.[1] ?? sunriseRaw;

        setData({
          tempC: Math.round(json.current.temperature_2m),
          isDay: json.current.is_day === 1,
          weatherCode: json.current.weather_code,
          windKmh: Math.round(json.current.wind_speed_10m),
          windGustKmh: Math.round(json.current.wind_gusts_10m ?? 0),
          windDirection: Math.round(json.current.wind_direction_10m ?? 0),
          humidity: Math.round(json.current.relative_humidity_2m ?? 50),
          sunset: sunsetTime,
          sunrise: sunriseTime,
          sunsetISO: sunsetRaw,
          sunriseNextISO: sunriseNextRaw,
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

/** Map WMO weather codes to emoji + translation key */
export function getWeatherInfo(code: number, isDay: boolean): { icon: string; conditionKey: string } {
  if (code === 0) return { icon: isDay ? '☀️' : '🌙', conditionKey: isDay ? 'sunny' : 'clear_night' };
  if (code <= 3) return { icon: isDay ? '⛅' : '☁️', conditionKey: 'partly_cloudy' };
  if (code <= 48) return { icon: '🌫️', conditionKey: 'foggy' };
  if (code <= 67) return { icon: '🌧️', conditionKey: 'rainy' };
  if (code <= 77) return { icon: '🌨️', conditionKey: 'snowy' };
  if (code <= 82) return { icon: '🌧️', conditionKey: 'rainy' };
  if (code <= 99) return { icon: '⛈️', conditionKey: 'stormy' };
  return { icon: '🌤️', conditionKey: 'sunny' };
}

/** Determine wind type for Adriatic based on speed */
export function getWindType(kmh: number): string {
  if (kmh < 15) return 'calm';
  if (kmh < 40) return 'moderate';
  return 'bura';
}

/** Determine wind name based on direction (Adriatic) */
export function getWindName(direction: number): 'bura' | 'jugo' | 'maestral' | 'tramontana' | 'other' {
  // Bura: NE (20-80°)
  if (direction >= 20 && direction <= 80) return 'bura';
  // Jugo: SE (100-170°)
  if (direction >= 100 && direction <= 170) return 'jugo';
  // Maestral: NW (280-340°)
  if (direction >= 280 && direction <= 340) return 'maestral';
  // Tramontana: N (340-360 or 0-20)
  if (direction >= 340 || direction <= 20) return 'tramontana';
  return 'other';
}
