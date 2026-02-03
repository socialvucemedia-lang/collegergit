"use client";


import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, GraduationCap, Users, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type Role = 'student' | 'teacher' | 'advisor' | 'admin';

const ROLES: { id: Role; label: string; icon: React.ElementType; description: string }[] = [
    { id: 'student', label: 'Student', icon: User, description: 'Access your profile and attendance' },
    { id: 'teacher', label: 'Teacher', icon: GraduationCap, description: 'Mark attendance and view classes' },
    { id: 'advisor', label: 'Class Advisor', icon: Users, description: 'Monitor class health and reports' },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, description: 'System configuration and oversight' },
];

export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    // Prevent redirect during login validation to avoid race conditions
    const loginInProgress = useRef(false);

    // Redirect if already authenticated (but not during login validation)
    useEffect(() => {
        if (user && !loginInProgress.current) {
            const searchParams = new URLSearchParams(window.location.search);
            const redirectTo = searchParams.get('redirect');
            router.replace(redirectTo || `/${user.role}`);
        }
    }, [user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;

        setError(null);
        setIsLoading(true);
        loginInProgress.current = true;

        try {
            // Sign in with Supabase Auth
            const { user: authUser } = await signIn(credentials.email, credentials.password);

            if (!authUser) {
                throw new Error('Authentication failed');
            }

            // Small delay to ensure session cookie is set
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get user profile via API (bypasses RLS) with retry mechanism
            let profileData = null;
            let lastError = null;
            const MAX_RETRIES = 3;
            const RETRY_DELAY = 200;

            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    const profileRes = await fetch('/api/auth/profile');
                    profileData = await profileRes.json();

                    if (profileRes.ok && profileData.profile) {
                        break; // Success
                    }
                    lastError = profileData.error || 'Profile fetch failed';
                } catch (fetchError) {
                    lastError = fetchError;
                }

                // Wait before retrying (except on last attempt)
                if (attempt < MAX_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
            }

            if (!profileData?.profile) {
                await signOut();
                throw new Error(
                    profileData?.hint ||
                    lastError ||
                    'User profile not found. Please create a user profile in the database.'
                );
            }

            const userProfile = profileData.profile;

            // Check if role is null
            if (!userProfile.role) {
                await signOut();
                throw new Error(
                    'User role is not set. Please update the user profile in the database. ' +
                    `UPDATE public.users SET role = '${selectedRole}' WHERE id = '${authUser.id}';`
                );
            }

            // Verify role matches
            if (userProfile.role !== selectedRole) {
                await signOut();
                throw new Error(`This account is registered as ${userProfile.role}, not ${selectedRole}. Please select the correct role or contact an administrator to update your role.`);
            }

            toast.success('Logged in successfully');

            // Update auth context with the profile
            await refreshUser();

            // Allow redirect now and navigate
            loginInProgress.current = false;

            const searchParams = new URLSearchParams(window.location.search);
            const redirectTo = searchParams.get('redirect');
            router.replace(redirectTo || `/${selectedRole}`);
        } catch (err: any) {
            loginInProgress.current = false;
            const errorMessage = err.message || 'Login failed. Please check your credentials.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        Institution Portal
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        {selectedRole
                            ? `Authenticating as ${ROLES.find(r => r.id === selectedRole)?.label}`
                            : "Select your role to continue"}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!selectedRole ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 gap-4"
                        >
                            {ROLES.map((role) => (
                                <Card
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className="p-4 flex items-center gap-4 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors active:scale-98"
                                >
                                    <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                                        <role.icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{role.label}</h3>
                                        <p className="text-sm text-neutral-500">{role.description}</p>
                                    </div>
                                </Card>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <Card className="p-6">
                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="px-0 h-auto hover:bg-transparent hover:text-neutral-900 text-neutral-500"
                                            onClick={() => {
                                                setSelectedRole(null);
                                                setCredentials({ email: '', password: '' });
                                            }}
                                            type="button"
                                        >
                                            ← Back
                                        </Button>
                                        <span className="text-sm font-medium text-neutral-400">
                                            Login as {ROLES.find(r => r.id === selectedRole)?.label}
                                        </span>
                                    </div>

                                    {selectedRole === 'student' ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="roll">Roll Number (Email)</Label>
                                                <Input
                                                    id="roll"
                                                    placeholder="admin@mctrgit.ac.in"
                                                    required
                                                    className="bg-neutral-50 dark:bg-neutral-900"
                                                    value={credentials.email}
                                                    onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ern">ERN (Password)</Label>
                                                <Input
                                                    id="ern"
                                                    type="password"
                                                    placeholder="••••••"
                                                    required
                                                    className="bg-neutral-50 dark:bg-neutral-900"
                                                    value={credentials.password}
                                                    onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Institutional Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="admin@mctrgit.ac.in"
                                                    required
                                                    className="bg-neutral-50 dark:bg-neutral-900"
                                                    value={credentials.email}
                                                    onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="password">Password</Label>
                                                    <Link
                                                        href="/forgot-password"
                                                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors"
                                                    >
                                                        Forgot password?
                                                    </Link>
                                                </div>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    required
                                                    className="bg-neutral-50 dark:bg-neutral-900"
                                                    value={credentials.password}
                                                    onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md text-sm text-red-600 dark:text-red-400">
                                            <AlertCircle size={16} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Signing in...' : 'Enter Portal'}
                                    </Button>
                                </form>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
