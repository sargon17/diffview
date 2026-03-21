import { type FC, type ComponentProps, useState } from 'react';

import { PatchDiff } from "@pierre/diffs/react";
import type { SelectedLineRange } from '@pierre/diffs';

interface PatchProps extends ComponentProps<typeof PatchDiff> {
  file: string
}

const Patch: FC<PatchProps> = ({ patch, file }) => {
  const [collapsed, setCollapsed] = useState(false)

  const handleSelection = (range: SelectedLineRange | null) => {
    console.log("handle select", range)
  }

  return (
    <div>
      <div className='bg-black p-1.5 px-2 text-sm text-neutral-300' onClick={() => setCollapsed(!collapsed)}>
        {file}
      </div>
      <PatchDiff
        patch={patch}
        options={
          {
            diffStyle: "split",
            collapsed: collapsed,
            enableLineSelection: true,
            enableGutterUtility: true,
            onLineSelectionEnd: handleSelection,
            disableFileHeader: true,

            lineDiffType:'char',

          }
        }
      />

    </div>
  );
};

export default Patch;
