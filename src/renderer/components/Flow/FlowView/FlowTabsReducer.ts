import { AnyAction } from 'redux';
import produce from 'immer';
import { Draft } from 'immer';
import { AppState } from '../../../models/AppState';
import { FlowTabsAction, FlowTabsActionTypes } from './FlowTabsActions';

function sameTab(collectionName: string, flowName: string): (tab: [string, string]) => boolean {
  return ([cn, fn]) => cn === collectionName && fn === flowName;
}

function touchTab(draft: Draft<AppState>, collectionName: string, flowName: string): void {
  draft.openFlowTabs = draft.openFlowTabs.filter(([cn, fn]) => !(cn === collectionName && fn === flowName));
  draft.openFlowTabs.unshift([collectionName, flowName]);
}

export default function FlowTabsReducer(s: AppState, action: AnyAction): AppState {
  if (FlowTabsActionTypes.includes(action.type)) {
    const a = action as FlowTabsAction;

    switch (a.type) {
      case 'SELECT_OPEN_FLOW_TAB':
        return produce(s, draft => {
          const exists = draft.openFlowTabs.some(sameTab(a.collectionName, a.flowName));
          if (!exists) {
            touchTab(draft, a.collectionName, a.flowName);
          }
          draft.currentCollection = a.collectionName;
          draft.currentFlow = a.flowName;
        });

      case 'CLOSE_OPEN_FLOW_TAB':
        return produce(s, draft => {
          if (draft.openFlowTabs.length <= 1) return draft;

          const idx = draft.openFlowTabs.findIndex(sameTab(a.collectionName, a.flowName));
          if (idx < 0) return draft;

          const wasCurrent = draft.currentCollection === a.collectionName && draft.currentFlow === a.flowName;
          draft.openFlowTabs.splice(idx, 1);

          if (wasCurrent) {
            const next = draft.openFlowTabs[idx] || draft.openFlowTabs[idx - 1] || draft.openFlowTabs[0];
            if (next) {
              draft.currentCollection = next[0];
              draft.currentFlow = next[1];
            }
          }
        });

      default:
        return s;
    }
  }

  return s;
}
