import React from 'react';
import { Alert, Button, Select } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

import { useDispatch, useSelector } from 'react-redux';
import { selectResponseMessageName, selectResponseMessageOnErrorName } from './ExpectedBodyInputActions';
import { MESSAGE_NAME_WIDTH } from '../BodyInput/BodyInput';
import { buildProtofiles } from '../../../Collection/protofile/ProtofileManagerActions';
import { AppState } from '../../../../models/AppState';
import { getByKey } from '../../../../utils/utils';
import styled from 'styled-components';

type Props = {
  messageNames: ReadonlyArray<string>;
  expectedProtobufMsg: string | undefined;
  expectedProtobufMsgOnError: string | undefined;
};

const LABEL_STYLE = { display: 'inline-block', width: 100 };

const Wrapper = styled('div')`
  background: #f8faff;
  border: 1px solid #e8eef7;
  border-radius: 10px;
  padding: 12px;
`;

const ActionRow = styled('div')`
  display: flex;
  justify-content: flex-end;
`;

const ExpectedBodyInput: React.FunctionComponent<Props> = ({
  messageNames,
  expectedProtobufMsg,
  expectedProtobufMsgOnError,
}) => {
  const dispatch = useDispatch();
  const collectionName = useSelector((s: AppState) => s.currentCollection);
  const collection = useSelector((s: AppState) => getByKey(s.collections, s.currentCollection));
  const buildStatus = collection?.buildStatus;
  const buildError = collection?.buildError;
  const filepaths = collection?.protoFilepaths;
  
  function onSelectResponseMsg(msgName: string): void {
    dispatch(selectResponseMessageName(msgName));
  }

  function onSelectResponseMsgOnError(msgName: string): void {
    dispatch(selectResponseMessageOnErrorName(msgName));
  }

  function handleRebuildProtobufModels(): void {
    if (filepaths != null) {
      dispatch(buildProtofiles(collectionName, filepaths as string[], collection?.protoRootPath));
    }
  }

  return (
    <Wrapper>
      <span style={LABEL_STYLE}>On [200, 300):</span>
      <Select
        value={expectedProtobufMsg}
        onChange={onSelectResponseMsg}
        style={{ width: MESSAGE_NAME_WIDTH }}
        allowClear
        showSearch
        filterOption={(input, option): boolean => {
          return option && option.value.toString().includes(input.toString());
        }}
      >
        {messageNames.map((messageName, idx) => (
          <Select.Option key={idx} value={messageName}>
            {messageName}
          </Select.Option>
        ))}
      </Select>

      <div style={{ height: 8 }} />

      <span style={LABEL_STYLE}>On [300, ∞):</span>
      <Select
        value={expectedProtobufMsgOnError}
        onChange={onSelectResponseMsgOnError}
        style={{ width: MESSAGE_NAME_WIDTH }}
        allowClear
        showSearch
        filterOption={(input, option): boolean => {
          return option && option.value.toString().includes(input.toString());
        }}
      >
        {messageNames.map((messageName, idx) => (
          <Select.Option key={idx} value={messageName}>
            {messageName}
          </Select.Option>
        ))}
      </Select>

      <div style={{ height: 8 }} />

      <ActionRow>
        <Button size="middle" onClick={handleRebuildProtobufModels} title="Rebuild & Refresh Protobuf models">
          <ReloadOutlined />
          Rebuild Models
        </Button>
      </ActionRow>

      {buildStatus === 'failure' ? (
        <Alert message={buildError?.toString() || ' '} type="error" closeText="Close" />
      ) : null}
    </Wrapper>
  );
};

export default ExpectedBodyInput;
