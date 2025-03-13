import SignUpForm from '@/components/SignUpForm';
import { PublicHeader } from '@/components/PublicHeader';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="w-full max-w-md p-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Affiliate Network</h1>
            <p className="text-muted-foreground">Create a new account</p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
