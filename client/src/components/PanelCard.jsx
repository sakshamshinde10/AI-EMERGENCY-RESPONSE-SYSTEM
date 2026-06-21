const PanelCard = ({ title, description, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300">
      <h2 className={`text-2xl font-bold ${color}`}>
        {title}
      </h2>

      <p className="text-gray-600 mt-2">
        {description}
      </p>
    </div>
  );
};

export default PanelCard;