import React from 'react';
import { Layout, Collapse, Modal, Button, Input } from 'antd';
import { PlusOutlined, ImportOutlined, SearchOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import CollectionCell from './CollectionCell';
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from '../../models/AppState';
import NewCollectionCell from './NewCollectionCell';
import { toggleCollections } from './CollectionActions';
import GhostCollectionCell from './GhostCollectionCell';
import FlowList from './FlowList';
import ProtofileManager from './protofile/ProtofileManager';
import { importCollection } from '../../bulk/trigger';

const { Panel } = Collapse;

const Sider = styled(Layout.Sider)`
  background: #fff;
  border-right: 1px solid #e6ecf5;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.06);
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
`;

const ResizeHandle = styled('div')`
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 20;

  &:hover {
    background: rgba(47, 93, 232, 0.15);
  }
`;

const Wrapper = styled('div')`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const Header = styled('div')`
  text-align: left;
  width: 100%;
  flex: 0 0 auto;
  padding: 16px 16px 12px 16px;
  border-bottom: 1px solid #edf2f9;
  margin-bottom: 4px;
`;

const HeaderActions = styled('div')`
  margin-top: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const SearchRow = styled('div')`
  margin-top: 10px;
`;

const Title = styled('h1')`
  user-select: none;
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
`;

const LeanCollapse = styled(Collapse)`
  flex: 1 1 auto;
  overflow: auto;
  min-height: 0;
  border-radius: 0;

  .ant-collapse-item {
    border-bottom: 1px solid #edf2f9;
  }

  .ant-collapse-header {
    padding: 8px 36px 8px 8px !important;
    align-items: center;
  }

  .ant-collapse-arrow {
    right: 12px !important;
    left: auto !important;
  }

  .ant-collapse-content-box {
    padding: 4px 8px 8px 8px !important;
  }
`;

const LinkButton = styled(Button)`
  padding: 0 10px;
  margin-top: 0;
  font-weight: 500;
  min-height: 34px;
`;

export const COLLECTION_SIDER_WIDTH = 300;
const COLLECTION_SIDER_MIN_WIDTH = 230;
const COLLECTION_SIDER_MAX_WIDTH = 520;
const COLLECTION_SIDER_WIDTH_KEY = 'protoman.collectionSiderWidth';

const CollectionSider: React.FunctionComponent<unknown> = ({}) => {
  const dispatch = useDispatch();

  const [siderWidth, setSiderWidth] = React.useState(() => {
    const saved = window.localStorage.getItem(COLLECTION_SIDER_WIDTH_KEY);
    const width = saved ? Number(saved) : COLLECTION_SIDER_WIDTH;
    return Number.isFinite(width) ? Math.max(COLLECTION_SIDER_MIN_WIDTH, Math.min(width, COLLECTION_SIDER_MAX_WIDTH)) : COLLECTION_SIDER_WIDTH;
  });
  const [isResizing, setIsResizing] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');

  const collections = useSelector((s: AppState) => s.collections);
  const openCollections = useSelector((s: AppState) => s.openCollections);
  const fmOpenCollection = useSelector((s: AppState) => s.fmOpenCollection);

  const [isCreatingCol, setIsCreatingCol] = React.useState(false);
  const showGhostCol = (): void => setIsCreatingCol(true);
  const hideGhostCol = (): void => setIsCreatingCol(false);

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredCollections = React.useMemo(() => {
    if (normalizedSearch.length === 0) return collections;

    return collections.filter(([name, col]) => {
      if (name.toLowerCase().includes(normalizedSearch)) return true;
      return col.flows.some(([flowName]) => flowName.toLowerCase().includes(normalizedSearch));
    });
  }, [collections, normalizedSearch]);

  const filteredCollectionNames = React.useMemo(() => filteredCollections.map(([name]) => name), [filteredCollections]);
  const activeKeys = openCollections.filter(name => filteredCollectionNames.includes(name));

  function handleToggleOpen(openCollections: string[]): void {
    dispatch(toggleCollections(openCollections));
  }

  function handleImport(): void {
    importCollection();
  }

  React.useEffect(() => {
    window.localStorage.setItem(COLLECTION_SIDER_WIDTH_KEY, siderWidth.toString());
  }, [siderWidth]);

  React.useEffect(() => {
    if (!isResizing) return;

    function handleMouseMove(e: MouseEvent): void {
      const next = Math.max(COLLECTION_SIDER_MIN_WIDTH, Math.min(e.clientX, COLLECTION_SIDER_MAX_WIDTH));
      setSiderWidth(next);
    }

    function handleMouseUp(): void {
      setIsResizing(false);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return (): void => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <Sider width={siderWidth} theme="light">
      <Wrapper>
        <Header>
          <Title>Collections</Title>
          <SearchRow>
            <Input
              allowClear
              value={searchText}
              prefix={<SearchOutlined />}
              placeholder="Search collections & requests"
              onChange={(e): void => setSearchText(e.target.value)}
            />
          </SearchRow>
          <HeaderActions>
            <LinkButton type="default" icon={<ImportOutlined />} onClick={handleImport}>
              Import
            </LinkButton>
            <Button type="primary" icon={<PlusOutlined />} onClick={showGhostCol}>
              New
            </Button>
          </HeaderActions>
        </Header>
        <LeanCollapse
          activeKey={activeKeys}
          expandIconPosition="right"
          onChange={(k): void => {
            if (typeof k === 'string') {
              handleToggleOpen([k]);
            } else {
              // array of keys
              handleToggleOpen(k);
            }
          }}
        >
          {filteredCollections.map(([name]) => {
            const header = <CollectionCell collectionName={name} />;
            return (
              <Panel key={name} header={header}>
                <FlowList collectionName={name} searchText={searchText} />
              </Panel>
            );
          })}
          {isCreatingCol ? <GhostCollectionCell onCancel={hideGhostCol} /> : null}
          <NewCollectionCell onCreate={showGhostCol} />
        </LeanCollapse>
      </Wrapper>

      <Modal visible={!!fmOpenCollection} footer={null} closable={false} destroyOnClose>
        {fmOpenCollection ? <ProtofileManager collectionName={fmOpenCollection} /> : null}
      </Modal>
      <ResizeHandle onMouseDown={(): void => setIsResizing(true)} />
    </Sider>
  );
};

export default CollectionSider;
