import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Splash() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-12 text-center"
      >
        <div className="w-24 h-24 bg-indigo-500 rounded-full blur-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-50 animate-pulse" />
        <h1 className="text-6xl font-black tracking-tighter relative z-10 bg-clip-text text-transparent bg-linear-to-r from-indigo-400 to-purple-400">
          FLOW
        </h1>
        <p className="text-zinc-400 mt-2 text-lg font-medium tracking-wide">
          Find your zone. Stay in it.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <Button
          onClick={() => navigate('/signup')}
          className="w-full bg-white text-zinc-900 hover:bg-zinc-200 font-bold py-3 text-lg"
        >
          Get Started
        </Button>
        <Button
          onClick={() => navigate('/signin')}
          variant="outline"
          className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white py-3 text-lg"
        >
          I have an account
        </Button>
      </motion.div>
    </div>
  );
}
