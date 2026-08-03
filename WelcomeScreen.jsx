import { motion } from "framer-motion";
import { Sparkles, Zap, Globe, Code } from "lucide-react";

const suggestions = [
  { icon: Sparkles, text: "Explain quantum computing in simple terms", gradient: "from-purple-500 to-pink-500" },
  { icon: Zap, text: "Help me write a creative story", gradient: "from-yellow-500 to-orange-500" },
  { icon: Globe, text: "What are the latest AI trends?", gradient: "from-green-500 to-emerald-500" },
  { icon: Code, text: "Debug my JavaScript code", gradient: "from-blue-500 to-cyan-500" },
];

export default function WelcomeScreen({ onSuggestionClick }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <motion.div
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl"
        >
          <Sparkles className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome to Aether Chat
        </h1>
        <p className="text-xl text-slate-600">
          Your intelligent AI assistant powered by advanced language models
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="group relative p-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${suggestion.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            <div className="relative flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${suggestion.gradient} flex items-center justify-center shadow-lg`}>
                <suggestion.icon className="w-6 h-6 text-white" />
              </div>
              <p className="flex-1 text-slate-700 font-medium mt-2">
                {suggestion.text}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
