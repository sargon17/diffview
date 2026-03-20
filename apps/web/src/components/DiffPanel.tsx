import { useEffect, useRef } from 'react';
import { createPatch, parsePatch } from '@pierre/diffs';

interface Props {
  patch: string;
}

function DiffPanel({ patch }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    if (!patch) {
      containerRef.current.textContent = 'No changes to display';
      return;
    }

    const { hunks, index } = parsePatch(patch);
    const patchEl = document.createElement('div');
    patchEl.className = 'diff-patch';

    const fileHeader = document.createElement('div');
    fileHeader.className = 'diff-file-header';
    fileHeader.textContent = index.from || 'diff';
    patchEl.appendChild(fileHeader);

    hunks.forEach(hunk => {
      const hunkHeader = document.createElement('div');
      hunkHeader.className = 'hunk-header';
      hunkHeader.textContent = `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`;
      patchEl.appendChild(hunkHeader);

      hunk.lines.forEach(line => {
        const lineEl = document.createElement('div');
        lineEl.className = `diff-line diff-${line.type}`;
        lineEl.textContent = line.content;
        patchEl.appendChild(lineEl);
      });
    });

    containerRef.current.appendChild(patchEl);
  }, [patch]);

  return (
    <div className="diff-panel" ref={containerRef} />
  );
}

export default DiffPanel;
