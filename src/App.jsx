import { Layout, Button, theme } from 'antd';
import Logo from './components/logo';
import Menulist from './components/menulist';
import { useState } from 'react';
import Toggle from './components/toggletheme';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import SummaryContainer from './components/summarycontainer'; 

const { Header, Sider, Content } = Layout; 

function App() {
  const [darkTheme, setDarkTheme] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const {
    token: { colorBgContainer }
  } = theme.useToken();

  return (
    <Layout>
      <Sider
        theme={darkTheme ? 'dark' : 'light'}
        className="sidebar"
        collapsible
        collapsed={collapsed}
        trigger={null} 
      >
        <Logo darkTheme={darkTheme} />
        <Menulist darkTheme={darkTheme} />
        <Toggle darkTheme={darkTheme} toggleTheme={toggleTheme} />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
        </Header>

        {/* ✅ Added Summary Container here */}
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer
          }}
        >
          <SummaryContainer />
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;