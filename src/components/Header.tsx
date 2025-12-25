import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Settings, LogOut, User, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { useTradingData } from '@/hooks/useTradingData';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const Header = ({ onMenuClick, showMenuButton }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const { notifications } = useTradingData();

  const unreadNotifications = notifications?.filter(n => !n.is_read).length || 0;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-30">
      <div className="flex items-center h-16">
        {/* Mobile layout */}
        <div className="flex md:hidden items-center justify-between w-full px-4">
          {/* Left Side - Menu button and title for mobile */}
          <div className="flex items-center gap-3">
            {showMenuButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuClick}
                className="h-8 w-8 p-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <img
              src="/logo/orbitra-ai-logo.svg"
              alt="Orbitra AI"
              className="h-7 w-auto"
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <ThemeToggle className="h-8 w-8" />

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 rounded-full p-0 flex items-center justify-center relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs bg-red-500 hover:bg-red-500 text-white flex items-center justify-center rounded-full"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <NotificationCenter />
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {user?.email || 'مستخدم'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    حساب نشط
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>الإعدادات</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex items-center w-full">
          {/* Left Side - Menu button في أقصى اليسار */}
          <div className="flex items-center pl-6">
            {showMenuButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuClick}
                className="h-8 w-8 p-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Center - Status Indicator */}
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center space-x-2 space-x-reverse bg-muted px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-muted-foreground">
                متصل
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse pr-6">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <ThemeToggle className="h-8 w-8" />

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 rounded-full p-0 flex items-center justify-center relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs bg-red-500 hover:bg-red-500 text-white flex items-center justify-center rounded-full"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <NotificationCenter />
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {user?.email || 'مستخدم'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    حساب نشط
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>الإعدادات</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
