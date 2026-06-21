import React, { FunctionComponent, ChangeEvent } from 'react';
import { Radio, Select } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import TextArea from 'antd/lib/input/TextArea';
import MessageValueView, { dispatchingHandler } from '../../body/MessageValueView';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { selectRequestMessageName, selectBodyType, JSONbodyChangedType } from './BodyInputActions';
import { BodyType, RequestBody } from '../../../../models/request_builder';
import { ProtoCtx } from '../../../../../core/protobuf/protobuf';

type Props = {
  bodyType: BodyType;
  bodies: RequestBody;
  protoCtx: ProtoCtx;
  messageNames: ReadonlyArray<string>;
};

const BodyWrapper = styled('div')`
  display: block;
  margin-top: 12px;
  background: #f8faff;
  border: 1px solid #e8eef7;
  border-radius: 10px;
  padding: 12px;
`;

export const MESSAGE_NAME_WIDTH = 560;

export const JSON_BODY_AREA_WIDTH = 560;
export const JSON_BODY_AREA_HEIGHT = 180;

const BodyInput: FunctionComponent<Props> = ({ bodyType, bodies, protoCtx, messageNames }) => {
  const dispatch = useDispatch();

  function onRadioChange(e: RadioChangeEvent): void {
    dispatch(selectBodyType(e.target.value));
  }

  function onJSONBodyChange(e: ChangeEvent<HTMLTextAreaElement>): void {
    dispatch(JSONbodyChangedType(e.target.value));
  }

  function onSelectRequestMsg(msgName: string): void {
    dispatch(selectRequestMessageName(msgName));
  }

  const handlers = dispatchingHandler(dispatch, protoCtx);

  function renderBody(): React.ReactNode {
    return bodyType === 'none' ? (
      <div />
    ) : bodyType === 'protobuf' ? (
      <>
        <div style={{ marginBottom: 8 }}>
          <span>Request Message: </span>
          <Select
            value={bodies.protobuf && bodies.protobuf.type.name}
            onChange={onSelectRequestMsg}
            style={{ width: MESSAGE_NAME_WIDTH }}
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
        </div>
        {bodies.protobuf ? <MessageValueView value={bodies.protobuf} handlers={handlers} editable /> : null}
      </>
    ) : bodyType === 'json' ? (
      <>
        <div style={{ marginBottom: 8 }}>
          <span>Request Body: </span>
          <br />
          <TextArea
            value={bodies.json}
            style={{ width: JSON_BODY_AREA_WIDTH, height: JSON_BODY_AREA_HEIGHT, resize: 'none' }}
            placeholder={'{\n  "key": "value"\n}'}
            onChange={onJSONBodyChange}
          ></TextArea>
        </div>
      </>
    ) : null;
  }

  return (
    <div>
      <Radio.Group defaultValue="none" value={bodyType} onChange={onRadioChange}>
        <Radio value="none">None</Radio>
        <Radio value="json">JSON</Radio>
        <Radio value="protobuf">Protobuf</Radio>
      </Radio.Group>
      <BodyWrapper>{renderBody()}</BodyWrapper>
    </div>
  );
};

export default BodyInput;
