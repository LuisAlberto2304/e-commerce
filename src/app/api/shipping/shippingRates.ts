// app/api/shipping/shippingRates.ts

export const shippingRates = {
  "CDMX": [
    { method: "Estándar", time: "3-5 días", cost: 80 },
    { method: "Exprés", time: "1-2 días", cost: 150 }
  ],
  "Guadalajara": [
    { method: "Estándar", time: "4-6 días", cost: 100 },
    { method: "Exprés", time: "2-3 días", cost: 160 }
  ],
  "Monterrey": [
    { method: "Estándar", time: "4-6 días", cost: 100 },
    { method: "Exprés", time: "2-3 días", cost: 160 }
  ],
  "Tijuana": [
    { method: "Estándar", time: "3-6 días", cost: 100 },
    { method: "Exprés", time: "2-3 días", cost: 160 }
  ],
  "Otro": [
    { method: "Estándar", time: "5-7 días", cost: 120 }
  ]
};
