import { type FC } from "react";

import { DIFF_MODES, type DiffMode } from "@diffview/shared";
import ThemeSwitcher from "./ThemeSwitcher";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useDiffModeStore } from "src/store/diff-mode.store";

type HeaderProps = unknown

const items = DIFF_MODES.map((mode) => ({
  value: mode,
  label: mode.toUpperCase(),
}));

const Header: FC<HeaderProps> = () => {
  const diffMode = useDiffModeStore((state) => state.current)
  const setDiffMode = useDiffModeStore((state) => state.update)

  return (
    <div className="flex w-full items-center justify-between border px-4 py-3">
      <Select
        onValueChange={(value) => setDiffMode(value as DiffMode)}
        defaultValue={diffMode}
      >
        <SelectTrigger className="w-45">
          <SelectValue placeholder="Diff mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <ThemeSwitcher />
    </div>
  );
};

export default Header;
