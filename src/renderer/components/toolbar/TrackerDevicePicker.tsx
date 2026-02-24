import React from 'react';
import styled from 'styled-components';
import { Button, Select, Tooltip, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ipcChannels from '../../../ipc_channels';
import { updateEnv } from './Env/EnvPickerActions';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentEnvWithName } from '../../redux/store';
import { NetworkDevice } from '../../../core/network/device';
import { Env } from '../../models/Env';
import { Draft } from 'immer';

const Wrapper = styled('div')`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DeviceSelect = styled(Select)`
  width: 300px;
`;

const TARGET_VAR_NAME = 'trackerIp';

function upsertEnvVar(env: Env, key: string, value: string): Draft<Env> {
  let found = false;
  const nextVars: [string, string][] = env.vars.map(([k, v]) => {
    if (k === key) {
      found = true;
      return [k, value];
    }
    return [k, v];
  });

  if (!found) {
    nextVars.push([key, value]);
  }

  return { vars: nextVars };
}

const TrackerDevicePicker: React.FunctionComponent<unknown> = ({}) => {
  const dispatch = useDispatch();
  const currentEnvWithName = useSelector(selectCurrentEnvWithName);

  const [devices, setDevices] = React.useState<NetworkDevice[]>([]);
  const [selectedDeviceKey, setSelectedDeviceKey] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);

  const electron = window.require('electron');
  const ipcRenderer = electron.ipcRenderer;

  function handleScan(): void {
    setLoading(true);

    const onSuccess = (_event: unknown, [scanned]: [NetworkDevice[]]): void => {
      setLoading(false);
      const list = scanned || [];
      setDevices(list);
      if (list.length === 0) {
        message.info('No devices found in ARP table. Try reaching the tracker first, then scan again.');
      }
    };

    const onError = (_event: unknown, [err]: [string]): void => {
      setLoading(false);
      message.error(`Device scan failed: ${err}`);
    };

    ipcRenderer.once(ipcChannels.SCAN_NETWORK_DEVICES_SUCCESS, onSuccess);
    ipcRenderer.once(ipcChannels.SCAN_NETWORK_DEVICES_ERROR, onError);
    ipcRenderer.send(ipcChannels.SCAN_NETWORK_DEVICES);
  }

  function handleApplyTracker(): void {
    if (!currentEnvWithName) {
      message.error('No active environment found');
      return;
    }

    if (!selectedDeviceKey) {
      message.warn('Select a device first');
      return;
    }

    const selected = devices.find(d => `${d.mac}|${d.ip}` === selectedDeviceKey);
    if (!selected) {
      message.error('Selected device is no longer available');
      return;
    }

    const [envName, env] = currentEnvWithName;
    const newEnv = upsertEnvVar(env, TARGET_VAR_NAME, selected.ip);
    dispatch(updateEnv(envName, envName, newEnv));
    message.success(`trackerIP set to ${selected.ip} (${selected.mac})`);
  }

  return (
    <Wrapper>
      <Tooltip title="Scan local network devices (from ARP table)">
        <Button icon={<ReloadOutlined />} loading={loading} onClick={handleScan}>
          Scan
        </Button>
      </Tooltip>

      <DeviceSelect
        value={selectedDeviceKey}
        placeholder="Select tracker by MAC"
        onChange={(value): void => setSelectedDeviceKey(value.toString())}
        showSearch
        filterOption={(input, option): boolean => {
          return !!option && option.value.toString().toLowerCase().includes(input.toLowerCase());
        }}
      >
        {devices.map((d, idx) => {
          const key = `${d.mac}|${d.ip}`;
          return (
            <Select.Option key={idx} value={key}>
              {`${d.mac}  •  ${d.ip}`}
            </Select.Option>
          );
        })}
      </DeviceSelect>

      <Button type="primary" disabled={!selectedDeviceKey} onClick={handleApplyTracker}>
        Use IP
      </Button>
    </Wrapper>
  );
};

export default TrackerDevicePicker;
