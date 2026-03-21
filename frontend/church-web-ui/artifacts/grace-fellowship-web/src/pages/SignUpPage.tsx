import { useState } from "react";
import { Link } from "wouter";
import { Mail, Lock, User, Eye, EyeOff, Cross, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-3">
            <Cross className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Join Grace Fellowship</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your account today</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-lg">
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 bg-muted/30 border-card-border"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={update("firstName")}
                  data-testid="input-first-name"
                />
              </div>
              <Input
                className="bg-muted/30 border-card-border"
                placeholder="Last name"
                value={form.lastName}
                onChange={update("lastName")}
                data-testid="input-last-name"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                className="pl-9 bg-muted/30 border-card-border"
                placeholder="Email address"
                value={form.email}
                onChange={update("email")}
                data-testid="input-email"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="tel"
                className="pl-9 bg-muted/30 border-card-border"
                placeholder="Phone number (optional)"
                value={form.phone}
                onChange={update("phone")}
                data-testid="input-phone"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPass ? "text" : "password"}
                className="pl-9 pr-9 bg-muted/30 border-card-border"
                placeholder="Create password"
                value={form.password}
                onChange={update("password")}
                data-testid="input-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPass(!showPass)}
                data-testid="btn-toggle-password"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to our{" "}
              <button type="button" className="text-primary hover:underline">Terms of Service</button>{" "}
              and{" "}
              <button type="button" className="text-primary hover:underline">Privacy Policy</button>.
            </p>
            <Button type="submit" size="lg" className="w-full font-bold" data-testid="btn-create-account">
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline font-medium" data-testid="link-sign-in">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
