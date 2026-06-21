import React from 'react';
import styled from 'styled-components';
import { validateCollectionName } from '../../models/Collection';
import { Input, Form, Button, message, Popover, Divider, Tooltip } from 'antd';
import {
  FilePptOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExportOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import { prevent, getByKey } from '../../utils/utils';
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from '../../models/AppState';
import { selectColNames } from '../../redux/store';
import { deleteCollection, changeCollectionName, openFM, createFlow } from './CollectionActions';
import { exportCollection } from '../../bulk/trigger';

export const TableData = styled('div')`
  padding: 8px 10px;
  border-radius: 8px;
  transition: background-color 0.15s ease;
  min-height: 56px;

  &:hover {
    background-color: #f6f9ff;
  }
`;

const HeaderRow = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const HeaderInfo = styled('div')`
  min-width: 0;
  flex: 1;
`;

const Actions = styled('div')`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const IconAction = styled(Button)`
  width: 26px;
  height: 26px;
  min-width: 26px;
  padding: 0;
`;

export const Separator = styled(Divider)`
  margin: 4px 0;
`;

const Title = styled('span')`
  display: block;
  margin-top: 2px;
  margin-bottom: 2px;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  user-select: none;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Description = styled('p')`
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  margin-bottom: 2px;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Hint = styled('span')`
  font-size: 11px;
  color: #9ca3af;
`;

const TitleInput = styled(Input)`
  margin-top: 2px;
  margin-bottom: 2px;
  font-size: 13px;
  user-select: none;
`;

type Props = {
  collectionName: string;
};

const CollectionCell: React.FunctionComponent<Props> = ({ collectionName }) => {
  const dispatch = useDispatch();

  const collection = useSelector((s: AppState) => getByKey(s.collections, collectionName));
  const collectionNames = useSelector(selectColNames);

  const [menuVisible, setMenuVisible] = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [isInvalidName, setIsInvalidName] = React.useState(false);
  const [draftName, setDraftName] = React.useState(collectionName);

  React.useEffect(() => {
    setDraftName(collectionName);
  }, [collectionName]);

  function showMenu(): void {
    setMenuVisible(true);
  }

  function hideMenu(): void {
    setMenuVisible(false);
  }

  function startEditing(): void {
    setIsEditingName(true);
    hideMenu();
  }

  function stopEditing(): void {
    setIsEditingName(false);
  }

  const collectionSize = Object.keys(collection?.flows || {}).length;

  function handleDelete(): void {
    if (collectionNames.length > 1) {
      dispatch(deleteCollection(collectionName));
    } else {
      message.error("Can't delete the last collection");
    }
    hideMenu();
  }

  function checkName(newName: string): boolean {
    return validateCollectionName(newName, collectionName, collectionNames);
  }

  function handleNameChange(newName: string): void {
    if (checkName(newName)) {
      dispatch(changeCollectionName(collectionName, newName));
    }
  }

  function handleOpenFM(): void {
    dispatch(openFM(collectionName));
    hideMenu();
  }

  function validateFlowName(flowName: string): boolean {
    return !collection?.flows?.map(([n]) => n)?.includes(flowName);
  }

  function handleCreate(): void {
    const tmpName = 'Request';
    let tmpNameIdx = 1;
    while (!validateFlowName(`${tmpName}${tmpNameIdx}`)) tmpNameIdx++;
    dispatch(createFlow(collectionName, `${tmpName}${tmpNameIdx}`));
    hideMenu();
  }

  function handleExport(): void {
    if (collection) {
      // error display is done in index.ts
      exportCollection(collectionName, collection);
    }
  }

  const menu = (
    <>
      <Button type="link" onClick={prevent(handleOpenFM)}>
        <FilePptOutlined />
        Manage .proto files
      </Button>
      <Separator />
      <Button type="link" onClick={prevent(handleCreate)}>
        <PlusOutlined />
        New Request
      </Button>
      <Separator />
      <Button type="link" onClick={prevent(startEditing)}>
        <EditOutlined />
        Edit Name
      </Button>
      <Separator />
      <Button type="link" onClick={prevent(handleExport)}>
        <ExportOutlined />
        Export Collection
      </Button>
      <Separator />
      <Button type="link" danger onClick={prevent(handleDelete)}>
        <DeleteOutlined />
        Delete Collection
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
      <TableData onContextMenu={prevent(showMenu)}>
        {isEditingName ? (
          <Form.Item
            validateStatus={isInvalidName ? 'error' : ''}
            style={{ margin: 0 }}
            help={isInvalidName ? 'Invalid Name' : ''}
          >
            <TitleInput
              value={draftName}
              onChange={(e): void => {
                setIsInvalidName(!checkName(e.target.value));
                setDraftName(e.target.value);
              }}
              onKeyDown={(e): void => {
                switch (e.keyCode) {
                  case 27: // esc
                    setDraftName(collectionName);
                    stopEditing();
                    break;
                  case 13: // enter
                    if (!isInvalidName) {
                      handleNameChange(draftName);
                      stopEditing();
                    }
                }
              }}
              onClick={prevent(e => e)}
            />
          </Form.Item>
        ) : (
          <HeaderRow>
            <HeaderInfo>
              <Title>{draftName}</Title>
            </HeaderInfo>
            <Actions>
              <Tooltip title="New request">
                <IconAction shape="circle" size="small" onClick={prevent(handleCreate)}>
                  <PlusOutlined />
                </IconAction>
              </Tooltip>
              <Tooltip title="More actions">
                <IconAction
                  shape="circle"
                  size="small"
                  onClick={prevent((): void => setMenuVisible(!menuVisible))}
                >
                  <EllipsisOutlined />
                </IconAction>
              </Tooltip>
            </Actions>
          </HeaderRow>
        )}
        <Description>
          {collectionSize} {collectionSize === 1 ? 'request' : 'requests'} <Hint>• right-click for actions</Hint>
        </Description>
      </TableData>
    </Popover>
  );
};

export default CollectionCell;
