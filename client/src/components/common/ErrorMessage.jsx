// // src/components/common/ErrorMessage.jsx
// import React from 'react';

// const ErrorMessage = ({ 
//   message, 
//   title = 'Error', 
//   onRetry = null, 
//   onDismiss = null,
//   type = 'error' // 'error', 'warning', 'info'
// }) => {
//   const typeStyles = {
//     error: {
//       container: 'bg-red-50 border-red-200 text-red-800',
//       icon: '❌',
//       button: 'bg-red-600 hover:bg-red-700 text-white'
//     },
//     warning: {
//       container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
//       icon: '⚠️',
//       button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
//     },
//     info: {
//       container: 'bg-blue-50 border-blue-200 text-blue-800',
//       icon: 'ℹ️',
//       button: 'bg-blue-600 hover:bg-blue-700 text-white'
//     }
//   };

//   const styles = typeStyles[type];

//   return (
//     <div className={`border rounded-lg p-4 ${styles.container}`}>
//       <div className="flex items-start space-x-3">
//         <div className="flex-shrink-0 text-xl">
//           {styles.icon}
//         </div>
        
//         <div className="flex-1 min-w-0">
//           <h3 className="text-sm font-medium mb-1">
//             {title}
//           </h3>
//           <p className="text-sm opacity-90">
//             {message}
//           </p>
          
//           {(onRetry || onDismiss) && (
//             <div className="mt-3 flex space-x-2">
//               {onRetry && (
//                 <button
//                   onClick={onRetry}
//                   className={`px-3 py-1 rounded text-xs font-medium transition-colors ${styles.button}`}
//                 >
//                   Try Again
//                 </button>
//               )}
//               {onDismiss && (
//                 <button
//                   onClick={onDismiss}
//                   className="px-3 py-1 rounded text-xs font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
//                 >
//                   Dismiss
//                 </button>
//               )}
//             </div>
//           )}
//         </div>
        
//         {onDismiss && (
//           <button
//             onClick={onDismiss}
//             className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ErrorMessage;

const ErrorMessage = ({ message, onClose }) => (
  // Main container with error-specific colors (red background, red border, dark red text)
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <span className="block sm:inline font-medium">{message}</span>
    
    {/* Close button container */}
    <button
      className="absolute top-0 bottom-0 right-0 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
      onClick={onClose}
      aria-label="Close alert"
    >
      <span className="sr-only">Close</span>
      {/* X Icon (Close Icon) */}
      <svg className="h-6 w-6 fill-current text-red-700 hover:text-red-900 transition duration-150" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

export default ErrorMessage;