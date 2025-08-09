import { Menu  } from 'antd';
import { HomeOutlined  } from '@ant-design/icons';
import { AuditOutlined } from '@ant-design/icons';
import { CarryOutFilled } from '@ant-design/icons';

const Menulist = () => {
    return (
        <Menu theme='dark'>
            <Menu.Item key= 'home' icon= <HomeOutlined/> >
                Home
            </Menu.Item>
             <Menu.Item key= 'home' icon= <AuditOutlined/> >
                My Tasks
            </Menu.Item>
             <Menu.Item key= 'home' icon= <CarryOutFilled/> >
                My Meetings
            </Menu.Item>
        </Menu>
    );
}

export default Menulist