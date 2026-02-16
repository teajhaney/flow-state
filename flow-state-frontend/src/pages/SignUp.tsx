import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { toast } from 'sonner';
import { Brain } from 'lucide-react';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const navigate = useNavigate();
  const signup = useAuthStore(state => state.signup);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpForm) => {
    try {
      await signup(data);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        'Failed to create account. Please try again.';
      const errorMessage = Array.isArray(message) ? message[0] : message;
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-size-[60px_60px]" />
      <div className="absolute h-full w-full bg-background mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10 px-4"
      >
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/20 ring-4 ring-background">
            <Brain size={32} />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Flow State</h1>
            <p className="text-muted-foreground text-sm">
              Create your account to start focus tracking
            </p>
          </div>
        </div>

        <Card className="p-8 border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Full Name
              </label>
              <Input
                {...register('name')}
                placeholder="John Doe"
                className="bg-background/50 border-input"
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="bg-background/50 border-input"
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Password
                </label>
              </div>
              <Input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="bg-background/50 border-input"
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
            >
              {isSubmitting ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <button
              onClick={() => navigate('/signin')}
              className="text-primary font-medium hover:underline transition-all"
            >
              Sign in
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
