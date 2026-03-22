import {
  IconCheck,
  IconDeviceDesktop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTheme, type Theme } from "./theme-provider";

const themes: Array<{ icon: typeof IconSun; label: string; value: Theme }> = [
  { icon: IconSun, label: "Light", value: "light" },
  { icon: IconMoon, label: "Dark", value: "dark" },
  { icon: IconDeviceDesktop, label: "System", value: "system" },
];

function ThemeSwitcher() {
  const { resolvedTheme, theme, setTheme } = useTheme();

  const activeTheme =
    themes.find((themeOption) => themeOption.value === theme) ?? themes[2];
  const ActiveIcon = activeTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-32 justify-between"
          aria-label="Switch theme"
        >
          <span className="flex items-center gap-2">
            <ActiveIcon />
            Theme
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
        >
          {themes.map(({ icon: ThemeIcon, label, value }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <ThemeIcon />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <IconCheck />
          Active: {resolvedTheme}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeSwitcher;
