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
import { useDiffMode } from "src/hooks/useDiffMode";

type HeaderProps = {
  branches: string[];
  baseBranch: string;
  onBaseBranchChange: (value: string) => void;
};

const items = DIFF_MODES.map((mode) => ({
  value: mode,
  label: mode.toUpperCase(),
}));

const Header: FC<HeaderProps> = ({ branches, baseBranch, onBaseBranchChange }) => {
  const { current, update } = useDiffMode();

  return (
    <div className="flex w-full items-center justify-between border px-4 py-3">
      <div className="flex items-center gap-2">
        <Select onValueChange={(value) => update(value as DiffMode)} value={current}>
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

        {current === "branch" ? (
          <Select
            onValueChange={onBaseBranchChange}
            value={baseBranch}
            disabled={branches.length === 0}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder={branches.length === 0 ? "Loading branches…" : "Base branch"} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : null}
      </div>
      <ThemeSwitcher />
    </div>
  );
};

export default Header;
