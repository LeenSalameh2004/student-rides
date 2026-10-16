import RoleTabs from '../../src/components/RoleTabs';

export default function AdminLayout() {
  return (
    <RoleTabs
      roles={['admin']}
      tabs={[
        { name: 'index', title: 'tabs.dashboard', icon: 'stats-chart-outline' },
        { name: 'captains', title: 'tabs.captains', icon: 'id-card-outline' },
        { name: 'trips', title: 'tabs.trips', icon: 'car-outline' },
        { name: 'users', title: 'tabs.users', icon: 'people-outline' },
      ]}
      hidden={['captain/[id]', 'trip/[id]']}
    />
  );
}
