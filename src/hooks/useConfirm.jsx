import { useState, useCallback } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';

// Promise-based drop-in replacement for window.confirm():
//   const { confirm, dialog } = useConfirm();
//   if (!(await confirm('Delete this draft?'))) return;
//   return <>{dialog}...</>;
export function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise(resolve => setState({ message, options, resolve }));
  }, []);

  function resolve(result) {
    state?.resolve(result);
    setState(null);
  }

  const dialog = state ? (
    <ConfirmDialog
      title={state.options.title}
      message={state.message}
      confirmLabel={state.options.confirmLabel}
      cancelLabel={state.options.cancelLabel}
      danger={state.options.danger}
      onConfirm={() => resolve(true)}
      onCancel={() => resolve(false)}
    />
  ) : null;

  return { confirm, dialog };
}
