import RoleTabs from '../../src/components/RoleTabs';

export default function StudentLayout() {
  return (
    <RoleTabs
      roles={['student']}
      tabs={[
        { name: 'index', title: 'tabs.rides', icon: 'car-outline' },
        { name: 'schedule', title: 'tabs.schedule', icon: 'time-outline' },
        { name: 'bookings', title: 'tabs.myRides', icon: 'ticket-outline' },
        { name: 'profile', title: 'tabs.profile', icon: 'person-outline' },
      ]}
      hidden={['captain/[id]', 'trip/[id]']}
    />
  );
}
