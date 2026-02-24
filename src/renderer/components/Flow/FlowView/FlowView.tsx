import React from 'react';
import RequestBuilder from '../request/RequestBuilderView/RequestBuilderView';
import ResponseView from '../response/ResponseView';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { sendRequest } from './FlowViewActions';
import { selectCurrentColWithName, selectCurrentFlowWithName, selectCurrentEnv } from '../../../redux/store';
import { Alert, Spin, Tabs } from 'antd';
import { selectOpenFlowTab, closeOpenFlowTab } from './FlowTabsActions';
import { AppState } from '../../../models/AppState';

const { TabPane } = Tabs;

const Wrapper = styled('div')`
  padding: 0;
`;

const Spacing = styled('div')`
  height: 20px;
`;

const AlertWrapper = styled('div')`
  margin-bottom: 12px;
`;

const TabsWrapper = styled('div')`
  margin-bottom: 12px;

  .ant-tabs-nav {
    margin-bottom: 8px;
  }

  .ant-tabs-tab {
    border-radius: 8px 8px 0 0 !important;
  }
`;

const TabLabel = styled('div')`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const TabFlowName = styled('span')`
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function toTabKey(collectionName: string, flowName: string): string {
  return JSON.stringify([collectionName, flowName]);
}

function toDisplayFlowName(flowName: string): string {
  const parts = flowName.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : flowName;
}

function methodColor(method: string): string {
  switch (method) {
    case 'GET':
      return '#22c55e';
    case 'POST':
      return '#f59e0b';
    case 'PUT':
    case 'PATCH':
      return '#3b82f6';
    case 'DELETE':
      return '#ef4444';
    default:
      return '#64748b';
  }
}

const MethodBadge = styled('span')<{ method: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: ${({ method }): string => methodColor(method)};
  background: ${({ method }): string => `${methodColor(method)}1A`};
`;

function fromTabKey(key: string): [string, string] | null {
  try {
    const arr = JSON.parse(key);
    if (!Array.isArray(arr) || arr.length !== 2) return null;
    if (typeof arr[0] !== 'string' || typeof arr[1] !== 'string') return null;
    return [arr[0], arr[1]];
  } catch (e) {
    return null;
  }
}

const FlowView: React.FunctionComponent<unknown> = ({}) => {
  const dispatch = useDispatch();

  const col = useSelector(selectCurrentColWithName);
  const flo = useSelector(selectCurrentFlowWithName);
  const env = useSelector(selectCurrentEnv);
  const collections = useSelector((s: AppState) => s.collections);
  const openFlowTabs = useSelector((s: AppState) => s.openFlowTabs);

  if (!col || !flo || !env) return null;

  const [collectionName, collection] = col;
  const [flowName, flow] = flo;
  const curEnv = env;

  const { requestBuilder, requestStatus, requestError, response } = flow;
  const { protoCtx } = collection;

  function send(): void {
    dispatch(sendRequest(collectionName, flowName, requestBuilder, curEnv, protoCtx));
  }

  function handleTabChange(key: string): void {
    const parsed = fromTabKey(key);
    if (!parsed) return;
    dispatch(selectOpenFlowTab(parsed[0], parsed[1]));
  }

  function handleTabEdit(targetKey: string | React.MouseEvent | React.KeyboardEvent, action: 'add' | 'remove'): void {
    if (action !== 'remove' || typeof targetKey !== 'string') return;
    const parsed = fromTabKey(targetKey);
    if (!parsed) return;
    dispatch(closeOpenFlowTab(parsed[0], parsed[1]));
  }

  return (
    <Wrapper>
      <TabsWrapper>
        <Tabs
          hideAdd
          type="editable-card"
          activeKey={toTabKey(collectionName, flowName)}
          onChange={handleTabChange}
          onEdit={handleTabEdit}
        >
          {openFlowTabs.map(([tabCollectionName, tabFlowName]) => {
            const tabCollection = collections.find(([name]) => name === tabCollectionName)?.[1];
            const method = tabCollection?.flows?.find(([name]) => name === tabFlowName)?.[1]?.requestBuilder?.method || 'GET';

            return (
              <TabPane
                key={toTabKey(tabCollectionName, tabFlowName)}
                tab={
                  <TabLabel>
                    <MethodBadge method={method}>{method}</MethodBadge>
                    <TabFlowName>{toDisplayFlowName(tabFlowName)}</TabFlowName>
                  </TabLabel>
                }
                closable={openFlowTabs.length > 1}
              />
            );
          })}
        </Tabs>
      </TabsWrapper>

      <RequestBuilder
        requestBuilder={requestBuilder}
        protoCtx={protoCtx}
        messageNames={collection.messageNames}
        onSend={send}
      />
      <Spacing />

      {requestStatus === 'failure' ? (
        <AlertWrapper>
          <Alert message={requestError?.message || ' '} type="error" closeText="Close" />
        </AlertWrapper>
      ) : null}

      {requestStatus === 'sending' ? (
        <AlertWrapper>
          <Spin size="large" tip="Sending request..." />
        </AlertWrapper>
      ) : null}

      {response ? <ResponseView response={response} /> : null}
    </Wrapper>
  );
};

export default FlowView;
