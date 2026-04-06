"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-primary hover:underline group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>
      
      <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-12">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using ShipGrid ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
          If you do not agree to abide by the above, please do not use this service.
        </p>

        <h2>2. Use of the Platform</h2>
        <p>
          ShipGrid provides a platform for builders to discover and share applications. You agree to use the Platform only for lawful purposes 
          and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the Platform.
        </p>

        <h2>3. User Submissions</h2>
        <p>
          When you submit an application ("App") to ShipGrid, you retain all ownership rights. However, you grant us a non-exclusive, worldwide, 
          royalty-free license to display, promote, and distribute the content associated with your App on our Platform.
        </p>

        <h2>4. Platform Moderation</h2>
        <p>
          ShipGrid reserves the right to remove, edit, or reject any submissions or users at any time, without notice, if we determine that 
          the content violates our community guidelines or terms of service.
        </p>

        <h2>5. Disclaimer of Warranties</h2>
        <p>
          The Platform is provided "as is". ShipGrid and its suppliers and licensors hereby disclaim all warranties of any kind, express or implied, 
          including, without limitation, the warranties of merchantability, fitness for a particular purpose and non-infringement.
        </p>

        <h2>6. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us via our GitHub repository or support channels.
        </p>
      </div>
    </main>
  );
}
