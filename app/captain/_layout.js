import RoleTabs from '../../src/components/RoleTabs';

export default function CaptainLayout() {
  return (
    <RoleTabs
      roles={['captain']}
      tabs={[
        { name: 'index', title: 'tabs.myTrips', icon: 'car-sport-outline' },
        { name: 'new-trip', title: 'tabs.newTrip', icon: 'add-circle-outline' },
        { name: 'requests', title: 'tabs.requests', icon: 'notifications-outline' },
        { name: 'profile', title: 'tabs.profile', icon: 'person-outline' },
      ]}
      hidden={['trip/[id]']}
    />
  );
}
