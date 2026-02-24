import React from 'react';
import { useDispatch } from 'react-redux';
import { changeURL, changeMethod } from './EndpointInputActions';
import { HTTP_METHODS, HttpMethod } from '../../../../../core/http_client/request';
import { Select } from 'antd';
import { SelectValue } from 'antd/lib/select';
import HighlightInput from '../../../base/HighlightInput/HighlightInput';
import styled from 'styled-components';

const MethodPicker = styled(Select)`
  width: 110px;

  .ant-select-selector {
    height: 40px !important;
    border-radius: 10px !important;
    display: flex;
    align-items: center;
  }
`;

type Props = {
  method: HttpMethod;
  url: string;
  onSend: () => void;
};

const EndpointInput: React.FunctionComponent<Props> = ({ method, url, onSend }) => {
  const dispatch = useDispatch();

  function handleURLChange(url: string): void {
    dispatch(changeURL(url));
  }

  function handleMethodChange(method: SelectValue): void {
    if (Array.isArray(method) || typeof method === 'number' || typeof method === 'object') return;
    dispatch(changeMethod(method as HttpMethod));
  }

  const HttpMethodPicker = (
    <MethodPicker value={method} onChange={handleMethodChange}>
      {HTTP_METHODS.map((methodName, idx) => (
        <Select.Option key={idx} value={methodName}>
          {methodName}
        </Select.Option>
      ))}
    </MethodPicker>
  );

  return (
    <HighlightInput
      addonBefore={HttpMethodPicker}
      value={url}
      colored
      size="large"
      style={{ height: 40 }}
      placeholder="http://localhost:8000/api/hello"
      onChange={(e): void => handleURLChange(e.target.value)}
      onPressEnter={onSend}
    />
  );
};

export default EndpointInput;
