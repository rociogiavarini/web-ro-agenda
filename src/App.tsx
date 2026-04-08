import React, { useState, useEffect } from 'react';
import {
  Camera, ChevronLeft, ChevronRight, Check, Lock, X,
  Calendar, BarChart3, List, LogOut, Loader2, ExternalLink, RefreshCw, Image
} from 'lucide-react';
import type { SessionCategory, PackDefinition, Booking, DbBackground, PackConfig, GlobalSettings } from './types';
import {
  CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, CATEGORY_EMOJIS,
  PACKS, formatPrice, formatSplitPrice, formatPackDetails, BACKGROUND_THEMES
} from './types';
import { supabase } from './supabaseClient';
import './index.css';

// ─── Google Calendar helper ────────────────────────────────────────────────
function makeGCalLink(booking: Partial<Booking>): string {
  if (!booking.session_date) return '#';
  const date = booking.session_date.replace(/-/g, '');
  const title = encodeURIComponent(`Sesión Fotografía – ${booking.client_name || ''}`);
  const details = encodeURIComponent(
    `Pack: ${booking.pack_name || ''}\nCliente: ${booking.client_name || ''}\nTel: ${booking.client_phone || ''}`
  );
  const location = encodeURIComponent('Vélez Sarsfield 2142, Casilda, Santa Fe');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${details}&location=${location}`;
}

async function compressImage(dataUrl: string, maxWidth = 1000, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}

// ─── Constants ────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
const ALL_CATEGORIES: SessionCategory[] = ['mi_1er_recuerdo', 'infantil_estudio', 'exterior', 'maternidad'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const today = new Date();

// ─── Calendar Component ────────────────────────────────────────────────────
function BookingCalendar({ selected, onSelect }: { selected: string | null; onSelect: (d: string) => void }) {
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const makeDate = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

  const formatSelected = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="calendar-wrapper">
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={prevMonth} aria-label="Mes anterior"><ChevronLeft size={16}/></button>
        <h3>{MONTH_NAMES[viewMonth]} {viewYear}</h3>
        <button className="cal-nav-btn" onClick={nextMonth} aria-label="Mes siguiente"><ChevronRight size={16}/></button>
      </div>
      <div className="cal-weekdays">
        {DAY_NAMES.map(d => <div key={d} className="cal-weekday">{d}</div>)}
      </div>
      <div className="cal-days">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="cal-day empty"/>)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = makeDate(day);
          const past = isPast(day);
          return (
            <button
              key={day}
              className={`cal-day${selected === iso ? ' selected' : ''}${isToday(day) && selected !== iso ? ' today' : ''}`}
              disabled={past}
              onClick={() => !past && onSelect(iso)}
            >
              {day}
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="cal-selected-display">
          <p>📅 {formatSelected(selected)}</p>
          <span>¡Fecha seleccionada!</span>
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Category Selection ────────────────────────────────────────────
function StepCategory({ selected, onSelect }: { selected: SessionCategory | null; onSelect: (c: SessionCategory) => void }) {
  return (
    <div>
      <div className="step-title">
        <h2>¿Qué tipo de sesión querés?</h2>
        <p>Elegí la categoría que más te representa</p>
      </div>
      <div className="category-grid">
        {ALL_CATEGORIES.map(cat => (
          <div
            key={cat}
            className={`category-card${selected === cat ? ' selected' : ''}`}
            onClick={() => onSelect(cat)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onSelect(cat)}
          >
            <span className="category-emoji">{CATEGORY_EMOJIS[cat]}</span>
            <h3>{CATEGORY_LABELS[cat]}</h3>
            <p>{CATEGORY_DESCRIPTIONS[cat]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Pack Selection ────────────────────────────────────────────────
function StepPack({ category, selected, onSelect, getPackPrice, getPackInclusions }: {
  category: SessionCategory;
  selected: PackDefinition | null;
  onSelect: (p: PackDefinition) => void;
  getPackPrice: (p: PackDefinition) => number;
  getPackInclusions: (p: PackDefinition) => string;
}) {
  const packs = PACKS.filter(p => p.category === category);
  const topPackId = packs.reduce((a, b) => getPackPrice(a) > getPackPrice(b) ? a : b, packs[0])?.id;

  return (
    <div>
      <div className="step-title">
        <h2>Elegí tu pack</h2>
        <p>Precios expresados en 2 pagos (Seña para reservar + Día de sesión)</p>
      </div>
      <div className="pack-grid">
        {packs.map(pack => {
          const inclusions = getPackInclusions(pack);
          const customLines = inclusions.split('\n').filter(Boolean);
          
          return (
            <div
              key={pack.id}
              className={`pack-card${selected?.id === pack.id ? ' selected' : ''}`}
              onClick={() => onSelect(pack)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(pack)}
            >
              {pack.id === topPackId && <div className="pack-badge">⭐ Más completo</div>}
              {selected?.id === pack.id && (
                <div className="pack-check"><Check size={14}/></div>
              )}
              <div className="pack-name">{pack.name}</div>
              <div className="pack-price" style={{ fontSize: 16 }}>{formatSplitPrice(getPackPrice(pack))}</div>
              <div className="pack-total" style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: -6, marginBottom: 10 }}>Total: {formatPrice(getPackPrice(pack))}</div>
              <ul className="pack-features">
                {customLines.length > 0 ? (
                  customLines.map((line, i) => <li key={i} className="pack-feature"><span className="pack-feature-dot"/> {line}</li>)
                ) : (
                  <>
                    {pack.digitalQty > 0 && <li className="pack-feature"><span className="pack-feature-dot"/> {pack.digitalQty} fotos digitales</li>}
                    {pack.printQty13x18 > 0 && <li className="pack-feature"><span className="pack-feature-dot"/> {pack.printQty13x18} impresas 13×18</li>}
                    {pack.printQty20x30 > 0 && <li className="pack-feature"><span className="pack-feature-dot"/> {pack.printQty20x30} impresas 20×30</li>}
                    {pack.hasFotolibro && <li className="pack-feature"><span className="pack-feature-dot"/> Fotolibro incluido</li>}
                    {pack.imanesQty > 0 && <li className="pack-feature"><span className="pack-feature-dot"/> {pack.imanesQty} imanes</li>}
                    {pack.maxBackgrounds && <li className="pack-feature"><span className="pack-feature-dot"/> Hasta {pack.maxBackgrounds} fondos</li>}
                  </>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function StepBackgrounds({ pack, value, onChange, selectedBackgrounds, onToggleBackground, catalog }: {
  pack: PackDefinition;
  value: number;
  onChange: (n: number) => void;
  selectedBackgrounds: string[];
  onToggleBackground: (id: string) => void;
  catalog: DbBackground[];
}) {
  const max = pack.maxBackgrounds || 1;

  return (
    <div>
      <div className="step-title">
        <h2>¿Qué fondos querés?</h2>
        <p>Seleccioná la cantidad y luego los fondos para tu sesión</p>
      </div>
      <div className="backgrounds-section">
        <h3>Cantidad de Fondos</h3>
        <p>Con el <strong>{pack.name}</strong> podés elegir hasta <strong>{max} {max === 1 ? 'fondo' : 'fondos'}</strong> diferentes.</p>

        <div className="background-picker-display">{value}</div>
        <div className="background-picker-label">{value === 1 ? 'fondo' : 'fondos'}</div>

        <div className="background-picker-controls">
          <button className="picker-btn" onClick={() => value > 1 && onChange(value - 1)} disabled={value <= 1}>−</button>
          <div className="background-dots">
            {Array.from({ length: max }).map((_, i) => (
              <div key={i} className={`background-dot${i < value ? ' active' : ''}`}/>
            ))}
          </div>
          <button className="picker-btn" onClick={() => value < max && onChange(value + 1)} disabled={value >= max}>+</button>
        </div>

        <div className="background-note">
          Elegí los que más te gusten a continuación 👇
        </div>
      </div>
      
      <div className="backgrounds-grouped">
        {BACKGROUND_THEMES.map(t => {
          const items = catalog.filter(bg => (bg.theme === t) || (!bg.theme && t === 'otros'));
          if (items.length === 0) return null;
          return (
            <div key={t} className="background-theme-group">
              <h4 className="theme-title">{t.toUpperCase()}</h4>
              <div className="backgrounds-catalog-grid">
                {items.map(bg => {
                  const isSelected = selectedBackgrounds.includes(bg.id);
                  const canSelect = isSelected || selectedBackgrounds.length < value;
                  return (
                    <div 
                      key={bg.id} 
                      className={`bg-catalog-card ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
                      onClick={() => canSelect && onToggleBackground(bg.id)}
                    >
                      <img src={bg.image_data} alt={bg.name} style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 6, marginBottom: 4 }} />
                      {isSelected && <div className="bg-check"><Check size={14}/></div>}
                      <div className="bg-name" style={{ fontSize: 10 }}>{bg.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

// ─── Step 4: Calendar ──────────────────────────────────────────────────────
function StepCalendar({ category, selected, time, onSelect, onSelectTime }: { category: SessionCategory; selected: string | null; time: string; onSelect: (d: string) => void; onSelectTime: (t: string) => void; }) {
  return (
    <div>
      <div className="step-title">
        <h2>Elegí la fecha y el horario</h2>
        <p>Seleccioná el día y hora que más te convenga y te confirmo disponibilidad.</p>
        <p style={{ color: 'var(--purple)', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
          {category === 'mi_1er_recuerdo' && "💡 A partir de los 15 días de vida, si ya tiene un mes es mejor esperar hasta los 3 meses."}
          {category === 'maternidad' && "💡 Idealmente realizar antes de la semana 36."}
          {(category === 'infantil_estudio' || category === 'exterior') && "💡 Tené en cuenta elegir una fecha 20 días antes del evento."}
        </p>
      </div>
      <BookingCalendar selected={selected} onSelect={onSelect} />
      {selected && (
        <div className="time-picker-section">
          <h3>Horarios disponibles</h3>
          <div className="time-slots">
            {TIMES.map(t => (
              <button 
                key={t} 
                className={`time-slot-btn ${time === t ? 'selected' : ''}`} 
                onClick={() => onSelectTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 16, textAlign: 'center' }}>
            En caso de no coincidirte las fechas escribime por WhatsApp y coordinamos.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Client Form ───────────────────────────────────────────────────
function StepForm({ data, onChange }: {
  data: { name: string; email: string; phone: string; attendees: string; notes: string; deliveryDate: string };
  onChange: (d: Partial<typeof data>) => void;
}) {
  // Suggest session date 20 days before the delivery date
  const suggestedSession = data.deliveryDate
    ? (() => {
        const d = new Date(data.deliveryDate);
        d.setDate(d.getDate() - 20);
        return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
      })()
    : null;

  return (
    <div>
      <div className="step-title">
        <h2>Tus datos de contacto</h2>
        <p>Para confirmar la reserva y coordinar los detalles</p>
      </div>
      <div className="booking-form-card">
        <div className="form-group">
          <label className="form-label">Nombre y Apellido *</label>
          <input className="form-input" placeholder="Ej. María González" value={data.name} onChange={e => onChange({ name: e.target.value })} required/>
        </div>
        <div className="form-group">
          <label className="form-label">WhatsApp *</label>
          <input className="form-input" type="tel" placeholder="Ej. 3411234567" value={data.phone}
            onChange={e => onChange({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} required/>
        </div>
        <div className="form-group">
          <label className="form-label">¿Quién/es vienen a la sesión? *</label>
          <input className="form-input" placeholder="Ej. Juan (2 años), mamá y papá" value={data.attendees} onChange={e => onChange({ attendees: e.target.value })} required/>
        </div>
        <div className="form-group" style={{ background: '#f8f4ff', padding: 14, borderRadius: 12, border: '1px solid var(--purple-light)' }}>
          <label className="form-label" style={{ color: 'var(--purple)' }}>📅 ¿Para qué fecha necesitás listas las fotos? (opcional)</label>
          <input className="form-input" type="date" value={data.deliveryDate} onChange={e => onChange({ deliveryDate: e.target.value })} style={{ marginTop: 6 }} />
          {suggestedSession && (
            <p style={{ fontSize: 12, color: 'var(--purple)', marginTop: 8, marginBottom: 0 }}>
              💡 Te sugiero agendar <strong>20 días antes</strong> de esa fecha para que las impresiones lleguen a término (aprox el {suggestedSession}).
            </p>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Email (opcional)</label>
          <input className="form-input" type="email" placeholder="Ej. hola@gmail.com" value={data.email} onChange={e => onChange({ email: e.target.value })}/>
        </div>
        <div className="form-group">
          <label className="form-label">Mensaje o consulta (opcional)</label>
          <textarea className="form-textarea" placeholder="Algún detalle especial o duda..." value={data.notes} onChange={e => onChange({ notes: e.target.value })}/>
        </div>
      </div>
    </div>
  );
}

// ─── Step 6: Confirmation Summary ─────────────────────────────────────────
function StepConfirm({ booking, gcalLink, onBack, onSubmit, submitting }: {
  booking: Partial<Booking>;
  gcalLink: string;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div>
      <div className="step-title">
        <h2>Confirmá tu reserva</h2>
        <p>Revisá los detalles antes de enviar</p>
      </div>
      <div className="summary-card">
        <h3>Resumen de la sesión</h3>
        <div className="summary-row">
          <span className="summary-key">Tipo de sesión</span>
          <span className="summary-val">{booking.session_type ? CATEGORY_LABELS[booking.session_type] : ''} {booking.session_type ? CATEGORY_EMOJIS[booking.session_type] : ''}</span>
        </div>
        <div className="summary-row">
          <span className="summary-key">Pack</span>
          <span className="summary-val">{booking.pack_name}</span>
        </div>
        {(booking.backgrounds_qty ?? 0) > 0 && (
          <div className="summary-row">
            <span className="summary-key">Fondos</span>
            <span className="summary-val">{booking.backgrounds_qty} {booking.backgrounds_qty === 1 ? 'fondo' : 'fondos'}</span>
          </div>
        )}
        <div className="summary-row">
          <span className="summary-key">Fecha y hora</span>
          <span className="summary-val">{booking.session_date ? formatDate(booking.session_date) : ''} {booking.session_time ? `(${booking.session_time})` : ''}</span>
        </div>
        <div className="summary-row">
          <span className="summary-key">Participantes</span>
          <span className="summary-val">{booking.attendees}</span>
        </div>
        <div className="summary-row">
          <span className="summary-key">Cliente</span>
          <span className="summary-val">{booking.client_name}</span>
        </div>
        <div className="summary-row">
          <span className="summary-key">WhatsApp</span>
          <span className="summary-val">{booking.client_phone}</span>
        </div>
        {booking.client_email && (
          <div className="summary-row">
            <span className="summary-key">Email</span>
            <span className="summary-val">{booking.client_email}</span>
          </div>
        )}
        <div className="summary-row">
          <span className="summary-key">Total Pack</span>
          <span className="summary-val">{formatPrice(booking.pack_price ?? 0)}</span>
        </div>
        <div className="summary-row" style={{ borderTop: '1px dashed var(--gray-200)', marginTop: 10, paddingTop: 10 }}>
          <span className="summary-key" style={{ fontWeight: 700, color: 'var(--purple)' }}>Seña para reservar (Hoy)</span>
          <span className="summary-val" style={{ fontWeight: 700, color: 'var(--purple)', fontSize: 18 }}>{formatPrice(Math.round((booking.pack_price ?? 0) / 2))}</span>
        </div>
        <div className="summary-row">
          <span className="summary-key">Saldo (Día de sesión)</span>
          <span className="summary-val">{formatPrice(Math.round((booking.pack_price ?? 0) / 2))}</span>
        </div>
      </div>

      <div className="payment-info-card" style={{ background: '#f8f4ff', border: '1px solid var(--purple-light)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <h4 style={{ color: 'var(--purple)', marginBottom: 8, fontSize: 14 }}>💳 Datos para el pago de la seña</h4>
        <p style={{ fontSize: 13, marginBottom: 4 }}>Para confirmar la reserva, debés enviar el comprobante de la seña:</p>
        <div style={{ background: 'white', padding: 10, borderRadius: 8, fontSize: 13, border: '1px solid var(--gray-100)' }}>
          <div><strong>Alias:</strong> <span style={{ color: 'var(--purple)', fontWeight: 700 }}>ro.giava</span></div>
          <div><strong>Banco:</strong> Galicia</div>
          <div style={{ marginTop: 4, color: 'var(--gray-500)', fontSize: 11 }}>O también podés abonar en efectivo.</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <a className="gcal-btn" href={gcalLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', maxWidth: 320 }}>
          <Calendar size={16}/> Agregar al Google Calendar
          <ExternalLink size={12}/>
        </a>
      </div>
      <div className="step-nav">
        <button className="btn-secondary" onClick={onBack}><ChevronLeft size={16}/> Atrás</button>
        <button className="btn-primary" onClick={onSubmit} disabled={submitting}>
          {submitting ? <><Loader2 size={16} className="spinning"/> Enviando...</> : <><Check size={16}/> Confirmar Reserva</>}
        </button>
      </div>
    </div>
  );
}

// ─── Success Screen ────────────────────────────────────────────────────────
function SuccessScreen({ booking, gcalLink, onNew }: {
  booking: Partial<Booking>;
  gcalLink: string;
  onNew: () => void;
}) {
  const half = Math.round((booking.pack_price ?? 0) / 2);
  return (
    <div className="confirmation-success">
      <div className="success-icon"><Check size={40}/></div>
      <h2>¡Solicitud enviada!</h2>
      <p>
        Gracias {booking.client_name}. Para terminar de reservar, recordá enviar el comprobante de la seña de <strong>{formatPrice(half)}</strong> al WhatsApp.
      </p>
      <div style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 12, margin: '16px 0', fontSize: 13, textAlign: 'left' }}>
        <strong>Datos de transferencia:</strong><br/>
        Alias: <span style={{ color: 'var(--purple)', fontWeight: 700 }}>ro.giava</span><br/>
        Banco: Galicia
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <a className="btn-outline-green" href={gcalLink} target="_blank" rel="noopener noreferrer">
          <Calendar size={16}/> Agregar al Google Calendar
        </a>
        <button className="btn-secondary" onClick={onNew}><RefreshCw size={14}/> Hacer otra reserva</button>
      </div>
    </div>
  );
}

// ─── Admin Backgrounds ───────────────────────────────────────────────────────
function AdminBackgrounds({ catalog, reloadCatalog }: { catalog: DbBackground[], reloadCatalog: () => void }) {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState(BACKGROUND_THEMES[0]);
  const [adding, setAdding] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setAdding(true);
      const compressed = await compressImage(dataUrl);
      await supabase.from('backgrounds').insert([{ name: name || file.name, theme, image_data: compressed }]);
      setAdding(false);
      setName('');
      reloadCatalog();
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que querés borrar este fondo?')) return;
    await supabase.from('backgrounds').delete().eq('id', id);
    await reloadCatalog();
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', gap: 10, margin: '20px 0', alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="Nombre (ej. Madera Blanca)" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <select className="filter-select" value={theme} onChange={e => setTheme(e.target.value)} style={{ minWidth: 150 }}>
          {BACKGROUND_THEMES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
        <label className="btn-primary" style={{ cursor: 'pointer', opacity: adding ? 0.5 : 1, whiteSpace: 'nowrap' }}>
          {adding ? <><Loader2 size={16} className="spinning"/> Subiendo...</> : '📷 Subir Imagen'}
          <input type="file" accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }} onChange={handleFile} disabled={adding} />
        </label>
      </div>
      
      {BACKGROUND_THEMES.map(t => {
        const items = catalog.filter(bg => (bg.theme === t) || (!bg.theme && t === 'otros'));
        if (items.length === 0) return null;
        return (
          <div key={t} style={{ marginBottom: 30 }}>
            <h4 style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 12, borderBottom: '1px solid var(--gray-200)', paddingBottom: 6 }}>{t}</h4>
            <div className="backgrounds-catalog-grid" style={{ marginTop: 0 }}>
              {items.map(bg => (
                <div key={bg.id} className="bg-catalog-card" style={{ flexWrap: 'wrap', gap: 8, padding: 8 }}>
                  <img src={bg.image_data} alt={bg.name} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }} />
                  <div className="bg-name" style={{ width: '100%', fontSize: 12 }}>{bg.name}</div>
                  <button className="btn-secondary" style={{ padding: '4px', fontSize: 10, width: '100%', color: 'var(--red)' }} onClick={() => handleDelete(bg.id)}>Borrar</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Admin Global Settings & Pack Configs ──────────────────────────────────────
function AdminGlobalSettings({ settings, reload }: { settings: GlobalSettings, reload: () => void }) {
  const [vals, setVals] = useState(settings);
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    await supabase.from('global_settings').upsert({ ...vals, id: 'default' });
    setSaving(false);
    reload();
  };

  // Sync state if fetched settings change
  useEffect(() => { setVals(settings); }, [settings]);

  return (
    <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 12, marginBottom: 30 }}>
      <h3 style={{ marginTop: 0 }}>Costos Unitarios Globales</h3>
      <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: -10, marginBottom: 15 }}>Estos costos se multiplicarán por las cantidades que incluya cada pack.</p>
      
      <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <span style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>13x18 ($)</span>
          <input type="number" className="form-input" style={{ width: 80 }} value={vals.cost_13x18} onChange={e => setVals({...vals, cost_13x18: Number(e.target.value)})} />
        </div>
        <div>
          <span style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>20x30 ($)</span>
          <input type="number" className="form-input" style={{ width: 80 }} value={vals.cost_20x30} onChange={e => setVals({...vals, cost_20x30: Number(e.target.value)})} />
        </div>
        <div>
          <span style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Fotolibro ($)</span>
          <input type="number" className="form-input" style={{ width: 80 }} value={vals.cost_fotolibro} onChange={e => setVals({...vals, cost_fotolibro: Number(e.target.value)})} />
        </div>
        <div>
          <span style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Imán ($)</span>
          <input type="number" className="form-input" style={{ width: 80 }} value={vals.cost_imanes} onChange={e => setVals({...vals, cost_imanes: Number(e.target.value)})} />
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Costos'}
        </button>
      </div>
    </div>
  );
}

function AdminPackConfigs({ configs, globalSettings, reload }: { configs: PackConfig[], globalSettings: GlobalSettings, reload: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [vals, setVals] = useState({ 
    price: 0, 
    cost_otros: 0,
    inclusions: ''
  });

  const handleEdit = (p: PackConfig) => {
    setEditing(p.pack_id);
    setVals({ 
      price: p.price, 
      cost_otros: p.cost_otros || 0,
      inclusions: p.inclusions || ''
    });
  };

  const handleSave = async (id: string, packDef: PackDefinition) => {
    const totalCost = (packDef.printQty13x18 * globalSettings.cost_13x18) + 
                      (packDef.printQty20x30 * globalSettings.cost_20x30) + 
                      (packDef.hasFotolibro ? globalSettings.cost_fotolibro : 0) + 
                      (packDef.imanesQty * globalSettings.cost_imanes) + 
                      (Number(vals.cost_otros) || 0);
                      
    await supabase.from('pack_configs').upsert({ 
      pack_id: id, 
      price: vals.price, 
      cost: totalCost,
      cost_otros: vals.cost_otros,
      inclusions: vals.inclusions
    });
    setEditing(null);
    await reload();
  };

  return (
    <div style={{ marginTop: 20 }}>
      <AdminGlobalSettings settings={globalSettings} reload={reload} />
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Pack</th>
              <th style={{ width: 250 }}>Inclusiones</th>
              <th>Precio ($)</th>
              <th>Costo ($)</th>
              <th>Ganancia ($)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ALL_CATEGORIES.flatMap(cat => PACKS.filter(p => p.category === cat)).map(p => {
              const conf = configs.find(c => c.pack_id === p.id) || { 
                pack_id: p.id, price: p.price, cost: 0,
                cost_otros: 0
              };
              const isEditing = editing === p.id;
              
              const calcCost = (p.printQty13x18 * globalSettings.cost_13x18) + 
                               (p.printQty20x30 * globalSettings.cost_20x30) + 
                               (p.hasFotolibro ? globalSettings.cost_fotolibro : 0) + 
                               (p.imanesQty * globalSettings.cost_imanes);
                               
              const totalCost = calcCost + (isEditing ? Number(vals.cost_otros) : Number(conf.cost_otros || 0));

              return (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong> <br/><small>{CATEGORY_LABELS[p.category]}</small></td>
                  <td>
                    {isEditing ? (
                      <textarea 
                        className="form-input" 
                        style={{ width: '100%', fontSize: 11, minHeight: 60 }} 
                        value={vals.inclusions} 
                        onChange={e => setVals({...vals, inclusions: e.target.value})}
                        placeholder={formatPackDetails(p)}
                      />
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--gray-600)' }}>{conf.inclusions || formatPackDetails(p)}</div>
                    )}
                  </td>
                  <td>
                    {isEditing ? <input type="number" className="form-input" style={{ width: 80 }} value={vals.price} onChange={e => setVals({...vals, price: Number(e.target.value)})} /> : formatPrice(conf.price)}
                  </td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 10, color: 'var(--gray-500)' }}>
                          Base global: {formatPrice(calcCost)}<br/>
                          (13x18: {p.printQty13x18}, 20x30: {p.printQty20x30}, Libro: {p.hasFotolibro ? 1: 0}, Imán: {p.imanesQty})
                        </div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11 }}>Otro Extra: <input type="number" className="form-input" style={{ width: 60, padding: '4px' }} value={vals.cost_otros} onChange={e => setVals({...vals, cost_otros: Number(e.target.value)})} /></div>
                        <strong style={{ fontSize: 12 }}>Total: {formatPrice(totalCost)}</strong>
                      </div>
                    ) : (
                      <div>
                        {formatPrice(totalCost)}
                        {conf.cost_otros! > 0 && <div style={{ fontSize: 9, color: 'var(--gray-400)', marginTop: 4 }}>Otros: {formatPrice(conf.cost_otros!)}</div>}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--green)' }}>
                    {formatPrice((isEditing ? vals.price : conf.price) - totalCost)}
                  </td>
                  <td>
                    {isEditing ? (
                      <button className="btn-primary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleSave(p.id, p)}>Guardar</button>
                    ) : (
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleEdit(conf)}>Editar/Desglosar</button>
                    )
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Admin Panel ───────────────────────────────────────────────────────────
function AdminPanel({ catalog, reloadCatalog, onClose, globalSettings, reloadGlobalSettings }: { catalog: DbBackground[], reloadCatalog: () => void, onClose: () => void, globalSettings: GlobalSettings, reloadGlobalSettings: () => void }) {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState(false);
  const [tab, setTab] = useState<'bookings' | 'analytics' | 'backgrounds' | 'packs'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packConfigs, setPackConfigs] = useState<PackConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [analyticsYear, setAnalyticsYear] = useState('all');
  const [analyticsMonth, setAnalyticsMonth] = useState('all');

  const login = () => {
    if (pwd === ADMIN_PASSWORD) { setAuthed(true); setPwdError(false); }
    else { setPwdError(true); }
  };

  const loadPackConfigs = async () => {
    const { data } = await supabase.from('pack_configs').select('*');
    if (data) setPackConfigs(data as PackConfig[]);
  };

  const loadBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (!error && data) setBookings(data as Booking[]);
    await loadPackConfigs();
    setLoading(false);
  };

  useEffect(() => { if (authed) loadBookings(); }, [authed]);

  const updateStatus = async (id: string, status: Booking['status']) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  // Filtering
  const filtered = bookings.filter(b => {
    if (filterStatus && b.status !== filterStatus) return false;
    if (filterType && b.session_type !== filterType) return false;
    if (filterDateFrom && b.session_date < filterDateFrom) return false;
    if (filterDateTo && b.session_date > filterDateTo) return false;
    return true;
  });

  // Analytics filtering
  const analyticsBkgs = bookings.filter(b => {
    if (analyticsYear !== 'all' && b.created_at && !b.created_at.startsWith(analyticsYear)) return false;
    if (analyticsMonth !== 'all' && b.created_at) {
      const m = b.created_at.slice(5, 7);
      if (m !== analyticsMonth.padStart(2, '0')) return false;
    }
    return b.status !== 'cancelled';
  });

  const totalRevenue = analyticsBkgs.reduce((sum, b: Booking) => sum + (b.pack_price || 0), 0);
  const totalCost = analyticsBkgs.reduce((sum, b: Booking) => sum + (Number(b.cost) || 0), 0);

  // Per-category stats
  const categoryStats = ALL_CATEGORIES.map(cat => ({
    cat,
    count: analyticsBkgs.filter((b: Booking) => b.session_type === cat).length,
    revenue: analyticsBkgs.filter((b: Booking) => b.session_type === cat).reduce((s, b: Booking) => s + (b.pack_price || 0), 0),
  })).sort((a, b) => b.revenue - a.revenue);
  const maxCatRevenue = Math.max(...categoryStats.map(c => c.revenue), 1);

  // Per-pack stats
  const packMap = new Map<string, { name: string; count: number; revenue: number }>();
  analyticsBkgs.forEach((b: Booking) => {
    if (!b.pack_id) return;
    const cur = packMap.get(b.pack_id) || { name: b.pack_name, count: 0, revenue: 0 };
    packMap.set(b.pack_id, { name: b.pack_name, count: cur.count + 1, revenue: cur.revenue + (b.pack_price || 0) });
  });
  const packStats = Array.from(packMap.values()).sort((a, b) => b.revenue - a.revenue);
  const maxPackRevenue = Math.max(...packStats.map(p => p.revenue), 1);

  const years = [...new Set(bookings.map(b => b.created_at?.slice(0, 4)).filter(Boolean))];

  if (!authed) {
    return (
      <div className="admin-overlay">
        <div className="admin-panel">
          <div className="admin-header">
            <div>
              <h2>🔒 Panel de Administración</h2>
              <p>Rocío Giavarini Fotografía</p>
            </div>
            <button className="admin-close-btn" onClick={onClose}><X size={16}/> Cerrar</button>
          </div>
          <div className="admin-login">
            <div className="admin-login-card">
              <h3>Acceso Admin</h3>
              <p>Ingresá tu contraseña para continuar</p>
              <div className="form-group">
                <input
                  className={`form-input${pwdError ? ' error' : ''}`}
                  type="password"
                  placeholder="Contraseña"
                  value={pwd}
                  onChange={e => setPwd(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && login()}
                  style={pwdError ? { borderColor: 'var(--red)' } : {}}
                  autoFocus
                />
                {pwdError && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 5 }}>Contraseña incorrecta</p>}
              </div>
              <button className="btn-primary" style={{ width: '100%' }} onClick={login}><Lock size={16}/> Entrar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <div>
            <h2>Panel de Administración</h2>
            <p>Rocío Giavarini Fotografía · {bookings.length} reservas totales</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-close-btn" onClick={loadBookings}><RefreshCw size={14}/></button>
            <button className="admin-close-btn" onClick={onClose}><LogOut size={14}/> Salir</button>
          </div>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab${tab === 'bookings' ? ' active' : ''}`} onClick={() => setTab('bookings')}>
            <List size={14}/> Reservas
          </button>
          <button className={`admin-tab${tab === 'analytics' ? ' active' : ''}`} onClick={() => setTab('analytics')}>
            <BarChart3 size={14}/> Ganancias y Estadísticas
          </button>
          <button className={`admin-tab${tab === 'backgrounds' ? ' active' : ''}`} onClick={() => setTab('backgrounds')}>
            <Image size={14}/> Fondos del Catálogo
          </button>
          <button className={`admin-tab${tab === 'packs' ? ' active' : ''}`} onClick={() => setTab('packs')}>
            <Lock size={14}/> Configuración Packs
          </button>
        </div>

        <div className="admin-body">
          {loading ? (
            <div className="spinner"/>
          ) : tab === 'backgrounds' ? (
            <AdminBackgrounds catalog={catalog} reloadCatalog={reloadCatalog} />
          ) : tab === 'packs' ? (
            <AdminPackConfigs configs={packConfigs} globalSettings={globalSettings} reload={() => { loadPackConfigs(); reloadGlobalSettings(); }} />
          ) : tab === 'bookings' ? (
            <>
              <div className="admin-filters">
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
                <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">Todos los tipos</option>
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
                <input type="date" className="filter-input" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} placeholder="Desde"/>
                <input type="date" className="filter-input" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} placeholder="Hasta"/>
                <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => { setFilterStatus(''); setFilterType(''); setFilterDateFrom(''); setFilterDateTo(''); }}>
                  Limpiar
                </button>
              </div>
              {filtered.length === 0 ? (
                <div className="empty-state"><Calendar size={48}/><p>No se encontraron reservas</p></div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha reserva</th>
                        <th>Cliente</th>
                        <th>WhatsApp</th>
                        <th>Tipo sesión</th>
                        <th>Pack</th>
                        <th>Fondos</th>
                        <th>Fecha sesión</th>
                        <th>Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(b => (
                        <tr key={b.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{b.created_at ? new Date(b.created_at).toLocaleDateString('es-AR') : '–'}</td>
                          <td style={{ fontWeight: 700 }}>{b.client_name}</td>
                          <td>{b.client_phone}</td>
                          <td>{CATEGORY_LABELS[b.session_type]} {CATEGORY_EMOJIS[b.session_type]}</td>
                          <td>{b.pack_name}</td>
                          <td style={{ textAlign: 'center' }}>{b.backgrounds_qty > 0 ? b.backgrounds_qty : '–'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {b.session_date ? new Date(b.session_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}
                          </td>
                          <td style={{ fontWeight: 700 }}>{formatPrice(b.pack_price)}</td>
                          <td>
                            <select
                              className="status-select"
                              value={b.status}
                              onChange={e => updateStatus(b.id!, e.target.value as Booking['status'])}
                              style={{ color: b.status === 'confirmed' ? 'var(--green)' : b.status === 'cancelled' ? 'var(--red)' : 'var(--yellow)' }}
                            >
                              <option value="pending">⏳ Pendiente</option>
                              <option value="confirmed">✅ Confirmada</option>
                              <option value="cancelled">❌ Cancelada</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            /* ─── Analytics Tab ─── */
            <>
              <div className="admin-filters">
                <select className="filter-select" value={analyticsYear} onChange={e => setAnalyticsYear(e.target.value)}>
                  <option value="all">Todos los años</option>
                  {years.map(y => <option key={y} value={y!}>{y}</option>)}
                </select>
                <select className="filter-select" value={analyticsMonth} onChange={e => setAnalyticsMonth(e.target.value)}>
                  <option value="all">Todos los meses</option>
                  {MONTH_NAMES.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                </select>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="label">Total Ingresos</div>
                  <div className="value" style={{ fontSize: 18 }}>{formatPrice(totalRevenue)}</div>
                  <div className="sub">período actual</div>
                </div>
                <div className="analytics-card">
                  <div className="label">Total Costos</div>
                  <div className="value" style={{ color: 'var(--red)', fontSize: 18 }}>{formatPrice(totalCost)}</div>
                  <div className="sub">gastos estimados</div>
                </div>
                <div className="analytics-card">
                  <div className="label">Ganancia Neta</div>
                  <div className="value" style={{ color: 'var(--green)', fontSize: 20 }}>{formatPrice(totalRevenue - totalCost)}</div>
                  <div className="sub">después de costos</div>
                </div>
                <div className="analytics-card">
                  <div className="label">Reservas</div>
                  <div className="value">{analyticsBkgs.length}</div>
                  <div className="sub">confirmadas + pendientes</div>
                </div>
              </div>

              <div className="bar-chart">
                <h4>💰 Ganancias por tipo de sesión</h4>
                {categoryStats.map(cs => (
                  <div key={cs.cat} className="bar-row">
                    <div className="bar-label">{CATEGORY_EMOJIS[cs.cat]} {CATEGORY_LABELS[cs.cat]}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(cs.revenue / maxCatRevenue) * 100}%` }}/>
                    </div>
                    <div className="bar-val">{formatPrice(cs.revenue)}</div>
                  </div>
                ))}
              </div>

              <div className="bar-chart">
                <h4>📦 Packs más vendidos</h4>
                {packStats.length === 0 ? (
                  <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>No hay datos aún</p>
                ) : packStats.map(ps => (
                  <div key={ps.name} className="bar-row">
                    <div className="bar-label">{ps.name} <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>({ps.count}x)</span></div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(ps.revenue / maxPackRevenue) * 100}%` }}/>
                    </div>
                    <div className="bar-val">{formatPrice(ps.revenue)}</div>
                  </div>
                ))}
              </div>

              <div className="bar-chart">
                <h4>📊 Cantidad de reservas por tipo</h4>
                {categoryStats.map(cs => {
                  const maxCount = Math.max(...categoryStats.map(c => c.count), 1);
                  return (
                    <div key={cs.cat} className="bar-row">
                      <div className="bar-label">{CATEGORY_EMOJIS[cs.cat]} {CATEGORY_LABELS[cs.cat]}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(cs.count / maxCount) * 100}%` }}/>
                      </div>
                      <div className="bar-val">{cs.count} {cs.count === 1 ? 'sesión' : 'sesiones'}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
const STEPS = ['Sesión', 'Pack', 'Fondos', 'Fecha', 'Datos', 'Confirmar'];

export default function App() {
  const [step, setStep] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState('');

  // Booking state
  const [category, setCategory] = useState<SessionCategory | null>(null);
  const [pack, setPack] = useState<PackDefinition | null>(null);
  const [backgrounds, setBackgrounds] = useState(1);
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string>('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', attendees: '', notes: '', deliveryDate: '' });
  const [catalog, setCatalog] = useState<DbBackground[]>([]);
  const [packConfigs, setPackConfigs] = useState<PackConfig[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ id: 'default', cost_13x18: 0, cost_20x30: 0, cost_fotolibro: 0, cost_imanes: 0 });

  const loadData = async () => {
    const { data: bgData } = await supabase.from('backgrounds').select('*').order('created_at', { ascending: true });
    if (bgData) setCatalog(bgData as DbBackground[]);

    const { data: pcData } = await supabase.from('pack_configs').select('*');
    if (pcData) setPackConfigs(pcData as PackConfig[]);
    
    const { data: gData } = await supabase.from('global_settings').select('*').eq('id', 'default').maybeSingle();
    if (gData) setGlobalSettings(gData as GlobalSettings);
  };

  useEffect(() => { loadData(); }, []);

  // Override pack prices with dynamic values
  const getPackPrice = (p: PackDefinition) => {
    const conf = packConfigs.find(c => c.pack_id === p.id);
    return conf ? conf.price : p.price;
  };

  const getPackInclusions = (p: PackDefinition) => {
    const conf = packConfigs.find(c => c.pack_id === p.id);
    return conf?.inclusions || formatPackDetails(p);
  };

  const getPackCost = (p: PackDefinition) => {
    const conf = packConfigs.find(c => c.pack_id === p.id);
    let base = conf?.cost_otros || 0;
    base += (p.printQty13x18 * globalSettings.cost_13x18);
    base += (p.printQty20x30 * globalSettings.cost_20x30);
    if (p.hasFotolibro) base += globalSettings.cost_fotolibro;
    base += (p.imanesQty * globalSettings.cost_imanes);
    return base;
  };

  const isInfantil = category === 'infantil_estudio';

  // Steps adjusted: skip backgrounds step for non-infantil
  const effectiveStepLabels = isInfantil ? STEPS : STEPS.filter(s => s !== 'Fondos');

  // Map display step index to logical step
  // Logical steps: 0=category, 1=pack, 2=backgrounds(infantil only), 3=date, 4=form, 5=confirm
  // When not infantil: 0=cat,1=pack,2=date,3=form,4=confirm

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const canProceed = () => {
    if (step === 0) return !!category;
    if (step === 1) return !!pack;
    if (isInfantil && step === 2) return backgrounds >= 1 && selectedBackgrounds.length === backgrounds;
    const dateStep = isInfantil ? 3 : 2;
    const formStep = isInfantil ? 4 : 3;
    if (step === dateStep) return !!date && !!time;
    if (step === formStep) return form.name.trim().length > 1 && form.phone.length >= 8 && form.attendees.trim().length > 1;
    return true;
  };

  const next = () => {
    if (!canProceed()) {
      const msgs: Record<number, string> = {
        0: 'Por favor elegí un tipo de sesión',
        1: 'Por favor elegí un pack',
        2: isInfantil ? `Elegí ${backgrounds} fondo(s)` : '',
        [isInfantil ? 3 : 2]: 'Por favor elegí una fecha y horario',
        [isInfantil ? 4 : 3]: 'Por favor completá los datos obligatorios',
      };
      showToast(msgs[step] || '');
      return;
    }
    setStep(s => s + 1);
  };

  const prev = () => setStep(s => Math.max(0, s - 1));

  const booking: Partial<Booking> = {
    client_name: form.name,
    client_email: form.email,
    client_phone: form.phone,
    attendees: form.attendees,
    session_type: category!,
    pack_id: pack?.id || '',
    pack_name: pack?.name || '',
    pack_price: pack ? getPackPrice(pack) : 0,
    cost: pack ? getPackCost(pack) : 0,
    backgrounds_qty: isInfantil ? backgrounds : 0,
    selected_backgrounds: isInfantil ? selectedBackgrounds : [],
    session_date: date || '',
    session_time: time || '',
    notes: form.notes,
    status: 'pending',
  };

  const gcalLink = makeGCalLink(booking);

  const submit = async () => {
    setSubmitting(true);
    try {
      await supabase.from('bookings').insert([booking]).select().single();
    } catch (e) {
      console.warn("Could not save to Supabase, continuing to WhatsApp", e);
    } finally {
      setSubmitting(false);
      setDone(true);
      
      const text = `¡Hola! Quiero confirmar una reserva:\n\n` +
      `*Cliente:* ${booking.client_name}\n` +
      `*Teléfono:* ${booking.client_phone}\n` +
      `${booking.client_email ? `*Email:* ${booking.client_email}\n` : ''}` +
      `*Asistentes:* ${booking.attendees}\n` +
      `\n*Sesión:* ${CATEGORY_LABELS[booking.session_type!]}\n` +
      `*Pack:* ${booking.pack_name} ($ ${booking.pack_price})\n` +
      `${booking.backgrounds_qty ? `*Fondos elegidos:* ${booking.selected_backgrounds?.map(id => catalog.find(b => b.id === id)?.name).join(', ')}\n` : ''}` +
      `*Fecha:* ${booking.session_date} a las ${booking.session_time}\n` +
      `${form.deliveryDate ? `*Fecha límite de entrega:* ${form.deliveryDate}\n` : ''}` +
      `${booking.notes ? `\n*Mensaje:* ${booking.notes}\n` : ''}\n` +
      `--- Pago ---\n` +
      `*Total:* ${formatPrice(booking.pack_price!)}\n` +
      `*Seña a transferir:* ${formatPrice(Math.round(booking.pack_price! / 2))}\n` +
      `*Saldo día sesión:* ${formatPrice(Math.round(booking.pack_price! / 2))}`;
      
      const whatsappUrl = `https://api.whatsapp.com/send/?phone=5493416248663&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const reset = () => {
    setStep(0); setDone(false);
    setCategory(null); setPack(null); setBackgrounds(1); setSelectedBackgrounds([]); setDate(null); setTime('');
    setForm({ name: '', email: '', phone: '', attendees: '', notes: '', deliveryDate: '' });
  };

  // Determine which logical step maps to which display step
  const dateStep = isInfantil ? 3 : 2;
  const formStep = isInfantil ? 4 : 3;
  const confirmStep = isInfantil ? 5 : 4;

  const toggleBackground = (id: string) => {
    setSelectedBackgrounds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const renderStep = () => {
    if (step === 0) return <StepCategory selected={category} onSelect={c => { setCategory(c); setPack(null); }}/>;
    if (step === 1) return <StepPack category={category!} selected={pack} onSelect={setPack} getPackPrice={getPackPrice} getPackInclusions={getPackInclusions}/>;
    if (isInfantil && step === 2) return <StepBackgrounds pack={pack!} value={backgrounds} onChange={setBackgrounds} selectedBackgrounds={selectedBackgrounds} onToggleBackground={toggleBackground} catalog={catalog}/>;
    if (step === dateStep) return <StepCalendar category={category!} selected={date} time={time} onSelect={setDate} onSelectTime={setTime}/>;
    if (step === formStep) return <StepForm data={form} onChange={d => setForm(f => ({ ...f, ...d }))}/>;
    if (step === confirmStep) return (
      <StepConfirm
        booking={booking}
        gcalLink={gcalLink}
        onBack={prev}
        onSubmit={submit}
        submitting={submitting}
      />
    );
    return null;
  };

  const progressSteps = effectiveStepLabels;

  const getStepStatus = (i: number) => {
    if (i < step) return 'done';
    if (i === step) return 'active';
    return '';
  };

  return (
    <div className="booking-app">
      {/* Header */}
      <header className="booking-header">
        <div className="booking-header-logo"><Camera/></div>
        <div>
          <h1>Reservar Sesión</h1>
          <span>Rocío Giavarini Fotografía</span>
        </div>
        <button className="booking-header-admin" onClick={() => setShowAdmin(true)}>
          <Lock size={12}/> Admin
        </button>
      </header>

      {/* Progress */}
      {!done && (
        <div className="progress-bar-container">
          <div className="progress-steps">
            {progressSteps.map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div className={`progress-connector${i <= step ? ' done' : ''}`}/>}
                <div className={`progress-step ${getStepStatus(i)}`}>
                  <div className="progress-step-circle">
                    {i < step ? <Check size={14}/> : i + 1}
                  </div>
                  <span className="progress-step-label">{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="booking-content">
        {done ? (
          <SuccessScreen booking={booking} gcalLink={gcalLink} onNew={reset}/>
        ) : (
          <>
            {renderStep()}

            {/* Nav (except confirm step which has its own) */}
            {step !== confirmStep && step < confirmStep && (
              <div className="step-nav">
                {step > 0
                  ? <button className="btn-secondary" onClick={prev}><ChevronLeft size={16}/> Atrás</button>
                  : <div/>
                }
                <button className="btn-primary" onClick={next}>
                  {step === confirmStep - 1 ? 'Revisar reserva' : 'Siguiente'} <ChevronRight size={16}/>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Admin Panel */}
      {showAdmin && <AdminPanel catalog={catalog} reloadCatalog={loadData} globalSettings={globalSettings} reloadGlobalSettings={loadData} onClose={() => setShowAdmin(false)}/>}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Spinner style */}
      <style>{`.spinning { animation: spin 0.8s linear infinite; }`}</style>
    </div>
  );
}
