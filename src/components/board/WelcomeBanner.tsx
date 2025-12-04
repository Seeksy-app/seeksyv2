import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface WelcomeBannerProps {
  firstName?: string;
}

export function WelcomeBanner({ firstName }: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full rounded-2xl bg-gradient-to-r from-slate-100 via-blue-50/50 to-slate-50 border border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-lg">
            {firstName ? firstName.charAt(0).toUpperCase() : 'S'}
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-slate-500">Here's your board overview for today</p>
        </div>
      </div>
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
        className="text-2xl"
      >
        <Sparkles className="w-6 h-6 text-amber-500" />
      </motion.div>
    </motion.div>
  );
}
