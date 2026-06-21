import produce from 'immer';
import { AnyAction } from 'redux';
import { AppState } from '../../../models/AppState';
import { FlowNameViewAction, FlowNameViewActionTypes } from './FlowNameViewActions';
import { getByKey, getEntryByKey } from '../../../utils/utils';

export default function FlowNameViewReducer(s: AppState, action: AnyAction): AppState {
  if (FlowNameViewActionTypes.includes(action.type)) {
    const a = action as FlowNameViewAction;

    switch (a.type) {
      case 'CHANGE_FLOW_NAME':
        return produce(s, draft => {
          const flow = getEntryByKey(getByKey(draft.collections, draft.currentCollection)?.flows, draft.currentFlow);
          if (flow) {
            const oldName = draft.currentFlow;
            flow[0] = a.newName;
            draft.currentFlow = a.newName;

            draft.openFlowTabs = draft.openFlowTabs.map(([collectionName, flowName]) => {
              if (collectionName === draft.currentCollection && flowName === oldName) {
                return [collectionName, a.newName];
              }
              return [collectionName, flowName];
            });
          }
        });
      default:
        return s;
    }
  }

  return s;
}
