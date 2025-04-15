"use client";

import Link from "next/link";
import { useState } from "react";
import { ModeToggle } from "~/components/mode-toggle";
import {
  ChartNoAxesColumn,
  Home,
  Menu,
  Search,
  Settings,
  User,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";

export function Navbar() {
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link
        href="/"
        className="hover:text-primary flex items-center gap-2 font-medium transition-colors"
      >
        <Home className="h-4 w-4" />
        Головна
      </Link>
      <Link
        href="/analytics"
        className="hover:text-primary flex items-center gap-2 font-medium transition-colors"
      >
        <ChartNoAxesColumn />
        Аналітика
      </Link>
      <Link
        href="/search"
        className="hover:text-primary flex items-center gap-2 font-medium transition-colors"
      >
        <Search className="h-4 w-4" />
        Пошук
      </Link>
    </>
  );

  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
      <div className="flex h-16 w-full items-center px-4 sm:px-8 lg:px-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <ChartNoAxesColumn />
          <Link href="/" className="text-xl font-bold">
            Steam Analytics
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="mx-auto hidden items-center gap-8 text-sm md:flex">
          <NavLinks />
        </nav>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-5 md:ml-0">
          <Link
            href="/profile"
            className="hover:text-primary flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Профіль</span>
          </Link>
          <Link
            href="/settings"
            className="hover:text-primary flex items-center gap-2 text-sm font-medium transition-colors md:mr-3"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Налаштування</span>
          </Link>
          <ModeToggle />

          {/* Mobile Burger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-72 px-6 pt-5">
              <SheetTitle></SheetTitle>

              <div className="mt-2 mb-8 flex items-center gap-3">
                <ChartNoAxesColumn />
                <span className="text-xl font-bold">Steam Analytics</span>
              </div>
              <nav className="flex flex-col gap-6 text-sm">
                <NavLinks />
                <Link
                  href="/profile"
                  className="hover:text-primary flex items-center gap-2 font-medium transition-colors"
                >
                  <User className="h-4 w-4" />
                  Профіль
                </Link>
                <Link
                  href="/settings"
                  className="hover:text-primary flex items-center gap-2 font-medium transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Налаштування
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
