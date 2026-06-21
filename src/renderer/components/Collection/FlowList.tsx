import React from 'react';
import { List, Typography, Button, message, Popover, Collapse, Tooltip } from 'antd';
import { DeleteOutlined, SubnodeOutlined, CopyOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { prevent, getByKey } from '../../utils/utils';
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from '../../models/AppState';
import { selectFlow, deleteFlow, reorderFlow, cloneFlow } from './CollectionActions';
import { DragDropContext, DropResult, Draggable, Droppable } from 'react-beautiful-dnd';
import { Separator } from './CollectionCell';

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

const ClickableItem = styled(List.Item)`
  display: flex;
  justify-content: space-between;
  border-radius: 8px;
  margin-bottom: 4px;
  border: 1px solid transparent;
  &:hover {
    cursor: pointer;
    background-color: #f3f7ff;
    border-color: #dce7ff;
  }
  padding: 0;
`;

const GroupCollapse = styled(Collapse)`
  background: transparent;
  border: 0;

  .ant-collapse-item {
    border: 1px solid #e7edf7;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    margin-bottom: 8px;
  }

  .ant-collapse-header {
    padding: 8px 36px 8px 10px !important;
    background: #f8faff;
  }

  .ant-collapse-content {
    border-top: 1px solid #edf2fa;
  }

  .ant-collapse-content-box {
    padding: 8px !important;
  }
`;

const GroupHeader = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding-right: 6px;
`;

const GroupTitle = styled('span')`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #475467;
`;

const GroupCount = styled('span')`
  min-width: 24px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #2f5de8;
  background: rgba(47, 93, 232, 0.12);
  border-radius: 999px;
  padding: 2px 8px;
`;

const ItemRow = styled('div')`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const LeftInfo = styled('div')`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const MethodBadge = styled('span')<{ method: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: ${({ method }): string => methodColor(method)};
  background: ${({ method }): string => `${methodColor(method)}1A`};
`;

const NameText = styled(Typography.Text)`
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Actions = styled('div')`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const IconAction = styled(Button)`
  width: 24px;
  height: 24px;
  min-width: 24px;
  padding: 0;
`;

type Props = {
  collectionName: string;
  searchText?: string;
};

const FlowList: React.FunctionComponent<Props> = ({ collectionName, searchText }) => {
  const dispatch = useDispatch();

  const collection = useSelector((s: AppState) => getByKey(s.collections, collectionName));
  const allFlowNames = useSelector((s: AppState) => collection?.flows?.map(([n]) => n));
  const normalizedSearch = (searchText || '').trim().toLowerCase();
  type flowItemMetadata = { index: Number; displayName: string; flowName: string; method: string };
  const flowGroups = (allFlowNames || []).reduce(
    (acc: { root: flowItemMetadata[]; groups: { [key: string]: flowItemMetadata[] } }, flowName, index) => {
      if (normalizedSearch.length > 0 && !flowName.toLowerCase().includes(normalizedSearch)) {
        return acc;
      }

      const pathSepIndex = flowName.indexOf('/');
      const method = getByKey(collection?.flows, flowName)?.requestBuilder?.method || 'GET';
      if (pathSepIndex === -1) {
        acc['root'].push({ index, displayName: toDisplayFlowName(flowName), flowName, method });
        return acc;
      }
      const groupName = flowName.substring(0, pathSepIndex);
      const displayName = toDisplayFlowName(flowName);
      acc['groups'][groupName] = acc['groups'][groupName] || [];
      acc['groups'][groupName].push({ index, displayName, flowName, method });
      return acc;
    },
    { root: [], groups: {} },
  );
  const isCurrentCollection = useSelector((s: AppState) => s.currentCollection === collectionName);
  const currentFlow = useSelector((s: AppState) => s.currentFlow);

  function handleSelection(flowName: string): void {
    dispatch(selectFlow(collectionName, flowName));
  }

  function validateFlowName(flowName: string): boolean {
    return !collection?.flows?.map(([n]) => n)?.includes(flowName);
  }

  function handleDelete(flowName: string): void {
    const flowCount = collection?.flows?.length || 0;
    if (flowCount > 1) {
      dispatch(deleteFlow(collectionName, flowName));
    } else {
      message.error("Can't delete the last request");
    }
  }

  function handleClone(originalFlowName: string): void {
    //check if this clone already exists
    const tmpName = originalFlowName.concat('_clone');
    let tmpNameIdx = 1;
    while (!validateFlowName(`${tmpName}${tmpNameIdx}`)) tmpNameIdx++;
    dispatch(cloneFlow(collectionName, originalFlowName, `${tmpName}${tmpNameIdx}`));
  }

  function handleDragEnd(result: DropResult): void {
    console.log(result);
    if (!result.destination || result.source.droppableId != result.destination.droppableId) return;

    const src = result.source.index;
    const dst = result.destination.index;

    dispatch(reorderFlow(collectionName, src, dst));
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={collectionName}>
        {(provided): React.ReactElement => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            <GroupCollapse defaultActiveKey={['root']} expandIconPosition="right">
              <Collapse.Panel
                header={
                  <GroupHeader>
                    <GroupTitle>Not Categorized</GroupTitle>
                    <GroupCount>{flowGroups.root.length}</GroupCount>
                  </GroupHeader>
                }
                key="root"
              >
                <List
                  dataSource={flowGroups.root}
                  rowKey={item => item.flowName}
                  renderItem={(item, idx): React.ReactNode => (
                    <FlowCell
                      idx={idx}
                      method={item.method}
                      displayName={item.displayName}
                      flowName={item.flowName}
                      emphasize={isCurrentCollection && currentFlow === item.flowName}
                      handleSelection={handleSelection}
                      handleDelete={handleDelete}
                      handleClone={handleClone}
                    />
                  )}
                />
              </Collapse.Panel>

              {Object.keys(flowGroups.groups).map(groupName => (
                <Collapse.Panel
                  key={groupName}
                  header={
                    <GroupHeader>
                      <GroupTitle>{groupName}</GroupTitle>
                      <GroupCount>{flowGroups.groups[groupName].length}</GroupCount>
                    </GroupHeader>
                  }
                >
                  <List
                    dataSource={flowGroups.groups[groupName]}
                    rowKey={item => item.flowName}
                    renderItem={(item, idx): React.ReactNode => (
                      <FlowCell
                        idx={idx}
                        method={item.method}
                        displayName={item.displayName}
                        flowName={item.flowName}
                        emphasize={isCurrentCollection && currentFlow === item.flowName}
                        handleSelection={handleSelection}
                        handleDelete={handleDelete}
                        handleClone={handleClone}
                      />
                    )}
                  />
                </Collapse.Panel>
              ))}
            </GroupCollapse>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

type CellProps = {
  method: string;
  displayName: string;
  flowName: string;
  emphasize: boolean;
  idx: number;
  handleSelection: (name: string) => void;
  handleDelete: (name: string) => void;
  handleClone: (name: string) => void;
};

const FlowCell: React.FC<CellProps> = ({
  method,
  displayName,
  flowName,
  emphasize,
  handleSelection,
  handleDelete,
  handleClone,
  idx,
}) => {
  const [menuVisible, setMenuVisible] = React.useState(false);
  function showMenu(): void {
    setMenuVisible(true);
  }

  function hideMenu(): void {
    setMenuVisible(false);
  }

  function deleteFlow(): void {
    handleDelete(flowName);
    hideMenu();
  }

  function cloneFlow(): void {
    handleClone(flowName);
    hideMenu();
  }

  const menu = (
    <>
      <Button type="link" danger onClick={prevent(deleteFlow)}>
        <DeleteOutlined />
        Delete Request
      </Button>
      <Separator />
      <Button type="link" onClick={prevent(cloneFlow)}>
        <SubnodeOutlined />
        Clone Request
      </Button>
    </>
  );

  return (
    <Popover
      placement="rightTop"
      content={menu}
      visible={menuVisible}
      trigger="contextMenu"
      onVisibleChange={setMenuVisible}
    >
      <ClickableItem onClick={(): void => handleSelection(flowName)} onContextMenu={prevent(showMenu)}>
        <Draggable draggableId={flowName} index={idx}>
          {(provided): React.ReactElement => {
            const style: React.CSSProperties = {
              width: '100%',
              height: '100%',
              padding: 10,
              boxSizing: 'border-box',
              borderRadius: 8,
              border: emphasize ? '1px solid rgba(47, 93, 232, 0.35)' : '1px solid transparent',
              backgroundColor: emphasize ? 'rgba(47, 93, 232, 0.08)' : 'transparent',
            };

            const { style: draggableStyle, ...draggableRest } = provided.draggableProps;

            return (
              <div
                ref={provided.innerRef}
                {...provided.dragHandleProps}
                {...draggableRest}
                style={{ ...style, ...draggableStyle }}
              >
                <ItemRow>
                  <LeftInfo>
                    <MethodBadge method={method}>{method}</MethodBadge>
                    <NameText
                      strong={emphasize}
                      style={{ userSelect: 'none', color: emphasize ? 'rgb(47, 93, 232)' : '#374151' }}
                    >
                      {displayName}
                    </NameText>
                  </LeftInfo>
                  <Actions>
                    <Tooltip title="Clone request">
                      <IconAction shape="circle" size="small" onClick={prevent(cloneFlow)}>
                        <CopyOutlined />
                      </IconAction>
                    </Tooltip>
                    <Tooltip title="Delete request">
                      <IconAction shape="circle" size="small" danger onClick={prevent(deleteFlow)}>
                        <DeleteOutlined />
                      </IconAction>
                    </Tooltip>
                  </Actions>
                </ItemRow>
              </div>
            );
          }}
        </Draggable>
      </ClickableItem>
    </Popover>
  );
};

export default FlowList;
