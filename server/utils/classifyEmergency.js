const classifyEmergency = (message) => {
  const text = message.toLowerCase();

 

  const policeKeywords = [
  "theft",
  "robbery",
  "kidnap",
  "fight",
  "murder",
  "stolen",
  "stole",
  "thief",
  "crime",
  "snatched",
  "snatch",
  "phone",
  "phone stolen",
  "bike stolen",
  "assault",
  "attack"
];
  const hospitalKeywords = [
    "accident",
    "heart attack",
    "bleeding",
    "unconscious",
    "injury",
    "fracture",
    "stroke",
  ];
  const fireKeywords = [
    "fire",
    "smoke",
    "burning",
    "gas leak",
    "explosion",
    "blast",
  ];

  if (fireKeywords.some((word) => text.includes(word))) {
    return {
      department: "Fire Brigade",
      priority: "High",
      address: null,
      area: null,
      city: null,
      landmark: null,
    };
  }

  if (policeKeywords.some((word) => text.includes(word))) {
    return {
      department: "Police",
      priority: "High",
      address: null,
      area: null,
      city: null,
      landmark: null,
    };
  }

  if (hospitalKeywords.some((word) => text.includes(word))) {
    return {
      department: "Hospital",
      priority: "High",
      address: null,
      area: null,
      city: null,
      landmark: null,
    };
  }

  return {
    department: "Unknown",
    priority: "Medium",
    address: null,
    area: null,
    city: null,
    landmark: null,
  };
};

module.exports = classifyEmergency;
