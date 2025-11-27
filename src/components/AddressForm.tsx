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
  onCountryChange: (country: string) => void;
  formErrors?: Record<string, string>;
  shouldShowError?: (fieldName: string) => boolean; // ← Nueva prop
  markFieldAsTouched?: (fieldName: string) => void;
}

interface Country {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
}

export default function AddressForm({
  formData,
  handleChange,
  onCountryChange,
  formErrors = {},
  shouldShowError = () => false, // ← Valor por defecto
  markFieldAsTouched = () => {}, 
}: AddressFormProps) {
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [shippingInfo, setShippingInfo] = useState<any | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(true);
  
  // Estados para controlar si el usuario está escribiendo manualmente
  const [isManualState, setIsManualState] = useState(false);
  const [isManualCity, setIsManualCity] = useState(false);

  // 🗺️ Datos locales para estados y ciudades
  const localStatesAndCities: { [key: string]: { states: string[] } } = {
    "Mexico": {
      states: ["Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"]
    },
    "United States": {
      states: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
    },
    "Canada": {
      states: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"]
    },
    "Spain": {
      states: ["Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria", "Castilla-La Mancha", "Castilla y León", "Cataluña", "Extremadura", "Galicia", "Madrid", "Murcia", "Navarra", "País Vasco", "La Rioja", "Valencia"]
    },
    "Argentina": {
      states: ["Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"]
    },
    "Brazil": {
      states: ["Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"]
    },
    "Chile": {
      states: ["Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", "Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"]
    },
    "Colombia": {
      states: ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"]
    },
    "Peru": {
      states: ["Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"]
    }
  };

  // 🗺️ Ciudades genéricas por tipo de estado
  const getCitiesForState = (state: string): string[] => {
    const cityTemplates = [
      "Ciudad Principal",
      "Ciudad Norte",
      "Ciudad Sur", 
      "Ciudad Este",
      "Ciudad Oeste",
      "Villa Central",
      "Pueblo Nuevo"
    ];
    
    return cityTemplates.map(city => `${city} de ${state}`);
  };

  // 🗺️ Tabla local de zonas y tarifas
  const localZones = [
    { country: "Mexico", zone: "Nacional", baseRate: 120, days: 2 },
    { country: "United States", zone: "Internacional", baseRate: 300, days: 5 },
    { country: "Canada", zone: "Internacional", baseRate: 350, days: 6 },
    { country: "Spain", zone: "Internacional", baseRate: 280, days: 4 },
    { country: "France", zone: "Internacional", baseRate: 320, days: 5 },
    { country: "Germany", zone: "Internacional", baseRate: 320, days: 5 },
    { country: "United Kingdom", zone: "Internacional", baseRate: 310, days: 5 },
    { country: "Argentina", zone: "Internacional", baseRate: 250, days: 4 },
    { country: "Brazil", zone: "Internacional", baseRate: 270, days: 5 },
    { country: "Chile", zone: "Internacional", baseRate: 240, days: 4 },
    { country: "Colombia", zone: "Internacional", baseRate: 230, days: 4 },
    { country: "Peru", zone: "Internacional", baseRate: 240, days: 4 },
  ];

  // 🌎 Cargar lista de países desde REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        console.log("Cargando países desde REST Countries API...");
        
        const res = await axios.get<Country[]>(
          "https://restcountries.com/v3.1/all?fields=name,cca2"
        );
        
        console.log("Países cargados exitosamente:", res.data.length);
        
        // Extraer nombres de países y ordenar alfabéticamente
        const countryNames = res.data
          .map((country: Country) => country.name.common)
          .sort((a: string, b: string) => a.localeCompare(b));
        
        setCountries(countryNames);
        
      } catch (err: any) {
        console.error("Error al obtener países:", err.message);
        
        // Datos de respaldo en caso de error
        const backupCountries = [
          "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", 
          "Chile", "China", "Colombia", "Costa Rica", "Denmark", "France", 
          "Germany", "India", "Italy", "Japan", "Mexico", "Netherlands", 
          "Peru", "Spain", "United Kingdom", "United States"
        ].sort();
        
        setCountries(backupCountries);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // 🧭 Cargar estados desde datos locales al cambiar país
  useEffect(() => {
    if (!formData.country) {
      setStates([]);
      setCities([]);
      setIsManualState(false);
      setIsManualCity(false);
      return;
    }

    // Buscar estados en datos locales
    const countryData = localStatesAndCities[formData.country];
    if (countryData) {
      setStates(countryData.states);
    } else {
      // Estados genéricos para países no listados
      const genericStates = [
        "Estado Principal",
        "Estado Norte", 
        "Estado Sur",
        "Estado Este",
        "Estado Oeste"
      ];
      setStates(genericStates);
    }
    
    // Limpiar ciudades cuando cambia el país
    setCities([]);
    setIsManualState(false);
    setIsManualCity(false);
  }, [formData.country]);

  // 🏙️ Cargar ciudades al cambiar estado
  useEffect(() => {
    if (!formData.state) {
      setCities([]);
      setIsManualCity(false);
      return;
    }

    // Si el estado no está en la lista, el usuario está escribiendo manualmente
    if (!states.includes(formData.state) && formData.state !== "") {
      setIsManualState(true);
    } else {
      setIsManualState(false);
    }

    // Generar ciudades basadas en el estado seleccionado
    const citiesForState = getCitiesForState(formData.state);
    setCities(citiesForState);
  }, [formData.state, states]);

  // Manejar cambio en ciudad para detectar escritura manual
  const handleCityChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    handleChange(e);
    const value = e.target.value;
    
    // Detectar si el usuario está escribiendo manualmente
    if (!cities.includes(value) && value !== "") {
      setIsManualCity(true);
    } else {
      setIsManualCity(false);
    }
  };

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
        // Tarifa por defecto para países no listados
        setShippingInfo({
          source: "Tarifa Estándar",
          cost: 400,
          days: 7,
          zone: "Internacional",
        });
      }
    }
  };

  const handleChangeWithTouched = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    handleChange(e);
    markFieldAsTouched(e.target.name);
  };

  // ✅ Manejar blur para marcar como touched
  const handleBlur = (fieldName: string) => {
    markFieldAsTouched(fieldName);
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
      <div className="w-full space-y-6">
      {/* ... (header anterior se mantiene igual) */}

      <div className="grid grid-cols-1 gap-6">
        {/* 🌍 País */}
        <div data-error={!!formErrors.country && shouldShowError('country')}>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            País
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChangeWithTouched}
              onBlur={() => handleBlur('country')}
              disabled={loadingCountries}
              className={`w-full px-4 py-3 border rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 bg-gray-50 focus:bg-white appearance-none
                        cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                        ${formErrors.country && shouldShowError('country') 
                          ? 'border-red-500 ring-2 ring-red-200' 
                          : 'border-gray-200'}`}
            >
              <option value="">
                {loadingCountries ? "Cargando países..." : "Selecciona un país *"}
              </option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {loadingCountries ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          {formErrors.country && shouldShowError('country') && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.country}
            </p>
          )}
        </div>

        {/* 🏙️ Estado - Campo combinado */}
        <div data-error={!!formErrors.state && shouldShowError('state')}>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Estado / Provincia / Región
            <span className="text-red-500 ml-1">*</span>
            {isManualState && (
              <span className="text-xs text-blue-600 ml-2">(Escribiendo manualmente)</span>
            )}
          </label>
          <div className="space-y-2">
            {/* Select para estados */}
            <div className="relative">
              <select
                id="state"
                name="state"
                value={isManualState ? "" : formData.state}
                onChange={(e) => {
                  if (e.target.value) {
                    handleChangeWithTouched(e);
                    setIsManualState(false);
                  }
                }}
                onBlur={() => handleBlur('state')}
                className={`w-full px-4 py-3 border rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          transition-all duration-200 bg-gray-50 focus:bg-white appearance-none
                          cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                          ${formErrors.state && shouldShowError('state') 
                            ? 'border-red-500 ring-2 ring-red-200' 
                            : 'border-gray-200'}`}
                disabled={!formData.country}
              >
                <option value="">
                  {states.length > 0 ? "Selecciona un estado *" : "Cargando estados..."}
                </option>
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

            {/* Separador "O" */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">O</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Input para escribir manualmente */}
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe el estado manualmente... *"
                value={isManualState ? formData.state : ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const syntheticEvent = {
                    target: {
                      name: "state",
                      value: newValue
                    }
                  } as ChangeEvent<HTMLInputElement>;
                  handleChangeWithTouched(syntheticEvent);
                  if (newValue) {
                    setIsManualState(true);
                  }
                }}
                onBlur={() => handleBlur('state')}
                className={`w-full px-4 py-3 border rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          transition-all duration-200 bg-gray-50 focus:bg-white pl-11
                          disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                          ${formErrors.state && shouldShowError('state') 
                            ? 'border-red-500 ring-2 ring-red-200' 
                            : 'border-gray-200'}`}
                disabled={!formData.country}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
          {formErrors.state && shouldShowError('state') && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.state}
            </p>
          )}
          {!formData.country && (
            <p className="text-sm text-gray-500 mt-2">
              Selecciona un país primero para habilitar esta opción
            </p>
          )}
        </div>

        {/* 🌆 Ciudad - Solo campo de texto */}
        <div data-error={!!formErrors.city && shouldShowError('city')}>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Ciudad
            <span className="text-red-500 ml-1">*</span>
            {isManualState && (
              <span className="text-xs text-blue-600 ml-2">(Escribiendo manualmente)</span>
            )}
          </label>
          <div className="space-y-2">
            {/* Select para estados */}
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe el estado manualmente... *"
                value={isManualState ? formData.city : ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const syntheticEvent = {
                    target: {
                      name: "city",
                      value: newValue
                    }
                  } as ChangeEvent<HTMLInputElement>;
                  handleChangeWithTouched(syntheticEvent);
                  if (newValue) {
                    setIsManualState(true);
                  }
                }}
                onBlur={() => handleBlur('city')}
                className={`w-full px-4 py-3 border rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          transition-all duration-200 bg-gray-50 focus:bg-white pl-11
                          disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                          ${formErrors.city && shouldShowError('city') 
                            ? 'border-red-500 ring-2 ring-red-200' 
                            : 'border-gray-200'}`}
                disabled={!formData.state}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
          {formErrors.city && shouldShowError('city') && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.city}
            </p>
          )}
          {!formData.state && (
            <p className="text-sm text-gray-500 mt-2">
              Selecciona un estado primero para habilitar esta opción
            </p>
          )}
        </div>

        {/* 🏠 Calle y número */}
        <div data-error={!!formErrors.street && shouldShowError('street')}>
          <label
            htmlFor="street"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Calle y colonia
            <span className="text-red-500 ml-1">*</span>
            {isManualState && (
              <span className="text-xs text-blue-600 ml-2">(Escribiendo manualmente)</span>
            )}
          </label>
          <div className="space-y-2">
            {/* Select para estados */}
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe el estado manualmente... *"
                value={isManualState ? formData.street : ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const syntheticEvent = {
                    target: {
                      name: "street",
                      value: newValue
                    }
                  } as ChangeEvent<HTMLInputElement>;
                  handleChangeWithTouched(syntheticEvent);
                  if (newValue) {
                    setIsManualState(true);
                  }
                }}
                onBlur={() => handleBlur('street')}
                className={`w-full px-4 py-3 border rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          transition-all duration-200 bg-gray-50 focus:bg-white pl-11
                          disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                          ${formErrors.street && shouldShowError('street') 
                            ? 'border-red-500 ring-2 ring-red-200' 
                            : 'border-gray-200'}`}
                disabled={!formData.city}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
          {formErrors.street && shouldShowError('street') && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.street}
            </p>
          )}
        </div>

        {/* 📮 Código postal */}
        <div data-error={!!formErrors.postalCode && shouldShowError('postalCode')}>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Código postal
            <span className="text-red-500 ml-1">*</span>
            {isManualState && (
              <span className="text-xs text-blue-600 ml-2">(Escribiendo manualmente)</span>
            )}
          </label>
          <div className="space-y-2">
            {/* Select para estados */}
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe el estado manualmente... *"
                value={isManualState ? formData.postalCode : ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const syntheticEvent = {
                    target: {
                      name: "postalCode",
                      value: newValue
                    }
                  } as ChangeEvent<HTMLInputElement>;
                  handleChangeWithTouched(syntheticEvent);
                  if (newValue) {
                    setIsManualState(true);
                  }
                }}
                onBlur={() => handleBlur('postalCode')}
                className={`w-full px-4 py-3 border rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          transition-all duration-200 bg-gray-50 focus:bg-white pl-11
                          disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                          ${formErrors.postalCode && shouldShowError('postalCode') 
                            ? 'border-red-500 ring-2 ring-red-200' 
                            : 'border-gray-200'}`}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
          {formErrors.postalCode && shouldShowError('postalCode') && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.postalCode}
            </p>
          )}
        </div>
      </div>

      {/* Información de envío (si está disponible) */}
      {shippingInfo && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-900">
                Información de envío disponible
              </p>
              <p className="text-sm text-green-700 mt-1">
                Costo: ${shippingInfo.cost} | Tiempo: {shippingInfo.days} días | Zona: {shippingInfo.zone}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Fuente: {shippingInfo.source}
              </p>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}