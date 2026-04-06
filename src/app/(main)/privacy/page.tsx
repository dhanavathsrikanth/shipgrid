"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-primary hover:underline group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>
      
      <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-12">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us through platforms like Clerk, including your name, email address, profile picture, 
          and username when you create an account. Additionally, we collect the content of the applications you submit, comments, and votes.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, maintain, and improve ShipGrid. This includes using your profile information to 
          associate your submissions and interactions on the platform, and communicating with you regarding updates, security alerts, and support messages.
        </p>

        <h2>3. Public Information</h2>
        <p>
          ShipGrid is a public platform. the Apps you submit, your username, and your interactions (such as comments and upvotes) will be visible to 
          other users of the site. Be mindful of what you share publicly.
        </p>

        <h2>4. Data Storage and Security</h2>
        <p>
          Our application architecture relies on robust third-party infrastructure including Clerk for authentication and Convex for backend database 
          services. We implement reasonable security measures to protect your personal information from unauthorized access.
        </p>

        <h2>5. Your Rights</h2>
        <p>
          You have the right to access, update, or delete your personal information. You can manage your profile settings directly through the platform 
          or contact us for assistance with data deletion.
        </p>

        <h2>6. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </p>
      </div>
    </main>
  );
}
