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
    <div className="w-full bg-white rounded-lg space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-2">
        Información de Envío
      </h2>

      {/* 🌍 País */}
      <div>
        <label
          htmlFor="country"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          País
        </label>
        <select
          id="country"
          name="country"
          value={formData.country}
          onChange={handleCountrySelect} // ✅ ahora usa la versión híbrida
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecciona un país</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      {/* 🏙️ Estado */}
      <div>
        <label
          htmlFor="state"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Estado / Provincia
        </label>
        <select
          id="state"
          name="state"
          value={formData.state}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!formData.country}
        >
          <option value="">Selecciona un estado</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* 🌆 Ciudad */}
      <div>
        <label
          htmlFor="city"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Ciudad
        </label>
        <select
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!formData.state}
        >
          <option value="">Selecciona una ciudad</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* 🏠 Calle y número */}
      <div>
        <label
          htmlFor="street"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Calle y número
        </label>
        <input
          id="street"
          name="street"
          type="text"
          value={formData.street}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 📮 Código postal */}
      <div>
        <label
          htmlFor="postalCode"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Código postal
        </label>
        <input
          id="postalCode"
          name="postalCode"
          type="text"
          value={formData.postalCode}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      
    </div>
  );
}
