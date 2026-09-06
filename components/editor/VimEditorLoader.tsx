'use client';

/** Keep `import type` on the props: a value import pulls the ~240 kB editor into the route. */

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { loadLanguage } from './languages';
import type { VimEditorProps } from './VimEditor';

export function EditorSkeleton() {
  return (
    <div className="clay-editor" data-mode="normal" data-testid="editor-skeleton">
      <div className="clay-editor-title">
        <span aria-hidden="true">●</span>
        <span>loading the editor</span>
      </div>
      <div className="clay-editor-well min-h-[15rem]" />
      <div className="clay-status">
        <span className="clay-status-mode">-- NORMAL --</span>
      </div>
    </div>
  );
}

const VimEditor = dynamic(() => import('./VimEditor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

export default function VimEditorLoader({ language, ...rest }: VimEditorProps) {
  useEffect(() => {
    void loadLanguage(language);
  }, [language]);

  return <VimEditor language={language} {...rest} />;
}

export type { VimEditorProps };
