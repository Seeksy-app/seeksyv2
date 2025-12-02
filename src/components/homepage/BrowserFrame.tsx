import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface BrowserFrameProps {
  title: string;
  url: string;
  icon: LucideIcon;
  gradient: string;
  children?: React.ReactNode;
}

export function BrowserFrame({ title, url, icon: Icon, gradient, children }: BrowserFrameProps) {
  return (
    <div className="relative group">
      {/* Glow effect */}
      <div className={cn(
        "absolute -inset-1 rounded-2xl bg-gradient-to-br opacity-30 blur-xl transition-opacity group-hover:opacity-50",
        gradient
      )} />
      
      {/* Frame */}
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        {/* Browser Chrome */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-white/10">
          {/* Traffic lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          
          {/* URL Bar */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1.5">
              <div className="w-4 h-4 rounded bg-slate-600" />
              <span className="text-xs text-slate-400 font-mono">{url}</span>
            </div>
          </div>
          
          {/* Spacer for symmetry */}
          <div className="w-14" />
        </div>

        {/* Screen Content */}
        <div className="aspect-[16/10] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
          {children || (
            <div className="h-full flex flex-col items-center justify-center p-8">
              {/* Mock UI */}
              <div className={cn("p-5 rounded-2xl bg-gradient-to-br shadow-xl mb-4", gradient)}>
                <Icon className="h-10 w-10 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-1">{title}</h4>
              <p className="text-white/50 text-sm">Interactive Dashboard</p>
              
              {/* Mock data bars */}
              <div className="flex items-end gap-2 mt-6">
                {[60, 80, 45, 90, 70, 85, 55].map((height, i) => (
                  <div
                    key={i}
                    className={cn("w-6 rounded-t bg-gradient-to-t opacity-60", gradient)}
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
