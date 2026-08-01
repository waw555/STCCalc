import React from 'react';
import { Currency, UserSession } from '../types';
import { RefreshCw, UserCheck, LogIn, LogOut, Printer, Calculator, Cloud, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currencies: Currency[];
  selectedCurrency: string;
  onSelectCurrency: (code: string) => void;
  onRefreshRates: () => void;
  isRefreshing: boolean;
  userSession: UserSession;
  onOpenLogin: () => void;
  onLogout: () => void;
  orgName: string;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currencies,
  selectedCurrency,
  onSelectCurrency,
  onRefreshRates,
  isRefreshing,
  userSession,
  onOpenLogin,
  onLogout,
  orgName,
  isCloudSynced = true,
}) => {
  const activeEur = currencies.find(c => c.code === 'EUR')?.rateToRub || 98.45;
  const activeUsd = currencies.find(c => c.code === 'USD')?.rateToRub || 89.20;

  return (
    <header className="bg-slate-900 text-white shadow-xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Org title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Calculator className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  STCCalc
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  HPL / Компакт-плиты
                </span>
                {isCloudSynced ? (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Облако БД активна</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Подключение к БД...</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {orgName || 'Калькулятор коммерческих расчётов и прайс-листы'}
              </p>
            </div>
          </div>

          {/* Exchange Rates & Controls */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            
            {/* Rates Badge */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Курсы ЦБ:</span>
              <span className="text-xs font-semibold text-slate-200">€ 1 = {activeEur.toFixed(2)} ₽</span>
              <span className="text-xs font-semibold text-slate-200">$ 1 = {activeUsd.toFixed(2)} ₽</span>
              <button
                onClick={onRefreshRates}
                disabled={isRefreshing}
                title="Обновить курсы с ЦБ РФ"
                className="p-1 hover:bg-slate-700 rounded transition text-blue-400 hover:text-blue-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1">
              <span className="text-xs text-slate-400 font-medium">Валюта:</span>
              <div className="flex items-center gap-1 bg-slate-900 rounded-md p-0.5 border border-slate-700">
                {/* Main fixed buttons for RUB, EUR, USD */}
                {['RUB', 'EUR', 'USD'].map(code => {
                  const hasCurr = currencies.some(c => c.code === code);
                  if (!hasCurr) return null;
                  return (
                    <button
                      key={code}
                      onClick={() => onSelectCurrency(code)}
                      className={`px-2 py-0.5 text-xs font-semibold rounded transition ${
                        selectedCurrency === code
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}

                {/* Select dropdown if there are additional active currencies */}
                {currencies.filter(c => !['RUB', 'EUR', 'USD'].includes(c.code)).length > 0 && (
                  <select
                    value={['RUB', 'EUR', 'USD'].includes(selectedCurrency) ? '' : selectedCurrency}
                    onChange={(e) => {
                      if (e.target.value) onSelectCurrency(e.target.value);
                    }}
                    className={`text-xs font-semibold rounded px-1.5 py-0.5 outline-none bg-slate-800 border ${
                      !['RUB', 'EUR', 'USD'].includes(selectedCurrency)
                        ? 'bg-blue-600 text-white border-blue-500 font-bold'
                        : 'text-slate-300 border-slate-700'
                    }`}
                  >
                    <option value="" disabled hidden>
                      + Ещё
                    </option>
                    {currencies
                      .filter(c => !['RUB', 'EUR', 'USD'].includes(c.code))
                      .map(c => (
                        <option key={c.code} value={c.code} className="bg-slate-900 text-white font-medium">
                          {c.code} ({c.name})
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>

            {/* Print button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать</span>
            </button>

            {/* User Auth */}
            {userSession.isLoggedIn ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-slate-200">
                  {userSession.username} ({userSession.role === 'admin' ? 'Админ' : 'Менеджер'})
                </span>
                <button
                  onClick={onLogout}
                  title="Выйти"
                  className="ml-1 text-slate-400 hover:text-rose-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Войти</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
