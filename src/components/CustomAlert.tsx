import { useAlert } from "@/hooks/useCustomAlert";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";

export default function CustomAlert() {
  const { alerts } = useAlert();

  const getColorStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-amber-100 border-amber-300 text-amber-900";
      case "error":
        return "bg-red-100 border-red-300 text-red-900";
      case "warning":
        return "bg-orange-100 border-orange-300 text-orange-900";
      default:
        return "bg-blue-100 border-blue-300 text-blue-900";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-amber-700" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-700" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-orange-700" />;
      default:
        return <Info className="w-5 h-5 text-blue-700" />;
    }
  };

  return (
    <div className="fixed top-5 right-5 space-y-3 z-[9999]">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25 }}
            className={`
              flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg 
              border backdrop-blur-sm
              ${getColorStyles(alert.type)}
            `}
          >
            {getIcon(alert.type)}

            <span className="font-medium text-sm">
              {alert.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
