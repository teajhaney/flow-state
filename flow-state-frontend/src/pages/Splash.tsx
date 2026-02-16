import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Brain } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden text-foreground">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-size-[60px_60px]" />
      <div className="absolute h-full w-full bg-background mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-8 mb-16 relative z-10"
      >
        <div className="p-6 rounded-3xl bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-2xl shadow-violet-500/30 ring-8 ring-background">
          <Brain size={80} strokeWidth={1.5} />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/70">
            Flow State
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Find your zone. Stay in it.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="w-full max-w-xs space-y-4 relative z-10"
      >
        <Button
          onClick={() => navigate('/signup')}
          className="w-full text-lg h-12 font-semibold shadow-lg shadow-primary/20"
          size="lg"
        >
          Get Started
        </Button>
        <Button
          onClick={() => navigate('/signin')}
          variant="outline"
          className="w-full text-lg h-12 border-muted-foreground/20 hover:bg-muted/50"
          size="lg"
        >
          I have an account
        </Button>
      </motion.div>
    </div>
  );
}
