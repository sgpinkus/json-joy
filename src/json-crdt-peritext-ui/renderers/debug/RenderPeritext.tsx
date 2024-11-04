import * as React from 'react';
import {rule} from 'nano-theme';
import {context} from './context';
import type {PeritextViewProps} from '../../react';
import {usePeritext} from '../../react/context';

const blockClass = rule({
  pos: 'relative',
});

const btnClass = rule({
  pos: 'absolute',
  t: 0,
  r: 0,
  bg: 'black',
  col: 'white',
  fz: '9px',
  bdrad: '4px',
});

const childrenDebugClass = rule({
  out: '1px dotted black !important',
});

const dumpClass = rule({
  bg: '#fafafa',
  fz: '8px',
  pad: '8px 16px',
  bxz: 'border-box',
});

export interface RenderPeritextProps extends PeritextViewProps {
  enabled?: boolean;
  children?: React.ReactNode;
}

export const RenderPeritext: React.FC<RenderPeritextProps> = ({enabled: enabledProp = true, peritext, children}) => {
  const {dom} = usePeritext();
  const [enabled, setEnabled] = React.useState(enabledProp);

  console.log('dom', dom);

  return (
    <context.Provider value={{enabled}}>
      <div className={blockClass}>
        <button type={'button'} className={btnClass} onClick={() => setEnabled((x) => !x)}>
          Toggle debug mode
        </button>
        <div className={enabled ? childrenDebugClass : undefined}>{children}</div>
        {enabled && (
          <div className={dumpClass}>
            <pre>{peritext + ''}</pre>
            {!!dom && <pre>{dom + ''}</pre>}
          </div>
        )}
      </div>
    </context.Provider>
  );
};
