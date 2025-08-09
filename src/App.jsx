import { Layout } from 'antd';
import Logo from './components/logo';
import Menulist from './components/menulist';

const { Header, Sider } = Layout
function App() {
return(
  <Layout>
    <Sider className='sidebar'>
      <Logo/>
      <Menulist/>
    </Sider>
  </Layout>
);
}

export default App
