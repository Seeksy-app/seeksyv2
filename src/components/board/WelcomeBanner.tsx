import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeBannerProps {
  firstName?: string;
}

export function WelcomeBanner({ firstName }: WelcomeBannerProps) {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/60 px-5 py-3 flex items-center justify-between shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">
            {firstName ? firstName.charAt(0).toUpperCase() : 'S'}
          </span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Welcome{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-xs text-slate-500">Board overview</p>
        </div>
      </div>
      <Button 
        size="sm"
        className="gap-2 bg-blue-600 hover:bg-blue-700"
        onClick={() => navigate('/board/videos')}
      >
        <PlayCircle className="w-4 h-4" />
        Start with Overview Video
      </Button>
    </motion.div>
  );
}
