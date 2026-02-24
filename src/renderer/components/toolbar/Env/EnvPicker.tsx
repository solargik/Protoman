import React from 'react';
import { Select, Button, Modal, Divider } from 'antd';
import { SelectValue } from 'antd/lib/select';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from '../../../models/AppState';
import { EnvEditor } from './EnvEditor';
import { validateNewEnvName } from '../../../models/Env';
import { createEnv, switchEnv } from './EnvPickerActions';
import { selectEnvNames } from '../../../redux/store';
import styled from 'styled-components';

const ENV_MODAL_WIDTH = 800;

const Wrapper = styled('div')`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SettingsButton = styled(Button)`
  margin-left: 0;
`;

const EnvSelect = styled(Select)`
  width: 320px;
`;

const EnvPicker: React.FunctionComponent<unknown> = ({}) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const showModal = (): void => setModalVisible(true);
  const closeModal = (): void => setModalVisible(false);

  const currentEnv = useSelector((s: AppState) => s.currentEnv);
  const envNames = useSelector(selectEnvNames);
  const envList = useSelector((s: AppState) => s.envList);

  const dispatch = useDispatch();

  function checkName(name: string): boolean {
    return validateNewEnvName(name, envNames);
  }

  function createNewEnv(): void {
    const tmpName = 'Env';
    let tmpNameIdx = 1;
    while (!checkName(`${tmpName}${tmpNameIdx}`)) tmpNameIdx++;
    dispatch(createEnv(`${tmpName}${tmpNameIdx}`));
  }

  function handleEnvSwitch(newEnvName: SelectValue): void {
    if (Array.isArray(newEnvName) || typeof newEnvName === 'object') return;
    dispatch(switchEnv(newEnvName.toString()));
  }

  return (
    <>
      <Wrapper>
        <SettingsButton shape="circle" onClick={showModal}>
          <SettingOutlined />
        </SettingsButton>
      <EnvSelect
        onSelect={handleEnvSwitch}
        value={currentEnv}
        dropdownRender={(menu): React.ReactElement => (
          <div>
            {menu}
            <Divider style={{ margin: '4px 0' }} />
            <div
              style={{ padding: '8px 10px', cursor: 'pointer', fontWeight: 500 }}
              onMouseDown={(e): void => e.preventDefault()}
              onClick={createNewEnv}
            >
              <PlusOutlined /> New
            </div>
          </div>
        )}
      >
        {envList.map(([name], idx) => (
          <Select.Option key={idx} value={name}>
            {name}
          </Select.Option>
        ))}
      </EnvSelect>
      </Wrapper>
      {modalVisible ? (
        <Modal visible={modalVisible} footer={null} closable={false} destroyOnClose width={ENV_MODAL_WIDTH}>
          <EnvEditor onCancel={closeModal} />
        </Modal>
      ) : null}
    </>
  );
};

export default EnvPicker;
