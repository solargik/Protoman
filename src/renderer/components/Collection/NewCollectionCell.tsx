import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const TableData = styled('div')`
  padding: 14px 12px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const AddButton = styled(Button)`
  width: 100%;
  height: 38px;
  border-radius: 8px;
  font-weight: 600;
`;

type Props = {
  onCreate: () => void;
};

const NewCollectionCell: React.FunctionComponent<Props> = ({ onCreate }) => {
  return (
    <TableData>
      <AddButton type="dashed" onClick={onCreate}>
        <PlusOutlined />
        New Collection
      </AddButton>
    </TableData>
  );
};

export default NewCollectionCell;
