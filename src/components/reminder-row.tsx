// components/reminder-row.tsx
//
// One reminder row. Subscribes to its own reminder data, its own
// status, and its own busy flag -- never to shared state that
// changes when a sibling toggles.
//
// Why this matters: an earlier version accepted a `swipeDisabled`
// prop derived from a shared `busy` boolean. Toggling any row
// flipped that boolean, so every row re-rendered, and the native
// Switch on Android re-animated on each re-render even when its
// value was unchanged. Own-state subscriptions prevent that.
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { MutedIcon } from "@/components/themed";
import { ToggleRow } from "@/components/toggle-row";
import {
  useReminderStatus,
  useRemindersStore,
  type ReminderStatus,
} from "@/store/reminders-store";
import React, { useRef } from "react";
import { View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

// -------------------------------------------------------------
// Constants
// -------------------------------------------------------------

const DELETE_WIDTH = 84;

const STATUS_LABEL: Record<ReminderStatus, string> = {
  scheduled: "Scheduled",
  blocked: "Notifications blocked",
  off: "Every Day",
  pending: "Saving…",
};

// -------------------------------------------------------------
// Delete action
// -------------------------------------------------------------

interface DeleteActionProps {
  drag: SharedValue<number>;
  onPress: () => void;
  testID?: string;
}

function DeleteAction({ drag, onPress, testID }: DeleteActionProps) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + DELETE_WIDTH }],
  }));

  return (
    <Animated.View style={[styles.deleteWrapper, style]}>
      <HapticPressable
        testID={testID}
        onPress={onPress}
        haptic="warning"
        accessibilityLabel="Delete reminder"
        style={styles.deleteButton}
      >
        <MutedIcon name="trash-outline" size={20} />
        <Text variant="caption" color="white" textAlign="center">
          Delete
        </Text>
      </HapticPressable>
    </Animated.View>
  );
}

// -------------------------------------------------------------
// Row
// -------------------------------------------------------------

export interface ReminderRowProps {
  reminderId: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  /** True when Smart Reminders is off. Stable per toggle. */
  disabled?: boolean;
  testID?: string;
}

export function ReminderRow({
  reminderId,
  onToggle,
  onDelete,
  disabled = false,
  testID,
}: ReminderRowProps) {
  // Subscribe to this reminder's own data. The store's optimistic
  // update replaces only the changed item, so unmodified items
  // retain reference equality and this selector bails.
  const reminder = useRemindersStore((s) =>
    s.reminders.find((r) => r.id === reminderId),
  );

  // Per-row status. Returns a primitive string. Sibling toggles
  // don't change our value, so Zustand bails.
  const status = useReminderStatus(reminderId);

  // Per-row busy flag. Returns a primitive boolean. Only flips
  // when THIS row starts or finishes processing.
  const isBusy = useRemindersStore((s) => s.busyIds[reminderId] === true);

  const swipeRef = useRef<SwipeableMethods>(null);

  // Bail for one frame during removal.
  if (!reminder) return null;

  const handleDelete = () => {
    swipeRef.current?.close();
    onDelete(reminder.id);
  };

  const renderRightActions = (
    _progress: SharedValue<number>,
    drag: SharedValue<number>,
  ) => (
    <DeleteAction
      drag={drag}
      onPress={handleDelete}
      testID={testID ? `${testID}-delete` : undefined}
    />
  );

  const subtitle = STATUS_LABEL[status];
  const isBlocked = status === "blocked";
  const swipeEnabled = !isBusy && !disabled;

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={DELETE_WIDTH * 0.5}
      overshootRight={false}
      enabled={swipeEnabled}
      renderRightActions={renderRightActions}
      containerStyle={styles.swipeContainer}
    >
      <View testID={testID} style={styles.wrapper}>
        <View
          style={styles.bell}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <MutedIcon
            name={
              isBlocked ? "notifications-off-outline" : "notifications-outline"
            }
            size={18}
          />
        </View>

        <ToggleRow
          label={reminder.label}
          subtitle={subtitle}
          value={reminder.enabled}
          onValueChange={() => onToggle(reminder.id)}
          disabled={disabled || isBusy}
          style={styles.toggle}
          testID={testID ? `${testID}-toggle` : undefined}
          switchTestID={testID ? `${testID}-switch` : undefined}
        />
      </View>
    </ReanimatedSwipeable>
  );
}

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------

const styles = StyleSheet.create((theme) => ({
  swipeContainer: {
    borderRadius: theme.radii.md,
    overflow: "hidden",
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
  },
  bell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.panel,
  },
  toggle: {
    flex: 1,
    paddingHorizontal: 0,
  },
  deleteWrapper: {
    width: DELETE_WIDTH,
    backgroundColor: theme.colors.danger,
  },
  deleteButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xxs,
  },
}));
