import Layout from './components/Layout';
import CalendarPlaceholder from './components/CalendarPlaceholder';

export default function Calendar() {
  return (
    <Layout title="Calendar" subtitle="View and manage appointments">
      <CalendarPlaceholder />
    </Layout>
  );
}
