import React from 'react';
import EndpointInput from '../EndpointInput/EndpointInput';
import { Tabs, Button } from 'antd';
import HeaderView from '../../shared/HeaderView/HeaderView';
import BodyInput from '../BodyInput/BodyInput';
import styled from 'styled-components';
import ExpectedBodyInput from '../ExpectedBodyInput/ExpectedBodyInput';
import { RequestBuilder } from '../../../../models/request_builder';
import { ProtoCtx } from '../../../../../core/protobuf/protobuf';

const { TabPane } = Tabs;

const BuilderWrapper = styled('div')`
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  border: 1px solid #e6ecf5;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.06);
`;

const TopBarWrapper = styled('div')`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  border: 1px solid #e8eef7;
  border-radius: 10px;
  background: #f9fbff;
`;

const EndpointArea = styled('div')`
  flex: 1;
  min-width: 0;
`;

const SendButton = styled(Button)`
  min-width: 108px;
  height: 40px;
  border-radius: 10px;
  font-weight: 600;
  padding: 0 24px;
`;

const PaddedTabPane = styled(TabPane)`
  padding: 8px 2px;
`;

type Props = {
  requestBuilder: RequestBuilder;
  protoCtx: ProtoCtx;
  messageNames: ReadonlyArray<string>;
  onSend: () => void;
};

const RequestBuilderView: React.FunctionComponent<Props> = ({ requestBuilder, protoCtx, messageNames, onSend }) => {
  const { method, url, headers, bodyType, bodies, expectedProtobufMsg, expectedProtobufMsgOnError } = requestBuilder;

  return (
    <BuilderWrapper>
      <TopBarWrapper>
        <EndpointArea>
          <EndpointInput method={method} url={url} onSend={onSend} />
        </EndpointArea>
        <SendButton type="primary" onClick={onSend}>
          Send
        </SendButton>
      </TopBarWrapper>
      <Tabs defaultActiveKey="header" animated={false}>
        <PaddedTabPane tab="Headers" key="header">
          <HeaderView editable headers={headers} />
        </PaddedTabPane>
        <PaddedTabPane tab="Body" key="body">
          <BodyInput bodyType={bodyType} bodies={bodies} protoCtx={protoCtx} messageNames={messageNames} />
        </PaddedTabPane>
        <PaddedTabPane tab="Expected Message" key="expectedMessage">
          <ExpectedBodyInput
            messageNames={messageNames}
            expectedProtobufMsg={expectedProtobufMsg}
            expectedProtobufMsgOnError={expectedProtobufMsgOnError}
          />
        </PaddedTabPane>
      </Tabs>
    </BuilderWrapper>
  );
};

export default RequestBuilderView;
