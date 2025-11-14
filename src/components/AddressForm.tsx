/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import axios from "axios";

interface AddressFormProps {
  formData: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCountryChange: (country: string) => void; // ✅ ahora sí lo vamos a usar
}

export default function AddressForm({
  formData,
  handleChange,
  onCountryChange,
}: AddressFormProps) {
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [shippingInfo, setShippingInfo] = useState<any | null>(null);

  // 🗺️ Tabla local de zonas y tarifas (modelo híbrido)
  const localZones = [
    { country: "México", zone: "Nacional", baseRate: 120, days: 2 },
    { country: "Estados Unidos", zone: "Internacional", baseRate: 300, days: 5 },
    { country: "Canadá", zone: "Internacional", baseRate: 350, days: 6 },
  ];

  // 🌎 Cargar lista de países
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await axios.get(
          "https://countriesnow.space/api/v0.1/countries/positions"
        );
        const data = res.data?.data?.map((item: any) => item.name);
        setCountries(data || []);
      } catch (err) {
        console.error("Error al obtener países", err);
      }
    };
    fetchCountries();
  }, []);

  // 🧭 Cargar estados al cambiar país
  useEffect(() => {
    const fetchStates = async () => {
      if (!formData.country) return;
      try {
        const res = await axios.post(
          "https://countriesnow.space/api/v0.1/countries/states",
          { country: formData.country }
        );
        const data = res.data?.data?.states?.map((s: any) => s.name);
        setStates(data || []);
      } catch (err) {
        console.error("Error al obtener estados", err);
      }
    };
    fetchStates();
  }, [formData.country]);

  // 🏙️ Cargar ciudades al cambiar estado
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.state || !formData.country) return;
      try {
        const res = await axios.post(
          "https://countriesnow.space/api/v0.1/countries/state/cities",
          {
            country: formData.country,
            state: formData.state,
          }
        );
        setCities(res.data?.data || []);
      } catch (err) {
        console.error("Error al obtener ciudades", err);
      }
    };
    fetchCities();
  }, [formData.state, formData.country]);

  // 🔄 Calcular tarifa híbrida al cambiar país
  const handleCountrySelect = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    handleChange(e); // actualiza formData
    const selectedCountry = e.target.value;

    // Llamar a la función de envío del padre
    onCountryChange(selectedCountry);

    try {
      // Primero intentamos con la API (por ejemplo, tu endpoint interno)
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selectedCountry, weight: 1 }),
      });

      if (res.ok) {
        const data = await res.json();
        setShippingInfo({
          source: "API",
          cost: data.shippingCost,
          days: data.estimatedDays,
          zone: data.zone,
        });
      } else {
        throw new Error("Fallo API, usando tabla local");
      }
    } catch {
      // Si falla la API, usar la tabla local
      const fallback = localZones.find((z) => z.country === selectedCountry);
      if (fallback) {
        setShippingInfo({
          source: "Tabla Local",
          cost: fallback.baseRate,
          days: fallback.days,
          zone: fallback.zone,
        });
      } else {
        setShippingInfo(null);
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header de la sección */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Dirección de envío
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Donde entregaremos tu pedido
        </p>
      </div>

      {/* Campos del formulario */}
      <div className="grid grid-cols-1 gap-6">
        {/* 🌍 País */}
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            País
          </label>
          <div className="relative">
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleCountrySelect}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 bg-gray-50 focus:bg-white appearance-none
                        cursor-pointer"
            >
              <option value="">Selecciona un país</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 🏙️ Estado */}
        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Estado / Provincia
          </label>
          <div className="relative">
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 bg-gray-50 focus:bg-white appearance-none
                        cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={!formData.country}
            >
              <option value="">Selecciona un estado</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {!formData.country && (
            <p className="text-sm text-gray-500 mt-2">
              Selecciona un país primero para habilitar esta opción
            </p>
          )}
        </div>

        {/* 🌆 Ciudad */}
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Ciudad
          </label>
          <div className="relative">
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 bg-gray-50 focus:bg-white appearance-none
                        cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={!formData.state}
            >
              <option value="">Selecciona una ciudad</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {!formData.state && (
            <p className="text-sm text-gray-500 mt-2">
              Selecciona un estado primero para habilitar esta opción
            </p>
          )}
        </div>

        {/* 🏠 Calle y número */}
        <div>
          <label
            htmlFor="street"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Dirección completa
          </label>
          <div className="relative">
            <input
              id="street"
              name="street"
              type="text"
              placeholder="Calle, número, colonia"
              value={formData.street}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 bg-gray-50 focus:bg-white pl-11"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
        </div>

        {/* 📮 Código postal */}
        <div>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Código postal
          </label>
          <div className="relative">
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              placeholder="Ej. 11520"
              value={formData.postalCode}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 bg-gray-50 focus:bg-white pl-11"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">
              Tu información está segura
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Solo usaremos esta dirección para entregar tu pedido. No compartiremos tus datos con terceros.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
