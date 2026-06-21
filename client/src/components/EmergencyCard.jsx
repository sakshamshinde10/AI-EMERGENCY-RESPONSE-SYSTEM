const EmergencyCard = ({ name, message, priority }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <h2 className="text-xl font-bold">
        {name}
      </h2>

      <p className="text-gray-600 mt-2">
        {message}
      </p>

      <span className="text-red-500 font-bold">
        Priority: {priority}
      </span>
    </div>
  );
};

export default EmergencyCard;