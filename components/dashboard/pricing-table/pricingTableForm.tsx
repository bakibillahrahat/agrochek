"use client"
import { Input } from "@/components/ui/input";
// import { Table, TableHead, TableHeader, TableRow, TableBody } from "@/components/ui/table";
import { useState } from "react";

export function PricingTableForm() {
    const [filter, setFilter] = useState("");
    return (
    <div className="space-y-4 p-4">
        <div className="text-2xl font-bold">Pricing</div>
        <p className="text-sm text-muted-foreground">Manage your pricing tables.</p>
        <Input placeholder="Filter search..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm"/>
        {/* <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>রাজস্ব প্রাপ্তির উৎস (আইটেম)</TableHead>
                    <TableHead>কৃষক</TableHead>
                    <TableHead>সহকারী স্বায়ত্তশাসিত প্রতিষ্ঠান</TableHead>
                    <TableHead>সার ডিলার/উৎপাদনকারী/বেসরকারী সংস্থা/ব্যবস্থা প্রতিষ্ঠান/এসআরডিআই বহির্ভুত প্রকল্প</TableHead>
                </TableRow>
                <TableBody></TableBody>
            </TableHeader>
        </Table> */}
    </div>
    );
}