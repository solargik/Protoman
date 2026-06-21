type SelectOpenFlowTab = {
  type: 'SELECT_OPEN_FLOW_TAB';
  collectionName: string;
  flowName: string;
};

const SELECT_OPEN_FLOW_TAB = 'SELECT_OPEN_FLOW_TAB';

type CloseOpenFlowTab = {
  type: 'CLOSE_OPEN_FLOW_TAB';
  collectionName: string;
  flowName: string;
};

const CLOSE_OPEN_FLOW_TAB = 'CLOSE_OPEN_FLOW_TAB';

export const FlowTabsActionTypes = [SELECT_OPEN_FLOW_TAB, CLOSE_OPEN_FLOW_TAB];

export type FlowTabsAction = SelectOpenFlowTab | CloseOpenFlowTab;

export function selectOpenFlowTab(collectionName: string, flowName: string): SelectOpenFlowTab {
  return {
    type: SELECT_OPEN_FLOW_TAB,
    collectionName,
    flowName,
  };
}

export function closeOpenFlowTab(collectionName: string, flowName: string): CloseOpenFlowTab {
  return {
    type: CLOSE_OPEN_FLOW_TAB,
    collectionName,
    flowName,
  };
}
