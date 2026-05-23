// src/components/ui/Toast.jsx

const typeStyles = {
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-gray-800 text-white',
};

export const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className={`
          ${typeStyles[toast.type] || typeStyles.info}
          px-5 py-3 rounded-xl shadow-lg
          text-sm font-medium
          pointer-events-auto
          max-w-xs
          animate-pulse-once
        `}
      >
        {toast.message}
      </div>
    ))}
  </div>
);