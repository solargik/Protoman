import React from 'react';
import { Row, Col } from 'antd';
import EnvPicker from './Env/EnvPicker';
import styled from 'styled-components';
import FlowNameView from './FlowName/FlowNameView';
import TrackerDevicePicker from './TrackerDevicePicker';

const PaddedRow = styled(Row)`
  padding: 0 0 16px 0;
  align-items: center;
`;

const LeftCol = styled(Col)`
  display: flex;
  min-height: 40px;
  align-items: center;
`;

const RightCol = styled(Col)`
  display: flex;
  min-height: 40px;
  justify-content: flex-end;
  align-items: center;
`;

const MidCol = styled(Col)`
  display: flex;
  min-height: 40px;
  justify-content: center;
  align-items: center;
`;

const ToolBar: React.FunctionComponent<unknown> = ({}) => {
  return (
    <PaddedRow>
      <LeftCol span={8}>
        <FlowNameView />
      </LeftCol>
      <MidCol span={8}>
        <TrackerDevicePicker />
      </MidCol>
      <RightCol span={8}>
        <EnvPicker />
      </RightCol>
    </PaddedRow>
  );
};

export default ToolBar;
