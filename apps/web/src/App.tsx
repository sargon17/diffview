import { useState, useEffect } from 'react';
import { SessionInfo, DiffMode, ChangedFile } from '@diffview/shared';
import { getSession, getRefs, getDiff } from './features/repo';
import DiffPanel from './components/DiffPanel';
import './App.css';

function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [baseBranch, setBaseBranch] = useState('');
  const [mode, setMode] = useState<DiffMode>('branch');
  const [selectedFile, setSelectedFile] = useState<ChangedFile | null>(null);
  const [diffPatch, setDiffPatch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const sess = await getSession();
        setSession(sess);
        setBaseBranch(sess.defaultBaseRef);
        setMode(sess.mode);

        const refs = await getRefs();
        setBranches(refs.branches.map(b => b.name));

        if (sess.mode === 'branch') {
          const diff = await getDiff('branch', sess.defaultBaseRef, sess.currentBranch);
          if (diff.files.length > 0) {
            setSelectedFile(diff.files[0]);
            setDiffPatch(diff.files[0].patch || '');
          }
        }
      } catch (err) {
        console.error('Failed to initialize:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleDiffRefresh() {
    if (!session) return;
    setLoading(true);
    try {
      let diff;
      if (mode === 'branch') {
        diff = await getDiff('branch', baseBranch, session.currentBranch);
      } else if (mode === 'working') {
        diff = await getDiff('working');
      } else {
        diff = await getDiff('staged');
      }
      if (diff.files.length > 0 && !selectedFile) {
        setSelectedFile(diff.files[0]);
        setDiffPatch(diff.files[0].patch || '');
      }
    } catch (err) {
      console.error('Diff error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading diffview…</div>;
  }

  if (!session) {
    return <div className="error">Failed to load session</div>;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="repo-info">
          <strong>{session.repo.name}</strong>
          <span>→ {session.currentBranch}</span>
        </div>
        <div className="controls">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as DiffMode)}
            title="Diff mode"
          >
            <option value="branch">Branch</option>
            <option value="working">Working</option>
            <option value="staged">Staged</option>
          </select>

          {mode === 'branch' && (
            <select
              value={baseBranch}
              onChange={(e) => setBaseBranch(e.target.value)}
              title="Base branch"
            >
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          )}

          <button onClick={handleDiffRefresh} className="refresh-btn">
            Refresh
          </button>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <h3>Changed Files</h3>
          <div className="file-list">
            {selectedFile && (
              <div key={selectedFile.path} className="file-item active">
                {selectedFile.path}
              </div>
            )}
          </div>
        </aside>

        <main className="diff-container">
          <DiffPanel patch={diffPatch} />
        </main>
      </div>
    </div>
  );
}

export default App;
