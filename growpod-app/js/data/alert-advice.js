// Alert advice knowledge base — fun, helpful tips for each alert type
// Add more tips over time to keep things fresh!

const ADVICE = {
  temperature_high: [
    "Your greens are sweating more than you on leg day! Move the pod away from direct sunlight or crack a window nearby.",
    "Hot hot hot! Think of your microgreens like Goldilocks — they don't want it too warm. A small fan or some shade should do the trick.",
    "Your pod's running a fever. Check if it's near a radiator, sunny window, or heat source and give it some breathing room.",
  ],
  temperature_low: [
    "Brrr! Your microgreens are getting the cold shoulder. Move the pod somewhere warmer or check for drafts.",
    "Even microgreens need a cosy jumper sometimes. Try moving the pod away from cold windows or draughty spots.",
    "It's a bit nippy in there! Your greens grow best when they're comfortable — just like you on the couch with a blanket.",
  ],
  humidity_high: [
    "It's a tropical rainforest in there! Improve airflow — a small fan nearby works wonders.",
    "Your pod's turned into a sauna. Crack the lid if you can, or improve ventilation around the chamber.",
    "Too muggy! High humidity can invite unwanted guests (mould). Let some fresh air circulate.",
  ],
  humidity_low: [
    "Drier than a desert out there. Try misting the tray or placing a small water dish nearby to boost humidity.",
    "Your greens are gasping for moisture in the air! A light mist or moving away from heaters should help.",
    "The Sahara called — it wants its climate back. Add a bit of moisture to the air around your pod.",
  ],
  moisture_low: [
    "Your soil is thirstier than a camel on a Monday. Time to water!",
    "Dry roots, sad shoots! Give your tray a good drink — your microgreens will thank you by tomorrow.",
    "Water check! Your greens are sending out an SOS. Hit that 'Water Now' button or top up manually.",
  ],
  co2_high: [
    "CO\u2082 levels are climbing — your plants are basically hotboxing themselves. Open a window or improve ventilation.",
    "Fresh air needed! High CO\u2082 means stale air. Crack a window or add a small fan to get things moving.",
    "Your greens need to breathe too! Improve air circulation around the pod to bring CO\u2082 back down.",
  ],
};

/**
 * Get a random piece of advice for a given alert type.
 * Returns null if no advice exists for that type.
 */
export function getAdvice(alertType) {
  const tips = ADVICE[alertType];
  if (!tips || tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)];
}
