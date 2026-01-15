"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, GraduationCap, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

type Role = 'student' | 'teacher' | 'advisor' | 'admin';

const ROLES: { id: Role; label: string; icon: React.ElementType; description: string }[] = [
    { id: 'student', label: 'Student', icon: User, description: 'Access your profile and attendance' },
    { id: 'teacher', label: 'Teacher', icon: GraduationCap, description: 'Mark attendance and view classes' },
    { id: 'advisor', label: 'Class Advisor', icon: Users, description: 'Monitor class health and reports' },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, description: 'System configuration and oversight' },
];

export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;
        // Mock login - in production this would be real auth
        router.push(`/${selectedRole}`);
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
                                            onClick={() => setSelectedRole(null)}
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
                                                <Label htmlFor="roll">Roll Number</Label>
                                                <Input id="roll" placeholder="e.g. 21101A0001" required className="bg-neutral-50 dark:bg-neutral-900" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ern">ERN (First Login)</Label>
                                                <Input id="ern" type="password" placeholder="••••••" required className="bg-neutral-50 dark:bg-neutral-900" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Institutional Email</Label>
                                                <Input id="email" type="email" placeholder="faculty@institution.edu" required className="bg-neutral-50 dark:bg-neutral-900" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Password</Label>
                                                <Input id="password" type="password" required className="bg-neutral-50 dark:bg-neutral-900" />
                                            </div>
                                        </div>
                                    )}

                                    <Button type="submit" className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200">
                                        Enter Portal
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
