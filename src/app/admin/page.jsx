'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';


export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return; // wait for session to load

        if (!session) {
            router.push('/login');
        } else if (session.user.role !== 'admin') {
            router.push('/client');
        }
    }, [status, session, router]);

    if (status === 'loading') {
        return <p className="p-10">Loading session...</p>;
    }

    if (!session || session.user.role !== 'admin') {
        return null; // prevent flicker or UI flash
    }

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold">Welcome, Admin!</h1>
            <p className="mt-4">Email: {session.user.email}</p>

            <button
                onClick={() => signOut({callbackUrl: '/login'})}
                className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Logout
            </button>

        </div>

    );
}