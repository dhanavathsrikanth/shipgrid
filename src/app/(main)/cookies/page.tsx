"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CookiesPage() {
  return (
    <main className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-primary hover:underline group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>
      
      <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Cookie Policy</h1>
        <p className="text-muted-foreground text-sm mb-12">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files that are stored on your computer or mobile device when you visit a website. 
          They are widely used to make websites work or work more efficiently, as well as to provide information to the owners of the site.
        </p>

        <h2>2. How We Use Cookies</h2>
        <p>
          ShipGrid uses cookies primarily for authentication and session management. We use Clerk for our identity platform, 
          which sets necessary cookies to verify your identity, maintain your logged-in state securely, and protect against CSRF attacks.
        </p>

        <h2>3. Types of Cookies We Use</h2>
        <p>
          <strong>Essential Cookies:</strong> These are cookies that are required for the operation of our website. 
          They include, for example, cookies that enable you to log into secure areas of our platform. Without these cookies, 
          services you have asked for cannot be provided.
        </p>
        <p>
          <strong>Analytics Cookies:</strong> We may use basic analytics to understand how visitors interact with the platform. 
          These cookies collect information pseudonymously and help us improve the platform's user experience.
        </p>

        <h2>4. Managing Cookies</h2>
        <p>
          Most web browsers allow you to manage cookies through their settings preferences. You can set your browser to refuse 
          cookies or delete certain cookies. However, please note that if you choose to block essential cookies, you may not be 
          able to sign in or use all features of ShipGrid.
        </p>
      </div>
    </main>
  );
}
