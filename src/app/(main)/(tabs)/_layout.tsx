// app/(tabs)/_layout.tsx
//
// NOTE: `NativeTabs` accepts its colors as individual props rather
// than through `style`, so this is one of the few places where
// `useUnistyles` is the pragmatic choice — the alternative would be
// wrapping each color prop individually with `withUnistyles`.
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useUnistyles } from "react-native-unistyles";

const TabLayout = () => {
  const { theme } = useUnistyles();

  return (
    <NativeTabs
      iconColor={{
        default: theme.colors.mutedText,
        selected: theme.colors.primary,
      }}
      labelStyle={{
        default: { color: theme.colors.mutedText },
        selected: { color: theme.colors.primary },
      }}
      indicatorColor={theme.colors.primary}
      backgroundColor={theme.colors.surface}
      rippleColor={theme.colors.primaryIllumination}
      backBehavior="history"
      badgeBackgroundColor={theme.colors.primary}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock.fill" md="history" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabLayout;
