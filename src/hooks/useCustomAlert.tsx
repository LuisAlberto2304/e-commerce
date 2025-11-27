"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertMessage {
  id: number;
  type: AlertType;
  message: string;
}

interface AlertContextProps {
  alerts: AlertMessage[];
  showAlert: (message: string, type?: AlertType) => void;
  removeAlert: (id: number) => void;
}

// ❗Esto DEBE ser una constante, no un namespace
const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const showAlert = (message: string, type: AlertType = "info") => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeAlert(id), 3000);
  };

  const removeAlert = (id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ alerts, showAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used inside AlertProvider");
  return context;
};
