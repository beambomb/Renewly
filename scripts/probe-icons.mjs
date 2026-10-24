// Lists which of the candidate icon names exist in the installed lucide-react.
const lucide = await import("lucide-react");
const wanted = [
  "Repeat", "BellRing", "PiggyBank", "ShoppingBasket", "ShieldCheck", "CalendarClock", "CreditCard",
  "Pencil", "Trash2", "Pause", "Play", "CheckCircle2", "CircleCheck", "ChevronRight", "ArrowLeft",
  "Wallet", "Target", "Plus", "Minus", "RotateCcw", "Ban", "Landmark", "TrendingUp", "X",
];
for (const name of wanted) console.log(`${lucide[name] ? "ok     " : "MISSING"} ${name}`);
