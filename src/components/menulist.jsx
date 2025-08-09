import { Menu  } from 'antd';
import { CarryOutOutlined, HomeOutlined  } from '@ant-design/icons';
import { AuditOutlined } from '@ant-design/icons';


const Menulist = ({darkTheme}) => {
    return (
        <Menu theme={darkTheme? 'dark' : 'light'} mode='inline' className='menu-bar'>
            <Menu.Item key= 'home' icon= <HomeOutlined/> >
                Home
            </Menu.Item>
             <Menu.Item key= 'tasks' icon= <AuditOutlined/> >
                My Tasks
            </Menu.Item>
             <Menu.Item key= 'meets' icon= <CarryOutOutlined/> >
                My Meetings
            </Menu.Item>
        </Menu>
    );
}

export default Menulist