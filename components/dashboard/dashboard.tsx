"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePromoStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { CodeInput } from "./code-input";
import { ValidationControls } from "./validation-controls";
import { ResultTable } from "./result-table";
import { BatchSelector } from "./batch-selector";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";

export function Dashboard() {
  const { user, setUser } = usePromoStore();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success("Logged out successfully! See you next time.");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Perplexity Promo Code Validator
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="max-w-[200px] truncate">{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-3 xl:col-span-3">
            <div className="sticky top-4">
              <BatchSelector />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 xl:col-span-9 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <CodeInput />
              <ValidationControls />
            </div>

            <ResultTable />
          </div>
        </div>
      </main>
    </div>
  );
}
