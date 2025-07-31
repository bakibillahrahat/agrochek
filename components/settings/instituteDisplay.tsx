"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { InstituteForm } from "./institute-form";
import { Institute } from "@/types/institute";

export function InstituteDisplay() {
    const [data, setData] = useState<Institute | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/institute');
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching institute data:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mounted) return;
        fetchData();
    }, [mounted]);

    const handleUpdateSuccess = () => {
        setIsDialogOpen(false);
        fetchData();
    };

    if (!mounted) return null;

    if (loading) return (
        <div className="flex justify-center items-center p-4">
            <p className="text-sm text-gray-500">Loading...</p>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center p-4">
            <p className="text-sm text-red-500">Error: {error}</p>
        </div>
    );

    if (!data) return (
        <div className="flex justify-center items-center p-4">
            <p className="text-sm text-red-500">No institute data found.</p>
        </div>
    );

    return (
        <Card className="w-full max-w-xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Office Profile</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <SquarePen className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Change Institute Information</DialogTitle>
                        </DialogHeader>
                        <InstituteForm onSuccess={handleUpdateSuccess} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="grid gap-2">
                    <p className="flex items-center gap-2">
                        <strong className="min-w-[120px]">নাম:</strong>
                        <span>{data.name}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <strong className="min-w-[120px]">প্রাপকঃ</strong>
                        <span>{data.prapok}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <strong className="min-w-[120px]">প্রধান বৈজ্ঞানিক কর্মকর্তা:</strong>
                        <span>{data.issuedby}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <strong className="min-w-[120px]">ফোন:</strong>
                        <span>{data.phone}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <strong className="min-w-[120px]">ঠিকানা:</strong>
                        <span>{data.address}</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}