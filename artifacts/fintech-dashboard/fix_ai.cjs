const fs = require('fs');
let code = fs.readFileSync('c:/Users/HP/Desktop/NEXORA_FINANCE-main/NEXORA_FINANCE-main/artifacts/fintech-dashboard/src/pages/AIAssistant.tsx', 'utf-8');

const toReplaceRegex = /  \}, \[isTyping, financeContext\]\);\s*return \(/g;

const replacement = `  }, [isTyping, financeContext]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleReset() {
    setMessages([{
      id: "welcome-reset",
      role: "ai",
      text: \`Hello again! I'm FinBot, ready to help. What would you like to explore?\`,
      timestamp: new Date(),
    }]);
    setInput("");
    setIsTyping(false);
    setShowSuggestions(true);
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  return (`;

code = code.replace(toReplaceRegex, replacement);
fs.writeFileSync('c:/Users/HP/Desktop/NEXORA_FINANCE-main/NEXORA_FINANCE-main/artifacts/fintech-dashboard/src/pages/AIAssistant.tsx', code);
console.log('Fixed syntax error in AIAssistant.tsx');
