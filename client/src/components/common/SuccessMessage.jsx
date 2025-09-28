const SuccessMessage = ({ message, onClose }) => (
  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
    <span className="block sm:inline">{message}</span>
    <button
      className="absolute top-0 bottom-0 right-0 px-4 py-3"
      onClick={onClose}
    >
      <span className="sr-only">Close</span>
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

export default SuccessMessage;